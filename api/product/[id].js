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


}
