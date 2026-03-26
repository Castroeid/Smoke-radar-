const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static("public"));

const API_KEY = process.env.YOUTUBE_API_KEY;

const CACHE_FILE = "cache.json";
const STATE_FILE = "runtime-state.json";

const CACHE_TTL = 120;
const QUOTA_COOLDOWN = 360;

// ---------- helpers ----------

function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function now() {
  return new Date().toISOString();
}

// ---------- cache ----------

function readCache() {
  return readJSON(CACHE_FILE, {
    fetchedAt: null,
    videos: []
  });
}

function writeCache(videos) {
  writeJSON(CACHE_FILE, {
    fetchedAt: now(),
    videos
  });
}

// ---------- state ----------

function readState() {
  return readJSON(STATE_FILE, {
    quotaBlockedUntil: null
  });
}

function writeState(data) {
  writeJSON(STATE_FILE, {
    ...readState(),
    ...data
  });
}

// ---------- core ----------

function quotaBlocked(state) {
  return state.quotaBlockedUntil && new Date(state.quotaBlockedUntil) > new Date();
}

// ---------- endpoints ----------

app.get("/api/smoke-radar", async (req, res) => {
  const cache = readCache();
  const state = readState();

  if (!API_KEY) {
    return res.json({
      source: "no-key",
      videos: cache.videos
    });
  }

  if (quotaBlocked(state)) {
    return res.json({
      source: "cache",
      fallbackReason: "Quota cooldown",
      videos: cache.videos
    });
  }

  try {
    // simplified fetch
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=smoked beef&maxResults=10&key=${API_KEY}`;
    const data = await fetch(url).then(r => r.json());

    const videos = data.items.map(v => ({
      id: v.id.videoId,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails.high.url,
      channelTitle: v.snippet.channelTitle,
      url: `https://youtube.com/watch?v=${v.id.videoId}`,
      smokeScore: Math.random() * 100
    }));

    writeCache(videos);
    writeState({ quotaBlockedUntil: null });

    res.json({ source: "live", videos });

  } catch (e) {

    if (String(e).includes("quota")) {
      const blockedUntil = new Date(Date.now() + QUOTA_COOLDOWN * 60000).toISOString();
      writeState({ quotaBlockedUntil: blockedUntil });
    }

    res.json({
      source: "cache",
      fallbackReason: "live failed",
      videos: cache.videos
    });
  }
});

// ---------- system check ----------

app.get("/api/debug/system-check", (req, res) => {
  const cache = readCache();
  const state = readState();

  res.json({
    ok: true,
    checks: [
      { name: "apiKey", status: API_KEY ? "pass" : "fail" },
      { name: "cache", status: cache.videos.length ? "pass" : "warn" },
      { name: "quota", status: quotaBlocked(state) ? "warn" : "pass" }
    ]
  });
});

// ---------- health ----------

app.get("/health", (req, res) => {
  const cache = readCache();
  const state = readState();

  res.json({
    ok: true,
    cacheVideos: cache.videos.length,
    quotaBlocked: quotaBlocked(state)
  });
});

app.listen(3000, () => {
  console.log("Server running");
});
