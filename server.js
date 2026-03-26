const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_FILE = path.join(__dirname, "cache.json");
const CACHE_TTL_MINUTES = Number(process.env.CACHE_TTL_MINUTES || 45);

// -------------------- cache helpers --------------------

function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return { fetchedAt: null, lastUpdated: null, videos: [] };
    }

    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    return {
      fetchedAt: parsed.fetchedAt || null,
      lastUpdated: parsed.lastUpdated || null,
      videos: Array.isArray(parsed.videos) ? parsed.videos : []
    };
  } catch (error) {
    console.error("Cache read failed:", error.message);
    return { fetchedAt: null, lastUpdated: null, videos: [] };
  }
}

function writeCache(payload) {
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify(
        {
          fetchedAt: new Date().toISOString(),
          lastUpdated: payload.lastUpdated || new Date().toISOString(),
          videos: payload.videos || []
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (error) {
    console.error("Cache write failed:", error.message);
  }
}

function getCacheAgeMinutes(cache) {
  if (!cache?.fetchedAt) return Infinity;
  const ageMs = Date.now() - new Date(cache.fetchedAt).getTime();
  return Math.floor(ageMs / 60000);
}

function isCacheFresh(cache) {
  return (
    getCacheAgeMinutes(cache) < CACHE_TTL_MINUTES &&
    Array.isArray(cache.videos) &&
    cache.videos.length > 0
  );
}

// -------------------- seed fallback --------------------

function getSeedData() {
  const now = new Date().toISOString();

  const videos = [
    {
      id: "seed-brisket",
      title: "Texas Style Smoked Brisket",
      channelTitle: "BBQ Masters",
      channelId: "UCseedbrisket001",
      publishedAt: now,
      thumbnail:
        "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80",
      viewCount: 124000,
      likeCount: 5200,
      subscriberCount: 185000,
      smokeScore: 82,
      viewsPerHour: 3400,
      url: "https://www.youtube.com/results?search_query=Texas+Style+Smoked+Brisket"
    },
    {
      id: "seed-ribeye",
      title: "Reverse Sear Ribeye on Cast Iron",
      channelTitle: "Meat Lab",
      channelId: "UCseedribeye002",
      publishedAt: now,
      thumbnail:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
      viewCount: 89000,
      likeCount: 3400,
      subscriberCount: 96000,
      smokeScore: 75,
      viewsPerHour: 2500,
      url: "https://www.youtube.com/results?search_query=Reverse+Sear+Ribeye+Cast+Iron"
    },
    {
      id: "seed-ribs",
      title: "Beef Short Ribs Low and Slow",
      channelTitle: "Smoke House",
      channelId: "UCseedribs003",
      publishedAt: now,
      thumbnail:
        "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80",
      viewCount: 54000,
      likeCount: 2100,
      subscriberCount: 42000,
      smokeScore: 68,
      viewsPerHour: 1800,
      url: "https://www.youtube.com/results?search_query=Beef+Short+Ribs+Low+and+Slow"
    }
  ];

  return buildPayload(videos, {
    source: "seed",
    fallbackReason: "Offline fallback snapshot",
    fetchedAt: now,
    lastUpdated: now
  });
}

// -------------------- utilities --------------------

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
    viewsPerHour * 1.2 +
    likes * 3 +
    likeRate * 150000 +
    8000 / subscriberPenalty
  );
}

function extractKeywords(title) {
  const blacklist = new Set([
    "the", "and", "with", "from", "this", "that", "your", "you", "for",
    "bbq", "how", "make", "made", "best", "recipe", "food", "video", "guide",
    "home", "style", "cast", "iron", "reverse", "sear", "part", "tour"
  ]);

  return String(title || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !blacklist.has(word));
}

function isMeatRelevant(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  const includeWords = [
    "beef", "steak", "brisket", "ribeye", "tomahawk", "wagyu", "short ribs",
    "beef ribs", "smoked beef", "bbq beef", "tri tip", "tritip", "picanha",
    "sirloin", "strip steak", "porterhouse", "prime rib", "chuck roast",
    "tenderloin", "flank", "burnt ends", "meat"
  ];

  const excludeWords = [
    "pizza", "pasta", "cake", "cookie", "vegan", "vegetarian", "tofu",
    "salad", "dessert", "bread", "ice cream", "fish", "shrimp", "sushi"
  ];

  const hasInclude = includeWords.some(word => text.includes(word));
  const hasExclude = excludeWords.some(word => text.includes(word));

  return hasInclude && !hasExclude;
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

// -------------------- payload builder --------------------

function buildPayload(videosInput, meta = {}) {
  const videos = (videosInput || []).map(video => {
    const normalized = {
      id: video.id || "",
      title: video.title || "",
      channelTitle: video.channelTitle || video.channel || "Unknown Channel",
      channelId: video.channelId || "",
      publishedAt: video.publishedAt || new Date().toISOString(),
      thumbnail: video.thumbnail || "",
      viewCount: Number(video.viewCount ?? video.views ?? 0),
      likeCount: Number(video.likeCount ?? video.likes ?? 0),
      subscriberCount: Number(video.subscriberCount ?? 0),
      url: video.url || (video.id ? `https://youtube.com/watch?v=${video.id}` : "#")
    };

    normalized.viewsPerHour = Number(video.viewsPerHour || 0);
    normalized.smokeScore = Number(video.smokeScore || 0);

    if (!normalized.viewsPerHour) {
      normalized.viewsPerHour = Math.round(
        normalized.viewCount / getHoursSince(normalized.publishedAt)
      );
    }

    if (!normalized.smokeScore) {
      normalized.smokeScore = calculateSmokeScore(normalized);
    }

    return normalized;
  });

  const cleanedVideos = videos.filter(v =>
    v.title &&
    v.thumbnail &&
    (v.id || v.url) &&
    isMeatRelevant(v.title)
  );

  const sortedVideos = [...cleanedVideos].sort((a, b) => b.smokeScore - a.smokeScore);

  const totalViews = sortedVideos.reduce((sum, v) => sum + v.viewCount, 0);
  const totalLikes = sortedVideos.reduce((sum, v) => sum + v.likeCount, 0);
  const totalSmoke = sortedVideos.reduce((sum, v) => sum + v.smokeScore, 0);

  const summary = {
    totalViews,
    avgViews: sortedVideos.length ? Math.round(totalViews / sortedVideos.length) : 0,
    avgLikes: sortedVideos.length ? Math.round(totalLikes / sortedVideos.length) : 0,
    avgSmokeScore: sortedVideos.length ? Math.round(totalSmoke / sortedVideos.length) : 0
  };

  const channelMap = {};
  for (const v of sortedVideos) {
    if (!channelMap[v.channelTitle]) {
      channelMap[v.channelTitle] = {
        channelTitle: v.channelTitle,
        videos: 0,
        totalViews: 0,
        totalLikes: 0,
        smokeSum: 0
      };
    }

    channelMap[v.channelTitle].videos += 1;
    channelMap[v.channelTitle].totalViews += v.viewCount;
    channelMap[v.channelTitle].totalLikes += v.likeCount;
    channelMap[v.channelTitle].smokeSum += v.smokeScore;
  }

  const topChannels = Object.values(channelMap)
    .map(ch => ({
      ...ch,
      avgSmokeScore: ch.videos ? Math.round(ch.smokeSum / ch.videos) : 0
    }))
    .sort((a, b) => b.avgSmokeScore - a.avgSmokeScore)
    .slice(0, 8);

  const keywordCount = {};
  for (const v of sortedVideos) {
    const words = extractKeywords(v.title);
    for (const word of words) {
      keywordCount[word] = (keywordCount[word] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(keywordCount)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    source: meta.source || "cache",
    fetchedAt: meta.fetchedAt || null,
    lastUpdated: meta.lastUpdated || null,
    fallbackReason: meta.fallbackReason || null,
    cacheAgeMinutes: typeof meta.cacheAgeMinutes === "number" ? meta.cacheAgeMinutes : null,
    ttlMinutes: CACHE_TTL_MINUTES,
    total: sortedVideos.length,
    videos: sortedVideos,
    summary,
    topChannels,
    topKeywords
  };
}

// -------------------- live fetch --------------------

async function fetchLiveData() {
  if (!API_KEY) {
    throw new Error("Missing API key");
  }

  // מצומצם כדי לשמור quota
  const queries = [
    "smoked brisket steak bbq beef",
    "wagyu ribeye tomahawk beef ribs"
  ];

  let searchItems = [];

  for (const query of queries) {
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&order=date&q=${encodeURIComponent(query)}&key=${API_KEY}`;

    const searchData = await fetchJson(searchUrl);
    searchItems = searchItems.concat(searchData.items || []);
  }

  const uniqueVideoIds = [
    ...new Set(
      searchItems
        .filter(item =>
          item?.id?.videoId &&
          item?.snippet?.title &&
          isMeatRelevant(item.snippet.title, item.snippet.description || "")
        )
        .map(item => item.id.videoId)
    )
  ];

  if (!uniqueVideoIds.length) {
    return buildPayload([], {
      source: "live",
      fetchedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      fallbackReason: "No relevant meat video IDs returned"
    });
  }

  const videosUrl =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${uniqueVideoIds.join(",")}&key=${API_KEY}`;

  const videosData = await fetchJson(videosUrl);
  const rawVideos = (videosData.items || []).filter(v =>
    v?.id &&
    v?.snippet?.title &&
    v?.snippet?.channelId &&
    v?.status?.uploadStatus === "processed" &&
    isMeatRelevant(v.snippet.title, v.snippet.description || "")
  );

  if (!rawVideos.length) {
    return buildPayload([], {
      source: "live",
      fetchedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      fallbackReason: "No relevant video details returned"
    });
  }

  const uniqueChannelIds = [...new Set(
    rawVideos.map(v => v.snippet.channelId).filter(Boolean)
  )];

  const channelStatsMap = {};

  if (uniqueChannelIds.length) {
    const channelsUrl =
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${uniqueChannelIds.join(",")}&key=${API_KEY}`;

    const channelsData = await fetchJson(channelsUrl);

    for (const ch of (channelsData.items || [])) {
      channelStatsMap[ch.id] = ch.statistics || {};
    }
  }

  const videos = rawVideos.map(v => {
    const stats = v.statistics || {};
    const chStats = channelStatsMap[v.snippet.channelId] || {};

    return {
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
      subscriberCount: Number(chStats.subscriberCount || 0),
      url: `https://youtube.com/watch?v=${v.id}`
    };
  });

  return buildPayload(videos, {
    source: "live",
    fetchedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });
}

// -------------------- routes --------------------

app.get("/api/smoke-radar", async (req, res) => {
  const cache = readCache();
  const force = req.query.force === "1";

  if (!API_KEY) {
    const seed = getSeedData();
    return res.json({
      ...seed,
      source: "no-key",
      fallbackReason: "No API key configured, serving offline snapshot"
    });
  }

  if (!force && isCacheFresh(cache)) {
    return res.json(
      buildPayload(cache.videos, {
        source: "cache",
        fetchedAt: cache.fetchedAt,
        lastUpdated: cache.lastUpdated,
        cacheAgeMinutes: getCacheAgeMinutes(cache),
        fallbackReason: `Fresh cached snapshot served (TTL ${CACHE_TTL_MINUTES} min)`
      })
    );
  }

  try {
    const liveData = await fetchLiveData();

    if (liveData.videos.length > 0) {
      writeCache({
        lastUpdated: liveData.lastUpdated,
        videos: liveData.videos
      });
    }

    return res.json(liveData);
  } catch (error) {
    console.error("Live fetch failed:", error.message);

    if (cache.videos && cache.videos.length > 0) {
      return res.json(
        buildPayload(cache.videos, {
          source: "cache",
          fetchedAt: cache.fetchedAt,
          lastUpdated: cache.lastUpdated,
          cacheAgeMinutes: getCacheAgeMinutes(cache),
          fallbackReason: "Live fetch failed, serving saved cache"
        })
      );
    }

    const seed = getSeedData();
    return res.json({
      ...seed,
      source: "seed",
      fallbackReason: "Live fetch failed and no cache was available"
    });
  }
});

app.get("/api/debug/quota-mode", (req, res) => {
  const cache = readCache();

  res.json({
    ok: true,
    hasApiKey: Boolean(API_KEY),
    cacheFresh: isCacheFresh(cache),
    cacheAgeMinutes: getCacheAgeMinutes(cache),
    ttlMinutes: CACHE_TTL_MINUTES,
    cachedVideos: Array.isArray(cache.videos) ? cache.videos.length : 0
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Smoke Radar" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Smoke Radar server running on port ${PORT}`);
});
