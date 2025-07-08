let users = ["BRAHMASILA"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    users.push(username);
    return res.status(200).json({ message: "Username added!" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
