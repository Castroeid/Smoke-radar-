const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

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

  return Math.round(
    (viewsPerHour * 0.7) +
    (likes * 2) +
    (likeRate * 100000) +
    (subscribers < 100000 ? 5000 : 1000)
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

app.get("/api/smoke-radar", async (req, res) => {
  try {
    const days = Number(req.query.days || "30");
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const queries = [
      "bbq",
      "brisket",
      "smoked meat",
      "tomahawk steak",
      "wagyu steak",
      "beef ribs"
    ];

    let searchItems = [];

    for (const query of queries) {
      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&key=${API_KEY}`;

      const searchData = await fetchJson(searchUrl);
      const items = searchData.items || [];
      searchItems = searchItems.concat(items);
    }

    const uniqueVideoIds = [...new Set(
      searchItems
        .map(item => item?.id?.videoId)
        .filter(Boolean)
    )];

    if (!uniqueVideoIds.length) {
      return res.json({
        videos: [],
        total: 0,
        debug: "No video IDs returned from YouTube search"
      });
    }

    const videosUrl =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${uniqueVideoIds.join(",")}&key=${API_KEY}`;

    const videosData = await fetchJson(videosUrl);
    const rawVideos = videosData.items || [];

    const filteredVideos = rawVideos.filter(v => {
      const publishedAt = new Date(v.snippet.publishedAt).getTime();
      return publishedAt >= cutoff;
    });

    if (!filteredVideos.length) {
      return res.json({
        videos: [],
        total: 0,
        debug: "Videos found, but none matched the date filter"
      });
    }

    const uniqueChannelIds = [...new Set(
      filteredVideos.map(v => v.snippet.channelId).filter(Boolean)
    )];

    const channelsUrl =
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${uniqueChannelIds.join(",")}&key=${API_KEY}`;

    const channelsData = await fetchJson(channelsUrl);
    const channelMap = {};

    (channelsData.items || []).forEach(ch => {
      channelMap[ch.id] = ch.statistics || {};
    });

    const videos = filteredVideos.map(v => {
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
      return video;
    });

    videos.sort((a, b) => b.smokeScore - a.smokeScore);

    res.json({
      videos: videos.slice(0, 24),
      total: videos.length
    });
  } catch (error) {
    console.error("Smoke Radar error:", error);
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
