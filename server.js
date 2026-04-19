const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const CACHE_FILE = path.join(__dirname, "cache.json");
const STATE_FILE = path.join(__dirname, "runtime-state.json");

const CACHE_TTL_MINUTES = Number(process.env.CACHE_TTL_MINUTES || 120);
const LIVE_REFRESH_WINDOW_MINUTES = Number(process.env.LIVE_REFRESH_WINDOW_MINUTES || 120);
const QUOTA_COOLDOWN_MINUTES = Number(process.env.QUOTA_COOLDOWN_MINUTES || 360);

// ---------------- file helpers ----------------

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

function nowIso() {
  return new Date().toISOString();
}

// ---------------- cache/state ----------------

function readCache() {
  return readJsonFileSafe(CACHE_FILE, {
    fetchedAt: null,
    source: "seed",
    videos: []
  });
}

function writeCache(videos, source = "live") {
  writeJsonFileSafe(CACHE_FILE, {
    fetchedAt: nowIso(),
    source,
    videos
  });
}

function readRuntimeState() {
  return readJsonFileSafe(STATE_FILE, {
    quotaBlockedUntil: null,
    lastLiveSuccessAt: null
  });
}

function writeRuntimeState(patch) {
  const current = readRuntimeState();
  writeJsonFileSafe(STATE_FILE, {
    ...current,
    ...patch
  });
}

function getCacheAgeMinutes(cache) {
  if (!cache?.fetchedAt) return null;
  const diffMs = Date.now() - new Date(cache.fetchedAt).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

function isCacheFresh(cache) {
  const age = getCacheAgeMinutes(cache);
  if (age === null) return false;
  return age <= CACHE_TTL_MINUTES;
}

function isWithinLiveRefreshWindow(cache) {
  const age = getCacheAgeMinutes(cache);
  if (age === null) return false;
  return age <= LIVE_REFRESH_WINDOW_MINUTES;
}

function isQuotaBlocked(state) {
  return Boolean(
    state?.quotaBlockedUntil &&
      new Date(state.quotaBlockedUntil).getTime() > Date.now()
  );
}

function quotaLooksExceeded(errorText = "") {
  const t = String(errorText).toLowerCase();
  return (
    t.includes("quota") ||
    t.includes("quotaexceeded") ||
    t.includes("dailylimitexceeded") ||
    t.includes("ratelimit")
  );
}

// ---------------- formatting helpers ----------------

function formatDuration(isoDuration = "") {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function parseDurationSeconds(isoDuration = "") {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function getFormatLabel(durationSeconds = 0) {
  if (durationSeconds <= 300) return "Short";
  return "Long-form";
}

function estimateRegion(video) {
  const text = `${video.title || ""} ${video.channelTitle || ""}`.toLowerCase();

  if (text.includes("texas") || text.includes("usa") || text.includes("bbq")) return "US";
  if (text.includes("argentina")) return "Argentina";
  if (text.includes("brazil") || text.includes("picanha")) return "Brazil";
  if (text.includes("korea")) return "Korea";
  if (text.includes("japan") || text.includes("wagyu")) return "Japan";
  return "Global";
}

function buildTopKeywords(videos) {
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "your", "you", "how",
    "bbq", "best", "make", "made", "recipe", "guide", "video", "short", "long",
    "ultimate", "easy", "perfect", "on", "a", "an", "of", "to", "in", "is"
  ]);

  const freq = {};

  for (const video of videos) {
    const words = String(video.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter(word => word.length > 2 && !stopWords.has(word));

    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([keyword, count]) => ({ keyword, count }));
}

function buildTopChannels(videos) {
  const map = new Map();

  for (const v of videos) {
    const key = v.channelTitle || "Unknown";
    if (!map.has(key)) {
      map.set(key, {
        channelTitle: key,
        videos: 0,
        totalViews: 0,
        totalSmokeScore: 0
      });
    }

    const row = map.get(key);
    row.videos += 1;
    row.totalViews += Number(v.viewCount || 0);
    row.totalSmokeScore += Number(v.smokeScore || 0);
  }

  return [...map.values()]
    .map(row => ({
      ...row,
      avgSmokeScore: Math.round(row.totalSmokeScore / Math.max(row.videos, 1))
    }))
    .sort((a, b) => b.avgSmokeScore - a.avgSmokeScore)
    .slice(0, 8);
}

function buildTopRegions(videos) {
  const map = new Map();

  for (const v of videos) {
    const region = v.regionLabel || "Global";
    map.set(region, (map.get(region) || 0) + 1);
  }

  return [...map.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function summarizeVideos(videos) {
  const totalViews = videos.reduce((sum, v) => sum + Number(v.viewCount || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + Number(v.likeCount || 0), 0);
  const totalSmoke = videos.reduce((sum, v) => sum + Number(v.smokeScore || 0), 0);

  return {
    totalViews,
    avgViews: videos.length ? Math.round(totalViews / videos.length) : 0,
    avgLikes: videos.length ? Math.round(totalLikes / videos.length) : 0,
    avgSmokeScore: videos.length ? Math.round(totalSmoke / videos.length) : 0
  };
}

function buildFormatStats(videos) {
  let shortCount = 0;
  let longCount = 0;

  for (const v of videos) {
    if ((v.durationSeconds || 0) <= 300) shortCount += 1;
    else longCount += 1;
  }

  return { shortCount, longCount };
}

function enrichVideos(videos) {
  return videos.map(video => {
    const durationSeconds = Number(video.durationSeconds || 0);
    const hoursSincePublished =
      video.publishedAt
        ? Math.max(1, (Date.now() - new Date(video.publishedAt).getTime()) / 3600000)
        : 1;

    const views = Number(video.viewCount || 0);
    const likes = Number(video.likeCount || 0);
    const subscribers = Number(video.subscriberCount || 0);

    const viewsPerHour = Math.round(views / hoursSincePublished);

    const smokeScore = Math.round(
      Math.min(
        100,
        viewsPerHour / 80 +
          likes / 120 +
          Math.min(subscribers / 50000, 15)
      )
    );

    return {
      ...video,
      durationSeconds,
      durationLabel: video.durationLabel || formatDuration(video.duration || ""),
      formatLabel: getFormatLabel(durationSeconds),
      regionLabel: video.regionLabel || estimateRegion(video),
      hoursSincePublished,
      viewsPerHour,
      smokeScore
    };
  });
}

// ---------------- seed fallback ----------------

function getSeedVideos() {
  return enrichVideos([
    {
      id: "seed1",
      title: "Reverse Sear Ribeye on Cast Iron",
      thumbnail: "https://i.ytimg.com/vi/2s5w5sY9Xqs/hqdefault.jpg",
      channelTitle: "Smoke House",
      channelId: "",
      url: "https://www.youtube.com/watch?v=2s5w5sY9Xqs",
      publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      durationSeconds: 420,
      durationLabel: "7:00",
      viewCount: 54000,
      likeCount: 3600,
      subscriberCount: 120000,
      regionLabel: "US"
    },
    {
      id: "seed2",
      title: "Texas Style Smoked Brisket Guide",
      thumbnail: "https://i.ytimg.com/vi/VWQ1J4mrM3Y/hqdefault.jpg",
      channelTitle: "BBQ Masters",
      channelId: "",
      url: "https://www.youtube.com/watch?v=VWQ1J4mrM3Y",
      publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
      durationSeconds: 840,
      durationLabel: "14:00",
      viewCount: 124000,
      likeCount: 5200,
      subscriberCount: 185000,
      regionLabel: "US"
    },
    {
      id: "seed3",
      title: "Picanha Over Fire",
      thumbnail: "https://i.ytimg.com/vi/7gqX7C7nH3A/hqdefault.jpg",
      channelTitle: "Fire & Fat",
      channelId: "",
      url: "https://www.youtube.com/watch?v=7gqX7C7nH3A",
      publishedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
      durationSeconds: 290,
      durationLabel: "4:50",
      viewCount: 62000,
      likeCount: 4100,
      subscriberCount: 98000,
      regionLabel: "Brazil"
    }
  ]);
}

// ---------------- youtube fetch ----------------

async function fetchJson(url) {
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || `Request failed: ${response.status}`);
  }

  return json;
}

function buildSearchQuery() {
  return "beef steak brisket bbq smoked ribeye picanha";
}

async function fetchLiveVideosFromYouTube() {
  if (!API_KEY) {
    throw new Error("Missing API key");
  }

  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date` +
    `&maxResults=12&q=${encodeURIComponent(buildSearchQuery())}&key=${API_KEY}`;

  const searchData = await fetchJson(searchUrl);

  const ids = (searchData.items || [])
    .map(item => item?.id?.videoId)
    .filter(Boolean);

  if (!ids.length) return [];

  const videosUrl =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids.join(",")}&key=${API_KEY}`;

  const videosData = await fetchJson(videosUrl);

  return (videosData.items || []).map(item => ({
    id: item.id,
    title: item.snippet?.title || "Untitled",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "",
    channelTitle: item.snippet?.channelTitle || "Unknown Channel",
    channelId: item.snippet?.channelId || "",
    url: `https://www.youtube.com/watch?v=${item.id}`,
    publishedAt: item.snippet?.publishedAt || null,
    duration: item.contentDetails?.duration || "PT0M0S",
    durationLabel: formatDuration(item.contentDetails?.duration || "PT0M0S"),
    durationSeconds: parseDurationSeconds(item.contentDetails?.duration || "PT0M0S"),
    viewCount: Number(item.statistics?.viewCount || 0),
    likeCount: Number(item.statistics?.likeCount || 0),
    subscriberCount: 0
  }));
}

// ---------------- response builder ----------------

function buildRadarResponse({ source, videos, cache, state, fallbackReason = null }) {
  const enriched = enrichVideos(videos);
  const summary = summarizeVideos(enriched);
  const topChannels = buildTopChannels(enriched);
  const topKeywords = buildTopKeywords(enriched);
  const topRegions = buildTopRegions(enriched);
  const formatStats = buildFormatStats(enriched);

  const fastestBreakout = [...enriched]
    .sort((a, b) => Number(b.viewsPerHour || 0) - Number(a.viewsPerHour || 0))[0] || null;

  const oldestActiveVideo = [...enriched]
    .sort((a, b) => Number(b.hoursSincePublished || 0) - Number(a.hoursSincePublished || 0))[0] || null;

  return {
    source,
    fallbackReason,
    ttlMinutes: CACHE_TTL_MINUTES,
    liveRefreshWindowMinutes: LIVE_REFRESH_WINDOW_MINUTES,
    quotaBlockedUntil: state?.quotaBlockedUntil || null,
    lastLiveSuccessAt: state?.lastLiveSuccessAt || null,
    lastUpdated: cache?.fetchedAt || nowIso(),
    cacheAgeMinutes: getCacheAgeMinutes(cache),
    summary,
    formatStats,
    topChannels,
    topKeywords,
    topRegions,
    fastestBreakout,
    oldestActiveVideo,
    videos: enriched
  };
}


function parseCoordinate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildNearbyPlaceResult(place = {}) {
  return {
    name: place.displayName?.text || "Unknown",
    address: place.formattedAddress || "",
    rating: Number(place.rating || 0) || null,
    userRatingsTotal: Number(place.userRatingCount || 0),
    location: {
      lat: Number(place.location?.latitude || 0),
      lng: Number(place.location?.longitude || 0)
    },
    mapsUrl: place.googleMapsUri || ""
  };
}

async function fetchButchersNearby({ lat, lng, maxResults = 8 }) {
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!placesApiKey) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const endpoint = "https://places.googleapis.com/v1/places:searchText";
  const queries = ["butcher", "butcher shop", "meat shop", "קצביה"];

  const requests = queries.map(async (query) => {
    const body = {
      textQuery: query,
      maxResultCount: maxResults,
      languageCode: "en",
      locationBias: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: 7000
        }
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": placesApiKey,
        "X-Goog-FieldMask": [
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.location",
          "places.googleMapsUri"
        ].join(",")
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      const details = data?.error?.message || `Google Places request failed (${response.status})`;
      throw new Error(details);
    }

    return data?.places || [];
  });

  const listOfLists = await Promise.all(requests);
  const merged = listOfLists.flat();

  const uniqueMap = new Map();
  for (const place of merged) {
    const placeKey = `${place.displayName?.text || ""}_${place.formattedAddress || ""}`;
    if (!uniqueMap.has(placeKey)) {
      uniqueMap.set(placeKey, place);
    }
  }

  return [...uniqueMap.values()]
    .sort((a, b) => {
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.userRatingCount || 0) - Number(a.userRatingCount || 0);
    })
    .slice(0, maxResults)
    .map(buildNearbyPlaceResult);
}

// ---------------- endpoints ----------------

app.get("/api/butchers-nearby", async (req, res) => {
  const lat = parseCoordinate(req.query.lat);
  const lng = parseCoordinate(req.query.lng);

  console.log("[butchers-nearby] incoming request:", { lat: req.query.lat, lng: req.query.lng });

  if (lat === null || lng === null) {
    console.warn("[butchers-nearby] invalid coordinates", { lat: req.query.lat, lng: req.query.lng });
    return res.status(400).json({ error: "Invalid or missing lat/lng query parameters" });
  }

  try {
    const places = await fetchButchersNearby({ lat, lng, maxResults: 8 });
    console.log("[butchers-nearby] places found:", places.length);
    return res.json(places);
  } catch (error) {
    console.error("[butchers-nearby] failed:", error.message);
    return res.status(500).json({
      error: "Failed to fetch nearby butchers",
      details: error.message || "Unknown error"
    });
  }
});

app.get("/api/smoke-radar", async (req, res) => {
  const cache = readCache();
  const state = readRuntimeState();

  if (!API_KEY) {
    const seedVideos = cache.videos?.length ? cache.videos : getSeedVideos();
    return res.json(
      buildRadarResponse({
        source: cache.videos?.length ? "no-key" : "seed",
        videos: seedVideos,
        cache,
        state,
        fallbackReason: "Missing YOUTUBE_API_KEY"
      })
    );
  }

  if (isQuotaBlocked(state)) {
    const fallbackVideos = cache.videos?.length ? cache.videos : getSeedVideos();
    return res.json(
      buildRadarResponse({
        source: "cache",
        videos: fallbackVideos,
        cache,
        state,
        fallbackReason: "System currently prefers cache"
      })
    );
  }

  if (cache.videos?.length && isWithinLiveRefreshWindow(cache)) {
    return res.json(
      buildRadarResponse({
        source: "cache",
        videos: cache.videos,
        cache,
        state,
        fallbackReason: "Fresh cached window"
      })
    );
  }

  try {
    const liveVideos = await fetchLiveVideosFromYouTube();

    if (!liveVideos.length) {
      const fallbackVideos = cache.videos?.length ? cache.videos : getSeedVideos();
      return res.json(
        buildRadarResponse({
          source: "cache",
          videos: fallbackVideos,
          cache,
          state,
          fallbackReason: "No live videos returned"
        })
      );
    }

    writeCache(liveVideos, "live");
    writeRuntimeState({
      quotaBlockedUntil: null,
      lastLiveSuccessAt: nowIso()
    });

    const freshCache = readCache();

    return res.json(
      buildRadarResponse({
        source: "live",
        videos: liveVideos,
        cache: freshCache,
        state: readRuntimeState(),
        fallbackReason: null
      })
    );
  } catch (error) {
    console.error("smoke-radar live fetch failed:", error.message);

    if (quotaLooksExceeded(error.message)) {
      const blockedUntil = new Date(
        Date.now() + QUOTA_COOLDOWN_MINUTES * 60000
      ).toISOString();

      writeRuntimeState({
        quotaBlockedUntil: blockedUntil
      });
    }

    const fallbackVideos = cache.videos?.length ? cache.videos : getSeedVideos();

    return res.json(
      buildRadarResponse({
        source: "cache",
        videos: fallbackVideos,
        cache,
        state: readRuntimeState(),
        fallbackReason: error.message || "Live fetch failed"
      })
    );
  }
});

app.get("/api/ai-recipe", async (req, res) => {
  const sanitizeStringList = (value, fallback = []) =>
    Array.isArray(value)
      ? value
          .map(item => String(item || "").trim())
          .filter(Boolean)
      : fallback;

  const sanitizeObjectList = (value) =>
    Array.isArray(value) ? value.filter(item => item && typeof item === "object") : [];

  const toSeedNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : Date.now();
  };

  const buildFallbackSmartRecipe = ({ cut, method, flavor, seed }) => {
    const sauces = [
      {
        name: "Smoky Garlic Butter",
        description: "Rich and glossy, great for basting and finishing slices.",
        ingredients: [
          "3 tbsp unsalted butter",
          "1 minced garlic clove",
          "1 tsp smoked paprika",
          "Pinch of salt",
          "1 tsp lemon juice"
        ],
        steps: [
          "Melt butter on low heat.",
          "Stir in garlic and paprika for 30 seconds.",
          "Add salt and lemon juice, then serve warm."
        ]
      },
      {
        name: "Pepper Mustard Glaze",
        description: "Tangy with a little heat, ideal for bark-heavy cuts.",
        ingredients: [
          "2 tbsp Dijon mustard",
          "1 tbsp honey",
          "1 tsp cracked black pepper",
          "1 tsp apple cider vinegar"
        ],
        steps: [
          "Whisk all ingredients until smooth.",
          "Brush lightly in the final minutes of cooking.",
          "Serve extra on the side."
        ]
      },
      {
        name: "Herb Chimichurri",
        description: "Fresh, sharp, and bright to balance rich meat.",
        ingredients: [
          "1 cup chopped parsley",
          "2 tbsp chopped oregano",
          "2 minced garlic cloves",
          "3 tbsp red wine vinegar",
          "1/3 cup olive oil"
        ],
        steps: [
          "Mix herbs and garlic in a bowl.",
          "Add vinegar and oil, then season with salt.",
          "Let rest 10 minutes before serving."
        ]
      }
    ];

    const sides = [
      {
        name: "Charred Corn with Lime",
        description: "Sweet smoky kernels with citrus lift."
      },
      {
        name: "Crispy Herb Potatoes",
        description: "Golden bite-size potatoes with rosemary and sea salt."
      },
      {
        name: "Grilled Asparagus",
        description: "Quick blistered greens with olive oil and pepper."
      }
    ];

    const sauceShift = toSeedNumber(seed) % sauces.length;
    const sideShift = toSeedNumber(seed) % sides.length;

    return {
      main: {
        title: `${flavor || "Bold"} ${cut || "Meat"} (${method || "Cooked"})`,
        description: `A concise ${flavor || "savory"} main recipe built for ${method || "high-heat cooking"}.`,
        ingredients: [
          `${cut || "Main cut"} (about 2 lb)`,
          "Kosher salt",
          "Black pepper",
          "2 tbsp neutral oil",
          `1 tsp ${flavor || "signature"} seasoning`
        ],
        steps: [
          `Preheat for ${method || "your method"} and season the meat evenly.`,
          "Cook until crust forms, then manage heat to finish evenly.",
          "Rest 8-10 minutes, slice, and serve."
        ]
      },
      sauces: [sauces[sauceShift], sauces[(sauceShift + 1) % sauces.length], sauces[(sauceShift + 2) % sauces.length]],
      sides: [sides[sideShift], sides[(sideShift + 1) % sides.length], sides[(sideShift + 2) % sides.length]]
    };
  };

  const normalizeSmartRecipe = (payload, context = {}) => {
    const fallback = buildFallbackSmartRecipe(context);
    const normalized = payload && typeof payload === "object" ? payload : {};

    const main = normalized.main && typeof normalized.main === "object" ? normalized.main : {};

    const sauces = sanitizeObjectList(normalized.sauces).map((entry) => {
      const item = entry && typeof entry === "object" ? entry : {};
      return {
        name: String(item.name || "Sauce pairing").trim(),
        description: String(item.description || "Complements the main recipe.").trim(),
        ingredients: sanitizeStringList(item.ingredients),
        steps: sanitizeStringList(item.steps)
      };
    }).filter(item => item.name);

    const sides = sanitizeObjectList(normalized.sides).map((entry) => {
      const item = entry && typeof entry === "object" ? entry : {};
      return {
        name: String(item.name || "Side dish").trim(),
        description: String(item.description || "Quick supporting side.").trim()
      };
    }).filter(item => item.name);

    const safeSauces = sauces.length >= 2 ? sauces.slice(0, 3) : fallback.sauces.slice(0, 3);
    const safeSides = sides.length >= 2 ? sides.slice(0, 3) : fallback.sides.slice(0, 3);

    return {
      main: {
        title: String(main.title || fallback.main.title).trim(),
        description: String(main.description || fallback.main.description).trim(),
        ingredients: sanitizeStringList(main.ingredients, fallback.main.ingredients).slice(0, 12),
        steps: sanitizeStringList(main.steps, fallback.main.steps).slice(0, 8)
      },
      sauces: safeSauces.map((item, idx) => ({
        name: item.name || fallback.sauces[idx]?.name || "Sauce pairing",
        description: item.description || fallback.sauces[idx]?.description || "Complements the main recipe.",
        ingredients: sanitizeStringList(item.ingredients, fallback.sauces[idx]?.ingredients || []).slice(0, 10),
        steps: sanitizeStringList(item.steps, fallback.sauces[idx]?.steps || []).slice(0, 6)
      })),
      sides: safeSides.map((item, idx) => ({
        name: item.name || fallback.sides[idx]?.name || "Side dish",
        description: item.description || fallback.sides[idx]?.description || "Quick supporting side."
      }))
    };
  };

  const structuredToLegacyText = (structuredRecipe) => {
    const main = structuredRecipe?.main || {};
    const ingredients = (main.ingredients || []).map(item => `- ${item}`).join("\n");
    const steps = (main.steps || []).map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    const sauceTips = (structuredRecipe?.sauces || []).map(item => `- ${item.name}: ${item.description}`).join("\n");
    const sideTips = (structuredRecipe?.sides || []).map(item => `- ${item.name}: ${item.description}`).join("\n");

    return `Title: ${main.title || "AI Recipe"}\nIngredients:\n${ingredients}\n\nSteps:\n${steps}\n\nTips:\n${sauceTips}\n${sideTips}\n\nTarget doneness:\nUse a thermometer and cook to preference.`;
  };

  try {
    const { cut, method, flavor, r, mode = "all" } = req.query;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

const prompt = `
You are a creative professional chef specializing in beef and meat dishes.

Create a concise Smart Cooking Mode response.

Cut: ${cut}
Cooking method: ${method}
Flavor profile: ${flavor}
Variation seed: ${r}
Refresh mode: ${mode}

Rules:
- Keep copy concise and practical (no long paragraphs)
- Return exactly 2-3 sauces
- Return exactly 2-3 sides
- Always return valid JSON only, no markdown

JSON shape:
{
  "main": {
    "title": "string",
    "description": "string",
    "ingredients": ["string"],
    "steps": ["string"]
  },
  "sauces": [
    {
      "name": "string",
      "description": "string",
      "ingredients": ["string"],
      "steps": ["string"]
    }
  ],
  "sides": [
    {
      "name": "string",
      "description": "string"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8
    });

    const recipeText = completion.choices?.[0]?.message?.content || "";
    const normalizedRaw = recipeText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    let parsedPayload = null;

    try {
      parsedPayload = JSON.parse(normalizedRaw);
    } catch (parseError) {
      parsedPayload = null;
      console.warn("AI recipe JSON parse failed, using fallback shape.");
    }

    const structuredRecipe = normalizeSmartRecipe(parsedPayload, {
      cut,
      method,
      flavor,
      seed: r
    });
    const recipe = structuredToLegacyText(structuredRecipe);

    return res.json({
      recipe,
      structuredRecipe,
      source: parsedPayload ? "ai" : "fallback"
    });
  } catch (err) {
    console.error("AI RECIPE ERROR:", err);

    return res.status(500).json({
      error: "AI failed",
      details: err?.message || "Unknown error"
    });
  }
});

app.get("/api/debug/system-check", (req, res) => {
  const cache = readCache();
  const state = readRuntimeState();

  const checks = [
    {
      name: "apiKey",
      status: API_KEY ? "pass" : "fail",
      details: API_KEY ? "YOUTUBE_API_KEY detected" : "Missing YOUTUBE_API_KEY"
    },
    {
      name: "openAiKey",
      status: process.env.OPENAI_API_KEY ? "pass" : "fail",
      details: process.env.OPENAI_API_KEY
        ? "OPENAI_API_KEY detected"
        : "Missing OPENAI_API_KEY"
    },
    {
      name: "cache",
      status: Array.isArray(cache.videos) && cache.videos.length ? "pass" : "warn",
      details: Array.isArray(cache.videos)
        ? `${cache.videos.length} cached videos`
        : "Cache structure invalid"
    },
    {
      name: "quota",
      status: isQuotaBlocked(state) ? "warn" : "pass",
      details: isQuotaBlocked(state)
        ? `Quota blocked until ${state.quotaBlockedUntil}`
        : "Quota not blocked"
    },
    {
      name: "cacheFresh",
      status: isCacheFresh(cache) ? "pass" : "warn",
      details: isCacheFresh(cache)
        ? "Cache is fresh"
        : "Cache is stale or missing"
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
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
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
