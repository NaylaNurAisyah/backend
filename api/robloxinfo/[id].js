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
    const avatarUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=true`;

    const [profileRes, avatarRes] = await Promise.all([
      fetch(userUrl),
      fetch(avatarUrl)
    ]);

    if (!profileRes.ok || !avatarRes.ok) {
      throw new Error(`Roblox API Error: users.ok=${profileRes.ok}, avatar.ok=${avatarRes.ok}`);
    }

    const profile = await profileRes.json();
    const avatarJson = await avatarRes.json();
    const image = avatarJson?.data?.[0]?.imageUrl || null;

    res.status(200).json({
      id: profile.id,
      name: profile.name,
      displayName: profile.displayName,
      avatar: image
    });
  } catch (err) {
    console.error("❌ Roblox API fetch failed:", err);
    res.status(500).json({
      error: "Gagal ambil data dari Roblox",
      details: err.message
    });
  }
};
