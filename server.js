const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

const CACHE_DIR = path.join(__dirname, "cache");
const CACHE_FILE = path.join(CACHE_DIR, "smoke-radar.json");

// cache in memory for faster responses
let memoryCache = {
  timestamp: 0,
  data: null
};

function ensureCacheExists() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}), "utf8");
  }
}

async function readFileCache() {
  try {
    ensureCacheExists();
    const raw = await fsp.readFile(CACHE_FILE, "utf8");
    if (!raw.trim()) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.payload) return null;

    return parsed;
  } catch (error) {
    console.error("Failed reading cache file:", error.message);
    return null;
  }
}

async function writeFileCache(payload) {
  try {
    ensureCacheExists();

    const dataToWrite = {
      lastUpdated: new Date().toISOString(),
      payload
    };

    await fsp.writeFile(CACHE_FILE, JSON.stringify(dataToWrite, null, 2), "utf8");
  } catch (error) {
    console.error("Failed writing cache file:", error.message);
  }
}

function getHoursSince(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  return Math.max((now - then) / (1000 * 60 * 60), 1);
}

function calculateSmokeScore(video) {
  const views = Number(video.viewCount || 0);
  const likes = Number(video.likeCount || 0);
  const subscribers = Number(video.subscriberCount || 0);
  const hours = getHoursSince(video.publishedAt);

  const viewsPerHour = views / hours;
  const likeRate = views > 0 ? likes / views : 0;
  const subscriberPenalty = subscribers > 0 ? Math.max(1, subscribers / 50000) : 1;

  return Math.round(
    (viewsPerHour * 1.2) +
    (likes * 3) +
    (likeRate * 150000) +
    (8000 / subscriberPenalty)
  );
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

function extractKeywords(title) {
  const blacklist = new Set([
    "the", "and", "with", "from", "this", "that", "your", "you", "for",
    "bbq", "how", "make", "made", "best", "recipe", "food", "meat",
    "smoked", "smoke", "grill", "grilling", "video"
  ]);

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !blacklist.has(word));
}

function buildPayload(rawVideos, channelMap) {
  const videos = rawVideos.map(v => {
    const stats = v.statistics || {};
    const chStats = channelMap[v.snippet.channelId] || {};

    const video = {
      id: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      channelId: v.snippet.channelId,
      publishedAt: v.snippet.publishedAt,
      thumbnail:
        v.snippet.thumbnails?.high?.url ||
        v.snippet.thumbnails?.medium?.url ||
        v.snippet.thumbnails?.default?.url ||
        "",
      viewCount: Number(stats.viewCount || 0),
      likeCount: Number(stats.likeCount || 0),
      subscriberCount: Number(chStats.subscriberCount || 0)
    };

    video.smokeScore = calculateSmokeScore(video);
    video.hoursSince = getHoursSince(video.publishedAt);
    video.viewsPerHour = Math.round(video.viewCount / video.hoursSince);

    return video;
  });

  videos.sort((a, b) => b.smokeScore - a.smokeScore);

  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
  const totalSmoke = videos.reduce((sum, v) => sum + v.smokeScore, 0);

  const channelAgg = {};
  for (const v of videos) {
    if (!channelAgg[v.channelTitle]) {
      channelAgg[v.channelTitle] = {
        channelTitle: v.channelTitle,
        videos: 0,
        totalViews: 0,
        totalLikes: 0,
        smokeSum: 0
      };
    }

    channelAgg[v.channelTitle].videos += 1;
    channelAgg[v.channelTitle].totalViews += v.viewCount;
    channelAgg[v.channelTitle].totalLikes += v.likeCount;
    channelAgg[v.channelTitle].smokeSum += v.smokeScore;
  }

  const topChannels = Object.values(channelAgg)
    .map(ch => ({
      ...ch,
      avgSmokeScore: Math.round(ch.smokeSum / ch.videos)
    }))
    .sort((a, b) => b.avgSmokeScore - a.avgSmokeScore)
    .slice(0, 8);

  const keywordMap = {};
  for (const v of videos) {
    const words = extractKeywords(v.title);
    for (const word of words) {
      keywordMap[word] = (keywordMap[word] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(keywordMap)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const chartData = videos.slice(0, 12).map(v => ({
    title: v.title.length > 26 ? v.title.slice(0, 26) + "..." : v.title,
    smokeScore: v.smokeScore,
    views: v.viewCount,
    likes: v.likeCount,
    viewsPerHour: v.viewsPerHour
  }));

  return {
    videos: videos.slice(0, 24),
    total: videos.length,
    summary: {
      totalViews,
      avgViews: Math.round(totalViews / Math.max(videos.length, 1)),
      avgLikes: Math.round(totalLikes / Math.max(videos.length, 1)),
      avgSmokeScore: Math.round(totalSmoke / Math.max(videos.length, 1))
    },
    topChannels,
    topKeywords,
    chartData
  };
}

async function getFreshData() {
  if (!API_KEY) {
    throw new Error("Missing API key in Render");
  }

  // low quota mode: only 2 search calls
  const queries = [
    "bbq brisket steak",
    "wagyu tomahawk beef ribs"
  ];

  let searchItems = [];

  for (const query of queries) {
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&order=date&q=${encodeURIComponent(query)}&key=${API_KEY}`;

    const searchData = await fetchJson(searchUrl);
    searchItems = searchItems.concat(searchData.items || []);
  }

  const uniqueVideoIds = [...new Set(
    searchItems.map(item => item?.id?.videoId).filter(Boolean)
  )];

  if (!uniqueVideoIds.length) {
    return {
      videos: [],
      total: 0,
      summary: {
        totalViews: 0,
        avgViews: 0,
        avgLikes: 0,
        avgSmokeScore: 0
      },
      topChannels: [],
      topKeywords: [],
      chartData: [],
      debug: "No video IDs returned from YouTube search"
    };
  }

  const videosUrl =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${uniqueVideoIds.join(",")}&key=${API_KEY}`;

  const videosData = await fetchJson(videosUrl);
  const rawVideos = videosData.items || [];

  if (!rawVideos.length) {
    return {
      videos: [],
      total: 0,
      summary: {
        totalViews: 0,
        avgViews: 0,
        avgLikes: 0,
        avgSmokeScore: 0
      },
      topChannels: [],
      topKeywords: [],
      chartData: [],
      debug: "Video details request returned no items"
    };
  }

  const uniqueChannelIds = [...new Set(
    rawVideos.map(v => v.snippet.channelId).filter(Boolean)
  )];

  const channelsUrl =
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${uniqueChannelIds.join(",")}&key=${API_KEY}`;

  const channelsData = await fetchJson(channelsUrl);
  const channelMap = {};

  (channelsData.items || []).forEach(ch => {
    channelMap[ch.id] = ch.statistics || {};
  });

  return buildPayload(rawVideos, channelMap);
}

app.get("/api/smoke-radar", async (req, res) => {
  try {
    ensureCacheExists();

    const now = Date.now();
    const memoryAgeMs = now - memoryCache.timestamp;

    // serve memory cache for 60 minutes
    if (memoryCache.data && memoryAgeMs < 60 * 60 * 1000) {
      return res.json({
        ...memoryCache.data,
        cached: true,
        cacheSource: "memory",
        lastUpdated: new Date(memoryCache.timestamp).toISOString()
      });
    }

    try {
      const freshPayload = await getFreshData();

      memoryCache = {
        timestamp: now,
        data: freshPayload
      };

      await writeFileCache(freshPayload);

      return res.json({
        ...freshPayload,
        cached: false,
        cacheSource: "live",
        lastUpdated: new Date().toISOString()
      });
    } catch (liveError) {
      console.error("Live fetch failed, trying cache:", liveError.message);

      // fallback to file cache
      const fileCache = await readFileCache();
      if (fileCache && fileCache.payload) {
        memoryCache = {
          timestamp: new Date(fileCache.lastUpdated).getTime(),
          data: fileCache.payload
        };

        return res.json({
          ...fileCache.payload,
          cached: true,
          cacheSource: "file",
          lastUpdated: fileCache.lastUpdated,
          fallbackReason: "Live fetch failed, serving cached results"
        });
      }

      // no cache at all
      throw liveError;
    }
  } catch (error) {
    console.error("Smoke Radar error:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
