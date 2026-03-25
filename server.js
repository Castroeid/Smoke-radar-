const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// 30-minute in-memory cache
let cache = {
  timestamp: 0,
  data: null
};

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

app.get("/api/smoke-radar", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing API key in Render"
      });
    }

    const now = Date.now();
    const cacheAgeMs = now - cache.timestamp;

    if (cache.data && cacheAgeMs < 30 * 60 * 1000) {
      return res.json({
        ...cache.data,
        cached: true,
        cacheMinutesRemaining: Math.ceil((30 * 60 * 1000 - cacheAgeMs) / 60000)
      });
    }

    // Only 2 expensive search calls
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
      const emptyPayload = {
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

      cache = {
        timestamp: now,
        data: emptyPayload
      };

      return res.json({ ...emptyPayload, cached: false });
    }

    const videosUrl =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${uniqueVideoIds.join(",")}&key=${API_KEY}`;

    const videosData = await fetchJson(videosUrl);
    const rawVideos = videosData.items || [];

    if (!rawVideos.length) {
      const emptyPayload = {
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

      cache = {
        timestamp: now,
        data: emptyPayload
      };

      return res.json({ ...emptyPayload, cached: false });
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

    const payload = {
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

    cache = {
      timestamp: now,
      data: payload
    };

    return res.json({
      ...payload,
      cached: false,
      cacheMinutesRemaining: 30
    });
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
