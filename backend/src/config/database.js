import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  if (!env.mongodbUri) {
    console.warn('⚠️  MONGODB_URI not set — running without database (localStorage fallback on frontend)');
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      dbName: env.mongodbDbName,
    });
    isConnected = true;
    console.log(`   MongoDB: connected ✓ (database: ${mongoose.connection.name})`);
    console.log('   Collections: users, saved_trips, favorites, recent_searches, packing_lists');
  } catch (error) {
    console.error('   MongoDB: connection failed —', error.message);
    console.warn('   App will continue without database persistence.');
  }
}

export function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDbName() {
  return mongoose.connection?.name || env.mongodbDbName;
}
