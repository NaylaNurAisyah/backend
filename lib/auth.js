// lib/auth.js - FIXED VERSION dengan fallback
import jwt from 'jsonwebtoken';

export async function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1];

    // Fallback untuk development - bisa pakai mock token
    if (!token && process.env.NODE_ENV === 'development') {
      console.log('No token provided in development mode');
      // Return mock admin user untuk testing
      return {
        username: 'admin',
        role: 'admin',
        userId: 'dev-admin'
      };
    }

    if (!token) {
      console.log('No token provided');
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token verified for user:', decoded.username);
    return decoded;

  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    // Untuk development, return mock user jika token invalid
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock admin user for development');
      return {
        username: 'admin',
        role: 'admin',
        userId: 'dev-admin'
      };
    }
    
    return null;
  }
}

export function requireAdmin(user) {
  const isAdmin = user && user.role === 'admin';
  console.log('Admin check:', { user: user?.username, role: user?.role, isAdmin });
  return isAdmin;
}
