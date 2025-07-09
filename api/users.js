import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'ssr_db';

export default async function handler(req, res) {
  // Tambah header CORS untuk semua jenis request
  res.setHeader('Access-Control-Allow-Origin', 'https://vinzzyy.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!process.env.MONGO_URI) {
      console.error("❗ MONGO_URI tidak ditemukan!");
      throw new Error("Missing MONGO_URI");
    }

    await client.connect();
    console.log("✅ MongoDB berhasil connect");

    const db = client.db(dbName);
    const collection = db.collection("users");

    if (req.method === "GET") {
      const users = await collection.find().toArray();
      return res.status(200).json(users);
    }

    if (req.method === "POST") {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = JSON.parse(Buffer.concat(buffers).toString());
      const { username } = body;

      if (!username) return res.status(400).json({ error: "Username required" });

      await collection.insertOne({ username });
      return res.status(200).json({ message: "Username added!" });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("🔥 ERROR di handler:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
}
