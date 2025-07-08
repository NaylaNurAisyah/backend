import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'ssr_db';

export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("users");

  if (req.method === "GET") {
    const users = await col.find().toArray();
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const body = JSON.parse(Buffer.concat(buffers).toString());
    const { username } = body;
    if (!username) return res.status(400).json({ error: "Username required" });
    await col.insertOne({ username });
    return res.status(200).json({ message: "Username added!" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
