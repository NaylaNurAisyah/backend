// api/products/index.js - GET all products & POST new product
import { connectDB } from '../../lib/mongodb';
import { verifyToken, requireAdmin } from '../../lib/auth';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const db = await connectDB();
    const collection = db.collection('products');

    if (req.method === 'GET') {
      // GET all products
      const products = await collection
        .find({ isDeleted: { $ne: true } })
        .sort({ dateCreated: -1 })
        .toArray();
        
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      // Require admin for POST
      if (!requireAdmin(user)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { productID, nama, deskripsi, harga, stock } = req.body;
      
      // Validasi input
      if (!productID || !nama || !deskripsi || harga === undefined || stock === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      if (typeof harga !== 'number' || harga <= 0) {
        return res.status(400).json({ message: 'Harga must be a positive number' });
      }
      
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Stock must be a non-negative number' });
      }
      
      // Check if product ID already exists
      const existingProduct = await collection.findOne({ productID: productID });
      if (existingProduct) {
        return res.status(409).json({ message: 'Product ID already exists' });
      }
      
      // Create new product
      const newProduct = {
        productID,
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        harga: parseFloat(harga),
        stock: parseInt(stock),
        dateCreated: new Date(),
        dateUpdated: new Date(),
        createdBy: user.username,
        isDeleted: false
      };
      
      await collection.insertOne(newProduct);
      
      return res.status(201).json({
        message: 'Product created successfully',
        product: newProduct
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
