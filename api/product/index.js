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

// api/products/[id].js - GET, PUT, DELETE specific product
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id: productID } = req.query;

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const db = await connectDB();
    const collection = db.collection('products');

    if (req.method === 'GET') {
      // GET product by ID
      const product = await collection.findOne({ 
        productID: productID,
        isDeleted: { $ne: true }
      });
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      return res.status(200).json(product);
    }

    if (req.method === 'PUT') {
      // Require admin for PUT
      if (!requireAdmin(user)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { nama, deskripsi, harga, stock } = req.body;
      
      // Validasi input
      if (!nama || !deskripsi || harga === undefined || stock === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      if (typeof harga !== 'number' || harga <= 0) {
        return res.status(400).json({ message: 'Harga must be a positive number' });
      }
      
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Stock must be a non-negative number' });
      }
      
      // Check if product exists
      const existingProduct = await collection.findOne({ 
        productID: productID,
        isDeleted: { $ne: true }
      });
      
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Update product
      const updateData = {
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        harga: parseFloat(harga),
        stock: parseInt(stock),
        dateUpdated: new Date(),
        updatedBy: user.username
      };
      
      await collection.updateOne(
        { productID: productID },
        { $set: updateData }
      );
      
      return res.status(200).json({
        message: 'Product updated successfully',
        productID: productID,
        updates: updateData
      });
    }

    if (req.method === 'DELETE') {
      // Require admin for DELETE
      if (!requireAdmin(user)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if product exists
      const existingProduct = await collection.findOne({ 
        productID: productID,
        isDeleted: { $ne: true }
      });
      
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Soft delete
      await collection.updateOne(
        { productID: productID },
        { 
          $set: {
            deletedAt: new Date(),
            deletedBy: user.username,
            isDeleted: true
          }
        }
      );
      
      return res.status(200).json({
        message: 'Product deleted successfully',
        productID: productID
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// lib/mongodb.js - Database connection
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectDB() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_NAME || 'ssr_community');
}

// lib/auth.js - Authentication helpers
import jwt from 'jsonwebtoken';

export async function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function requireAdmin(user) {
  return user && user.role === 'admin';
}

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
}
