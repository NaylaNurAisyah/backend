// lib/mongodb.js - FIXED VERSION
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

if (!uri) {
  throw new Error('Please define MONGODB_URI environment variable');
}

export async function connectDB() {
  console.log('Connecting to MongoDB...');
  
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    if (!cachedClient) {
      console.log('Creating new MongoDB client...');
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
      });
      
      cachedClient = await client.connect();
      console.log('Connected to MongoDB');
    }

    const dbName = process.env.MONGODB_NAME || 'ssr_community';
    cachedDb = cachedClient.db(dbName);
    console.log('Database selected:', dbName);
    
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

