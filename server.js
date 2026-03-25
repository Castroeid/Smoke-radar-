const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

app.get("/api/smoke-radar", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing API key in Render",
        hasKey: false
      });
    }

    return res.json({
      ok: true,
      hasKey: true,
      keyPrefix: API_KEY.slice(0, 8),
      message: "Render received the API key successfully"
    });
  } catch (error) {
    console.error("Smoke Radar debug error:", error);
    return res.status(500).json({
      error: "Debug route failed",
      details: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
