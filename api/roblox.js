export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://vinzzyy.my.id');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Hanya izinkan POST
  if (req.method !== "POST") {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Set CORS header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { usernames } = req.body;

    const body = {
      usernames,
      excludeBannedUsers: true
    };

    const robloxRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await robloxRes.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Failed to fetch Roblox data." });
  }
}
