import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'ssr_db';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Parse body jika POST
    if (req.method === "POST" && req.headers["content-type"] === "application/json") {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      req.body = JSON.parse(Buffer.concat(buffers).toString());
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("users");

    if (req.method === "GET") {
      const allUsers = await collection.find().toArray();
      return res.status(200).json(allUsers);
    }

    if (req.method === "POST") {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: "Username required" });

      await collection.insertOne({ username });
      return res.status(200).json({ message: "Username added!" });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
