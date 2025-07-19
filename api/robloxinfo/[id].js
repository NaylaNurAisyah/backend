export default async function handler(req, res) {
  const allowedOrigin = 'https://vinzzyy.my.id';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  try {
    const profileRes = await fetch(`https://users.roblox.com/v1/users/${id}`);
    const profile = await profileRes.json();

    res.setHeader('Access-Control-Allow-Origin', 'https://vinzzyy.my.id');
    res.setHeader('Vary', 'Origin');

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Roblox data" });
  }
}
