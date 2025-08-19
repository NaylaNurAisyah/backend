// api/products/search/[query].js - Search products
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query: searchQuery } = req.query;

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const db = await connectDB();
    const collection = db.collection('products');

    const products = await collection
      .find({
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
              { nama: { $regex: searchQuery, $options: 'i' } },
              { deskripsi: { $regex: searchQuery, $options: 'i' } },
              { productID: { $regex: searchQuery, $options: 'i' } }
            ]
          }
        ]
      })
      .sort({ dateCreated: -1 })
      .toArray();
    
    return res.status(200).json(products);

  } catch (error) {
    console.error('Search API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
