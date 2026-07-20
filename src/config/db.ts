import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isLocalFallbackActive = false;
const fallbackDir = path.join(__dirname, '../../data');
const fallbackPath = path.join(fallbackDir, 'fallback_db.json');

// Ensure fallback directory exists
if (!fs.existsSync(fallbackDir)) {
  fs.mkdirSync(fallbackDir, { recursive: true });
}

// Initial structure for fallback database
const defaultData = {
  users: [],
  itineraries: []
};

if (!fs.existsSync(fallbackPath)) {
  fs.writeFileSync(fallbackPath, JSON.stringify(defaultData, null, 2), 'utf-8');
}

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️ MONGODB_URI not found in env. Falling back to local JSON database.');
    isLocalFallbackActive = true;
    return;
  }

  try {
    // Set connection timeout to 4 seconds to fail fast and fall back
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000
    });
    console.log('✅ MongoDB connected successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', (error as Error).message);
    console.warn('⚠️ Falling back to local JSON database for development/fallback mode.');
    isLocalFallbackActive = true;
  }
};

export const getFallbackDb = (): typeof defaultData => {
  try {
    if (fs.existsSync(fallbackPath)) {
      const content = fs.readFileSync(fallbackPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading fallback DB:', err);
  }
  return defaultData;
};

export const saveFallbackDb = (data: typeof defaultData): void => {
  try {
    fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback DB:', err);
  }
};

export const isFallback = (): boolean => {
  return isLocalFallbackActive;
};
