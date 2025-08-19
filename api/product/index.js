// api/products/index.js - FIXED VERSION dengan CORS yang benar
export default async function handler(req, res) {
  // CORS Headers - Perbaikan untuk local development
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080', 
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
    'https://your-domain.vercel.app' // Ganti dengan domain Anda
  ];

  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  try {
    console.log('API called:', req.method, req.url);
    console.log('Headers:', req.headers);
    
    // Verify authentication - perbaikan untuk development
    const user = await verifyToken(req);
    if (!user) {
      console.log('Authentication failed');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'NO_TOKEN'
      });
    }

    console.log('User authenticated:', user.username);

    // Connect to database
    const db = await connectDB();
    const collection = db.collection('products');

    if (req.method === 'GET') {
      console.log('Getting all products...');
      
      const products = await collection
        .find({ isDeleted: { $ne: true } })
        .sort({ dateCreated: -1 })
        .toArray();
        
      console.log(`Found ${products.length} products`);
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      // Require admin for POST
      if (!requireAdmin(user)) {
        console.log('Admin access required');
        return res.status(403).json({ 
          message: 'Admin access required',
          error: 'NOT_ADMIN'
        });
      }

      console.log('Creating new product...');
      console.log('Request body:', req.body);

      const { productID, nama, deskripsi, harga, stock } = req.body;
      
      // Validasi input dengan logging
      if (!productID || !nama || !deskripsi || harga === undefined || stock === undefined) {
        console.log('Validation failed - missing fields');
        return res.status(400).json({ 
          message: 'All fields are required',
          received: { productID: !!productID, nama: !!nama, deskripsi: !!deskripsi, harga, stock }
        });
      }
      
      if (typeof harga !== 'number' || harga <= 0) {
        console.log('Validation failed - invalid price');
        return res.status(400).json({ message: 'Harga must be a positive number' });
      }
      
      if (typeof stock !== 'number' || stock < 0) {
        console.log('Validation failed - invalid stock');
        return res.status(400).json({ message: 'Stock must be a non-negative number' });
      }
      
      // Check if product ID already exists
      const existingProduct = await collection.findOne({ productID: productID });
      if (existingProduct) {
        console.log('Product ID already exists');
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
      
      console.log('Inserting product:', newProduct);
      await collection.insertOne(newProduct);
      
      console.log('Product created successfully');
      return res.status(201).json({
        message: 'Product created successfully',
        product: newProduct
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

