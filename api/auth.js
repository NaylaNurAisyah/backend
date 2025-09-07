import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// MongoDB connect
const client = new MongoClient(process.env.MONGO_URI);
const dbName = "Vinzzyy";
const usersCollection = client.db(dbName).collection("users");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
 setCors(res);

  if (req.method === "OPTIONS") {
    // 🔥 ini juga harus balikin header
    return res.status(200).end();
  }
  await client.connect();

  if (req.method === "POST" && req.query.action === "register") {
    const { username, password } = req.body;

    const existing = await usersCollection.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Username sudah dipakai" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashed, role: "member" });

    return res.status(200).json({ message: "Register berhasil" });
  }

  if (req.method === "POST" && req.query.action === "login") {
    const { username, password } = req.body;

    const user = await usersCollection.findOne({ username });
    if (!user) return res.status(401).json({ error: "User tidak ditemukan" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Password salah" });

    // Bikin token
    const token = jwt.sign({ username, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Simpan token di cookie
    res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=86400; Secure; SameSite=Strict`);
    return res.status(200).json({ message: "Login sukses", role: user.role });
  }

  if (req.method === "GET" && req.query.action === "me") {
    try {
      const cookie = req.headers.cookie?.split("; ").find(c => c.startsWith("token="));
      if (!cookie) return res.status(401).json({ error: "Belum login" });

      const token = cookie.split("=")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.status(200).json(decoded);
    } catch {
      return res.status(401).json({ error: "Token invalid" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
