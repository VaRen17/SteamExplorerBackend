const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const MOST_PLAYED_URL = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?count=500";
const HOME_URL = "https://store.steampowered.com/api/appdetails?cc=eu&appids=";
const DETAIL_URL = "https://store.steampowered.com/api/appdetails?appids=";

const headers = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
};

app.get('/api/mostplayed', async (req, res) => {
  try {
    const proxyMostPlayed = `https://api.allorigins.win/raw?url=${encodeURIComponent(MOST_PLAYED_URL)}`;

    const response = await fetch(proxyMostPlayed, { headers });
    const data = await response.json();

    const ranks = data.response.ranks;

    const detailRequests = ranks.map(game => {
      const steamDetailUrl = HOME_URL + game.appid;
      const proxyDetailUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(steamDetailUrl)}`;

      return fetch(proxyDetailUrl, { headers })
        .then(r => r.json())
        .then(json => {
          const details = json[game.appid]?.data;
          if (!details) return null;

          return {
            appid: game.appid,
            name: details.name,
            peak: game.peak_in_game,
            image: details.capsule_imagev5 || details.capsule_image || details.header_image,
            price: details.price_overview?.final ?? 0,
            initialPrice: details.price_overview?.initial ?? 0,
            discount: details.price_overview?.discount_percent ?? 0,
            currency: details.price_overview?.currency ?? "EUR",
            genres: details.genres?.map(g => g.description) ?? []
          };
        })
        .catch(() => null);
    });

    const results = await Promise.all(detailRequests);
    const finalGames = results.filter(g => g !== null);

    res.json(finalGames);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Steam API error" });
  }
});

app.get('/api/details/:id', async (req, res) => {
  const appId = req.params.id;

  try {
    const steamDetailUrl = DETAIL_URL + appId;
    const proxyDetailUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(steamDetailUrl)}`;

    const response = await fetch(proxyDetailUrl, { headers });
    const data = await response.json();

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Steam API error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));