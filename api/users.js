import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./data/username.json');

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Baca isi file JSON
  let usernames = [];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    usernames = JSON.parse(fileContent);
  } catch (err) {
    return res.status(500).json({ error: "Gagal membaca file username.json" });
  }

  if (req.method === "GET") {
    try {
      const robloxRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames, excludeBannedUsers: false })
      });
      const data = await robloxRes.json();
      return res.status(200).json(data.data);
    } catch (err) {
      return res.status(500).json({ error: "Gagal fetch dari Roblox API" });
    }
  }

  if (req.method === "POST") {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    if (usernames.includes(username)) {
      return res.status(400).json({ error: "Username sudah ada" });
    }

    usernames.push(username);
    try {
      fs.writeFileSync(filePath, JSON.stringify(usernames, null, 2), 'utf-8');
      return res.status(200).json({ message: "Username berhasil ditambahkan!" });
    } catch (err) {
      return res.status(500).json({ error: "Gagal menulis ke file" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
