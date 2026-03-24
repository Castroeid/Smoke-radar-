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

app.get("/api/smoke-radar", async (req, res) => {
  try {
    const topic = req.query.topic || "bbq OR steak OR brisket";
    const days = req.query.days || "7";

    const publishedAfter = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&order=viewCount&maxResults=12&publishedAfter=${publishedAfter}&key=${API_KEY}`
    );

    const searchData = await searchRes.json();
    const items = searchData.items || [];

    if (!items.length) {
      return res.json({ videos: [], total: 0 });
    }

    const videoIds = items.map(v => v.id.videoId).join(",");

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`
    );

    const videosData = await videosRes.json();

    const channelIds = videosData.items.map(v => v.snippet.channelId).join(",");

    const channelsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${API_KEY}`
    );

    const channelsData = await channelsRes.json();

    const channelMap = {};
    channelsData.items.forEach(ch => {
      channelMap[ch.id] = ch.statistics;
    });

    const videos = videosData.items.map(v => {
      const stats = v.statistics;
      const chStats = channelMap[v.snippet.channelId] || {};

      const video = {
        id: v.id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        channelId: v.snippet.channelId,
        publishedAt: v.snippet.publishedAt,
        thumbnail: v.snippet.thumbnails.high.url,
        viewCount: Number(stats.viewCount || 0),
        likeCount: Number(stats.likeCount || 0),
        subscriberCount: Number(chStats.subscriberCount || 0)
      };

      video.smokeScore = calculateSmokeScore(video);
      return video;
    });

    videos.sort((a, b) => b.smokeScore - a.smokeScore);

    res.json({
      total: videos.length,
      videos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
