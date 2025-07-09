
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'ssr_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vinzzyy.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const warnsCollection = db.collection('warns');

    if (req.method === 'POST') {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = JSON.parse(Buffer.concat(buffers).toString());
      const { username } = body;

      if (!username) return res.status(400).json({ error: "Username diperlukan" });

      const user = await usersCollection.findOne({ name: { $regex: `^${username}$`, $options: 'i' } });
      if (!user) return res.status(404).json({ error: "Username tidak ditemukan di database" });

      await warnsCollection.insertOne({
        name: user.name,
        displayName: user.displayName,
        userId: user.id,
        warnedAt: new Date()
      });

      return res.status(200).json({ message: `User ${user.name} telah diberi peringatan.` });
    }

    if (req.method === 'GET') {
      const warns = await warnsCollection.find().sort({ warnedAt: -1 }).toArray();
      return res.status(200).json(warns);
    }

    return res.status(405).json({ error: "Method tidak didukung" });

  } catch (err) {
    console.error("🔥 ERROR:", err);
    return res.status(500).json({ error: "Kesalahan server", detail: err.message });
  }
}
