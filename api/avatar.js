export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0 || userIds.some(id => typeof id !== "number")) {
        return res.status(400).json({ error: "Invalid userIds format. Harus array angka" });
      }

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
      console.log("Kirim ke Roblox:", {
        userIds,
        size: "150x150",
        format: "Png",
        isCircular: true
      });

      const data = await response.json();
      return res.status(200).json(data);

    } catch (error) {
      console.error("Thumbnail API Error:", error);
      return res.status(500).json({ error: "Failed to fetch avatar thumbnails" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
