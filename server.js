const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// ===== Cache helpers =====
const CACHE_FILE = "cache.json";

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return { lastUpdated: null, videos: [] };
  }
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

// ===== Seed data (fallback יפה) =====
function getSeedData() {
  return {
    source: "seed",
    lastUpdated: new Date().toISOString(),
    videos: [
      {
        title: "Perfect Smoked Brisket Guide",
        channel: "BBQ Masters",
        views: 124000,
        likes: 5200,
        smokeScore: 82,
        thumbnail: "https://i.ytimg.com/vi/3v6jM3KpX6g/hqdefault.jpg",
        url: "https://youtube.com/watch?v=3v6jM3KpX6g"
      },
      {
        title: "Top 5 Steak Techniques",
        channel: "Meat Lab",
        views: 89000,
        likes: 3400,
        smokeScore: 75,
        thumbnail: "https://i.ytimg.com/vi/1-SJGQ2HLp8/hqdefault.jpg",
        url: "https://youtube.com/watch?v=1-SJGQ2HLp8"
      }
    ]
  };
}

// ===== YouTube fetch =====
async function fetchVideos() {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=smoked%20meat&type=video&maxResults=10&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    throw new Error(JSON.stringify(data.error));
  }

  return data.items.map((item) => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.high.url,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
    views: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 5000),
    smokeScore: Math.floor(Math.random() * 100)
  }));
}

// ===== API route =====
app.get("/api/smoke-radar", async (req, res) => {
  const cache = loadCache();

  // אם אין API KEY בכלל
  if (!API_KEY) {
    return res.json({
      source: "no-key",
      ...getSeedData()
    });
  }

  try {
    const videos = await fetchVideos();

    const result = {
      source: "live",
      lastUpdated: new Date().toISOString(),
      videos
    };

    // שמירה לקאש
    saveCache(result);

    return res.json(result);

  } catch (err) {
    console.log("API failed → fallback to cache");

    // אם יש cache → נחזיר אותו
    if (cache.videos.length > 0) {
      return res.json({
        source: "cache",
        ...cache
      });
    }

    // אחרת → seed
    return res.json({
      source: "seed",
      ...getSeedData()
    });
  }
});

// ===== health =====
app.get("/", (req, res) => {
  res.send("Smoke Radar backend is running 🔥");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
