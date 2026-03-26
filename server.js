const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

const CACHE_FILE = path.join(__dirname, "cache.json");
const STATE_FILE = path.join(__dirname, "runtime-state.json");

const CACHE_TTL_MINUTES = Number(process.env.CACHE_TTL_MINUTES || 120);
const LIVE_REFRESH_WINDOW_MINUTES = Number(process.env.LIVE_REFRESH_WINDOW_MINUTES || 90);
const QUOTA_COOLDOWN_MINUTES = Number(process.env.QUOTA_COOLDOWN_MINUTES || 360);

// -------------------- file helpers --------------------

function readJsonFileSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed reading ${path.basename(filePath)}:`, error.message);
    return fallback;
  }
}

function writeJsonFileSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Failed writing ${path.basename(filePath)}:`, error.message);
  }
}

// -------------------- cache helpers --------------------

function readCache() {
  const parsed = readJsonFileSafe(CACHE_FILE, {
    fetchedAt: null,
    lastUpdated: null,
    videos: []
  });

  return {
    fetchedAt: parsed.fetchedAt || null,
    lastUpdated: parsed.lastUpdated || null,
    videos: Array.isArray(parsed.videos) ? parsed.videos : []
  };
}

function writeCache(payload) {
  writeJsonFileSafe(CACHE_FILE, {
    fetchedAt: new Date().toISOString(),
    lastUpdated: payload.lastUpdated || new Date().toISOString(),
    videos: payload.videos || []
  });
}

function getCacheAgeMinutes(cache) {
  if (!cache?.fetchedAt) return Infinity;
  const ageMs = Date.now() - new Date(cache.fetchedAt).getTime();
  return Math.floor(ageMs / 60000);
}

function isCacheFresh(cache) {
  return (
    Array.isArray(cache?.videos) &&
    cache.videos.length > 0 &&
    getCacheAgeMinutes(cache) < CACHE_TTL_MINUTES
  );
}

// -------------------- runtime state helpers --------------------

function readRuntimeState() {
  const parsed = readJsonFileSafe(STATE_FILE, {
    quotaBlockedUntil: null,
    lastQuotaErrorAt: null,
    lastLiveAttemptAt: null,
    lastLiveSuccessAt: null,
    lastFailureReason: null
  });

  return {
    quotaBlockedUntil: parsed.quotaBlockedUntil || null,
    lastQuotaErrorAt: parsed.lastQuotaErrorAt || null,
    lastLiveAttemptAt: parsed.lastLiveAttemptAt || null,
    lastLiveSuccessAt: parsed.lastLiveSuccessAt || null,
    lastFailureReason: parsed.lastFailureReason || null
  };
}

function writeRuntimeState(partial) {
  const current = readRuntimeState();
  writeJsonFileSafe(STATE_FILE, {
    ...current,
    ...partial
  });
}

function isQuotaBlocked(state) {
  if (!state?.quotaBlockedUntil) return false;
  return Date.now() < new Date(state.quotaBlockedUntil).getTime();
}

function setQuotaBlocked() {
  const now = new Date();
  const blockedUntil = new Date(now.getTime() + QUOTA_COOLDOWN_MINUTES * 60000).toISOString();

  writeRuntimeState({
    lastQuotaErrorAt: now.toISOString(),
    quotaBlockedUntil: blockedUntil,
    lastFailureReason: "quotaExceeded"
  });

  return blockedUntil;
}

function clearQuotaBlocked() {
  writeRuntimeState({
    quotaBlockedUntil: null,
    lastFailureReason: null
  });
}

function shouldAttemptLive(cache, state, force = false) {
  if (force) return true;
  if (isQuotaBlocked(state)) return false;
  if (!cache?.videos?.length) return true;
  if (!cache.fetchedAt) return true;
  const cacheAge = getCacheAgeMinutes(cache);
  if (cacheAge < LIVE_REFRESH_WINDOW_MINUTES) return false;
  return true;
}

// -------------------- utilities --------------------

function getHoursSince(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  return Math.max((now - then) / (1000 * 60 * 60), 1);
}

function parseISODurationToSeconds(isoDuration) {
  if (!isoDuration || typeof isoDuration !== "string") return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds) {
  const s = Number(seconds || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
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

function inferRegion(title = "", channelTitle = "") {
  const text = `${title} ${channelTitle}`.trim();

  if (/[\u0590-\u05FF]/.test(text)) return "Israel / Hebrew";
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return "East Asia";
  if (/[\uac00-\ud7af]/.test(text)) return "Korea";
  if (/[\u0400-\u04FF]/.test(text)) return "Eastern Europe / Cyrillic";

  const lower = text.toLowerCase();

  if (/\b(brasil|brasileiro|churrasco|picanha)\b/.test(lower)) return "Brazil";
  if (/\b(asado|parrilla|argentina|mexico|mexican|español|espanol)\b/.test(lower)) return "Latin America / Spanish";
  if (/\b(texas|usa|america|american|bbq pit boys|kansas|memphis)\b/.test(lower)) return "United States";
  if (/\b(uk|britain|british|england|london)\b/.test(lower)) return "United Kingdom";
  if (/\b(australia|australian)\b/.test(lower)) return "Australia";
  if (/\b(france|french)\b/.test(lower)) return "France";
  if (/\b(germany|german)\b/.test(lower)) return "Germany";
  if (/\b(italy|italian)\b/.test(lower)) return "Italy";

  return "Global / English";
}

function fetchJsonErrorText(error) {
  return String(error?.message || error || "");
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

function errorLooksLikeQuota(error) {
  const text = fetchJsonErrorText(error);
  return text.includes("quotaExceeded");
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
      durationSeconds: Number(video.durationSeconds || 0),
      durationLabel: video.durationLabel || "0:00",
      regionLabel: video.regionLabel || inferRegion(video.title, video.channelTitle),
      url: video.url || (video.id ? `https://youtube.com/watch?v=${video.id}` : "#")
    };

    normalized.viewsPerHour = Number(video.viewsPerHour || 0);
    normalized.smokeScore = Number(video.smokeScore || 0);
    normalized.isShortForm = normalized.durationSeconds > 0 && normalized.durationSeconds <= 300;
    normalized.formatLabel = normalized.isShortForm ? "Short" : "Long-form";
    normalized.hoursSincePublished = getHoursSince(normalized.publishedAt);

    if (!normalized.viewsPerHour) {
      normalized.viewsPerHour = Math.round(
        normalized.viewCount / normalized.hoursSincePublished
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
    for (const word of extractKeywords(v.title)) {
      keywordCount[word] = (keywordCount[word] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(keywordCount)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const regionCount = {};
  for (const v of sortedVideos) {
    regionCount[v.regionLabel] = (regionCount[v.regionLabel] || 0) + 1;
  }

  const topRegions = Object.entries(regionCount)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const fastestBreakout = sortedVideos.length
    ? [...sortedVideos].sort((a, b) => b.viewsPerHour - a.viewsPerHour)[0]
    : null;

  const oldestActiveVideo = sortedVideos.length
    ? [...sortedVideos].sort((a, b) => b.hoursSincePublished - a.hoursSincePublished)[0]
    : null;

  const shortCount = sortedVideos.filter(v => v.isShortForm).length;
  const longCount = sortedVideos.length - shortCount;

  return {
    source: meta.source || "cache",
    fetchedAt: meta.fetchedAt || null,
    lastUpdated: meta.lastUpdated || null,
    fallbackReason: meta.fallbackReason || null,
    cacheAgeMinutes: typeof meta.cacheAgeMinutes === "number" ? meta.cacheAgeMinutes : null,
    ttlMinutes: CACHE_TTL_MINUTES,
    liveRefreshWindowMinutes: LIVE_REFRESH_WINDOW_MINUTES,
    quotaBlockedUntil: meta.quotaBlockedUntil || null,
    total: sortedVideos.length,
    videos: sortedVideos,
    summary,
    topChannels,
    topKeywords,
    topRegions,
    fastestBreakout,
    oldestActiveVideo,
    formatStats: {
      shortCount,
      longCount
    }
  };
}

// -------------------- seed fallback --------------------

function getSeedData() {
  const now = new Date().toISOString();

  const videos = [
    {
      id: "seed-brisket",
      title: "Texas Style Smoked Brisket",
      channelTitle: "BBQ Masters Texas",
      channelId: "UCseedbrisket001",
      publishedAt: "2025-10-01T12:00:00.000Z",
      thumbnail: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80",
      viewCount: 124000,
      likeCount: 5200,
      subscriberCount: 185000,
      durationSeconds: 842,
      durationLabel: "14:02",
      regionLabel: "United States",
      smokeScore: 82,
      viewsPerHour: 3400,
      url: "https://www.youtube.com/results?search_query=Texas+Style+Smoked+Brisket"
    },
    {
      id: "seed-ribeye",
      title: "Reverse Sear Ribeye on Cast Iron",
      channelTitle: "Meat Lab",
      channelId: "UCseedribeye002",
      publishedAt: "2026-03-20T10:00:00.000Z",
      thumbnail: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
      viewCount: 89000,
      likeCount: 3400,
      subscriberCount: 96000,
      durationSeconds: 255,
      durationLabel: "4:15",
      regionLabel: "Global / English",
      smokeScore: 75,
      viewsPerHour: 2500,
      url: "https://www.youtube.com/results?search_query=Reverse+Sear+Ribeye+Cast+Iron"
    },
    {
      id: "seed-ribs",
      title: "Beef Short Ribs Low and Slow",
      channelTitle: "Smoke House Brasil",
      channelId: "UCseedribs003",
      publishedAt: "2025-09-15T09:00:00.000Z",
      thumbnail: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80",
      viewCount: 54000,
      likeCount: 2100,
      subscriberCount: 42000,
      durationSeconds: 1012,
      durationLabel: "16:52",
      regionLabel: "Brazil",
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

// -------------------- live fetch --------------------

async function fetchLiveData() {
  if (!API_KEY) {
    throw new Error("Missing API key");
  }

  const queries = [
    "smoked brisket steak bbq beef",
    "wagyu ribeye tomahawk beef ribs",
    "picanha flank sirloin beef short ribs"
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
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status,contentDetails&id=${uniqueVideoIds.join(",")}&key=${API_KEY}`;

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
    const durationSeconds = parseISODurationToSeconds(v.contentDetails?.duration);

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
      durationSeconds,
      durationLabel: formatDuration(durationSeconds),
      regionLabel: inferRegion(v.snippet.title, v.snippet.channelTitle),
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
  const state = readRuntimeState();
  const force = req.query.force === "1";

  if (!API_KEY) {
    const seed = getSeedData();
    return res.json({
      ...seed,
      source: "no-key",
      fallbackReason: "No API key configured, serving offline snapshot"
    });
  }

  if (!shouldAttemptLive(cache, state, force)) {
    if (cache.videos && cache.videos.length > 0) {
      const fallbackReason = isQuotaBlocked(state)
        ? "Quota cooldown active, serving cached snapshot"
        : `Smart quota mode: serving cache until refresh window (${LIVE_REFRESH_WINDOW_MINUTES} min)`;

      return res.json(
        buildPayload(cache.videos, {
          source: "cache",
          fetchedAt: cache.fetchedAt,
          lastUpdated: cache.lastUpdated,
          cacheAgeMinutes: getCacheAgeMinutes(cache),
          quotaBlockedUntil: state.quotaBlockedUntil,
          fallbackReason
        })
      );
    }
  }

  if (!force && isCacheFresh(cache) && cache.videos.length > 0) {
    return res.json(
      buildPayload(cache.videos, {
        source: "cache",
        fetchedAt: cache.fetchedAt,
        lastUpdated: cache.lastUpdated,
        cacheAgeMinutes: getCacheAgeMinutes(cache),
        quotaBlockedUntil: state.quotaBlockedUntil,
        fallbackReason: `Fresh cached snapshot served (TTL ${CACHE_TTL_MINUTES} min)`
      })
    );
  }

  try {
    writeRuntimeState({
      lastLiveAttemptAt: new Date().toISOString()
    });

    const liveData = await fetchLiveData();

    if (liveData.videos.length > 0) {
      writeCache({
        lastUpdated: liveData.lastUpdated,
        videos: liveData.videos
      });
    }

    writeRuntimeState({
      lastLiveSuccessAt: new Date().toISOString(),
      lastFailureReason: null,
      quotaBlockedUntil: null
    });

    clearQuotaBlocked();

    return res.json(liveData);
  } catch (error) {
    console.error("Live fetch failed:", error.message);

    const isQuota = errorLooksLikeQuota(error);

    if (isQuota) {
      const blockedUntil = setQuotaBlocked();

      if (cache.videos && cache.videos.length > 0) {
        return res.json(
          buildPayload(cache.videos, {
            source: "cache",
            fetchedAt: cache.fetchedAt,
            lastUpdated: cache.lastUpdated,
            cacheAgeMinutes: getCacheAgeMinutes(cache),
            quotaBlockedUntil: blockedUntil,
            fallbackReason: "YouTube quota exceeded, cached snapshot locked in smart cooldown mode"
          })
        );
      }
    } else {
      writeRuntimeState({
        lastFailureReason: "liveFetchFailed"
      });
    }

    if (cache.videos && cache.videos.length > 0) {
      return res.json(
        buildPayload(cache.videos, {
          source: "cache",
          fetchedAt: cache.fetchedAt,
          lastUpdated: cache.lastUpdated,
          cacheAgeMinutes: getCacheAgeMinutes(cache),
          quotaBlockedUntil: readRuntimeState().quotaBlockedUntil,
          fallbackReason: "Live fetch failed, serving saved cache"
        })
      );
    }

    const seed = getSeedData();
    return res.json({
      ...seed,
      source: "seed",
      quotaBlockedUntil: readRuntimeState().quotaBlockedUntil,
      fallbackReason: isQuota
        ? "Quota exceeded and no cache available, serving offline seed"
        : "Live fetch failed and no cache was available"
    });
  }
});

app.get("/api/debug/quota-mode", (req, res) => {
  const cache = readCache();
  const state = readRuntimeState();

  res.json({
    ok: true,
    hasApiKey: Boolean(API_KEY),
    cacheFresh: isCacheFresh(cache),
    cacheAgeMinutes: getCacheAgeMinutes(cache),
    ttlMinutes: CACHE_TTL_MINUTES,
    liveRefreshWindowMinutes: LIVE_REFRESH_WINDOW_MINUTES,
    quotaCooldownMinutes: QUOTA_COOLDOWN_MINUTES,
    quotaBlocked: isQuotaBlocked(state),
    quotaBlockedUntil: state.quotaBlockedUntil,
    lastQuotaErrorAt: state.lastQuotaErrorAt,
    lastLiveAttemptAt: state.lastLiveAttemptAt,
    lastLiveSuccessAt: state.lastLiveSuccessAt,
    lastFailureReason: state.lastFailureReason,
    cachedVideos: Array.isArray(cache.videos) ? cache.videos.length : 0,
    shouldAttemptLiveNow: shouldAttemptLive(cache, state, false)
  });
});

app.get("/api/debug/system-check", (req, res) => {
  const cache = readCache();
  const state = readRuntimeState();

  const checks = [
    {
      name: "server",
      status: "pass",
      details: "Express server is running"
    },
    {
      name: "apiKey",
      status: API_KEY ? "pass" : "fail",
      details: API_KEY ? "YouTube API key is configured" : "Missing YouTube API key"
    },
    {
      name: "cacheFile",
      status: Array.isArray(cache.videos) ? "pass" : "fail",
      details: Array.isArray(cache.videos)
        ? `Cache loaded with ${cache.videos.length} videos`
        : "Cache file invalid"
    },
    {
      name: "cacheFreshness",
      status: isCacheFresh(cache) ? "pass" : (cache.videos.length ? "warn" : "fail"),
      details: cache.videos.length
        ? `Cache age: ${getCacheAgeMinutes(cache)} min`
        : "No cached videos available"
    },
    {
      name: "quotaBlock",
      status: isQuotaBlocked(state) ? "warn" : "pass",
      details: isQuotaBlocked(state)
        ? `Quota blocked until ${state.quotaBlockedUntil}`
        : "Quota not blocked"
    },
    {
      name: "liveEligibility",
      status: shouldAttemptLive(cache, state, false) ? "pass" : "warn",
      details: shouldAttemptLive(cache, state, false)
        ? "System may attempt a live refresh"
        : "System currently prefers cache"
    }
  ];

  const hasFail = checks.some(c => c.status === "fail");
  const hasWarn = checks.some(c => c.status === "warn");
  const overallStatus = hasFail ? "fail" : hasWarn ? "warn" : "pass";

  res.json({
    ok: overallStatus !== "fail",
    status: overallStatus,
    checkedAt: new Date().toISOString(),
    checks
  });
});

app.get("/health", (req, res) => {
  const cache = readCache();
  const state = readRuntimeState();

  res.json({
    ok: true,
    service: "Smoke Radar",
    hasApiKey: Boolean(API_KEY),
    cacheVideos: Array.isArray(cache.videos) ? cache.videos.length : 0,
    cacheAgeMinutes: getCacheAgeMinutes(cache),
    cacheFresh: isCacheFresh(cache),
    quotaBlocked: isQuotaBlocked(state),
    quotaBlockedUntil: state.quotaBlockedUntil || null,
    lastLiveSuccessAt: state.lastLiveSuccessAt || null
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Smoke Radar server running on port ${PORT}`);
});
