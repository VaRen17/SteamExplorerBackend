const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const MOST_PLAYED_URL = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/";
const DETAILS_URL = "https://store.steampowered.com/api/appdetails?appids=";

const headers = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
};

app.get('/api/mostplayed', async (req, res) => {
  try {
    const response = await fetch(MOST_PLAYED_URL, { headers });
    const data = await response.json();

    const ranks = data.response.ranks;

    const finalGames = [];

    for (const game of ranks) {
      const appid = game.appid;

      const detailsRes = await fetch(DETAILS_URL + appid, { headers });
      const detailsJson = await detailsRes.json();

      const details = detailsJson[appid]?.data;

      if (!details) continue;

      finalGames.push({
        appid: appid,
        name: details.name,
        peak: game.peak_in_game,
        image: details.capsule_imagev5 || details.capsule_image || details.header_image
      });
    }

    res.json(finalGames);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Steam API error" });
  }
});

app.get('/api/details/:id', async (req, res) => {
  const appId = req.params.id;
  try {
    const response = await fetch(DETAILS_URL + appId, { headers });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Steam API error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));