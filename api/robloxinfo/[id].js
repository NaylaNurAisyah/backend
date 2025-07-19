module.exports = async (req, res) => {
  const id = req.url.split("/").pop(); // Ambil ID dari URL manual

  res.setHeader("Access-Control-Allow-Origin", "https://vinzzyy.my.id");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  try {
    const [profileRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${id}`),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=true`)
    ]);

    const profile = await profileRes.json();
    const avatarJson = await avatarRes.json();
    const avatarUrl = avatarJson?.data?.[0]?.imageUrl || null;

    res.status(200).json({
      id: profile.id,
      name: profile.name,
      displayName: profile.displayName,
      avatar: avatarUrl
    });

  } catch (err) {
    console.error("Gagal ambil data roblox:", err);
    res.status(500).json({ error: "Gagal ambil data dari Roblox", details: err.message });
  }
};
