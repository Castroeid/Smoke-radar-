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

    const publishedAfter = new Date(Date.now() - days
