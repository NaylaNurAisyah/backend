export default async function handler(req, res) {
  // Header CORS lengkap
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight OK
  }

  if (req.method === "POST") {
    try {
      const { userIds } = req.body;

      const response = await fetch("https://thumbnails.roblox.com/v1/users/avatar-headshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds,
          size: "150x150",
          format: "Png",
          isCircular: true
        })
      });

      const data = await response.json();
      return res.status(200).json(data);

    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch avatar thumbnails" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
