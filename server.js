const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.get('/robloxinfo/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [profileRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`)
    ]);

    const profile = await profileRes.json();
    const avatarJson = await avatarRes.json();
    const avatarUrl = avatarJson?.data?.[0]?.imageUrl || null;

    res.json({
      id: profile.id,
      name: profile.name,
      displayName: profile.displayName,
      avatar: avatarUrl
    });

  } catch (err) {
    console.error("Gagal ambil data roblox:", err);
    res.status(500).json({ error: "Gagal ambil data dari Roblox" });
  }
});
