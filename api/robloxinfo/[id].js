const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const id = req.url.split("/").pop();

  res.setHeader("Access-Control-Allow-Origin", "https://vinzzyy.my.id");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid or missing userId" });
  }

  try {
    const userUrl = `https://users.roblox.com/v1/users/${id}`;

    const [profileRes] = await Promise.all([
      fetch(userUrl)
    ]);

    if (!profileRes.ok) {
      throw new Error(`Roblox API Error: users.ok=${profileRes.ok}`);
    }

    const profile = await profileRes.json

    res.status(200).json({
      id: profile.id,
      name: profile.name,
      displayName: profile.displayName
    });
  } catch (err) {
    console.error("❌ Roblox API fetch failed:", err);
    res.status(500).json({
      error: "Gagal ambil data dari Roblox",
      details: err.message
    });
  }
};
