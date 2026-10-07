import mongoose from 'mongoose';
import { tripInputSchema, tripPlanSchema, FAVORITE_TYPES } from './schemas.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    avatar: String,
    authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
    isGuest: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripKey: { type: String, required: true, index: true },
    title: { type: String, trim: true },
    input: { type: tripInputSchema, required: true },
    plan: { type: tripPlanSchema, default: null },
  },
  { timestamps: true, collection: 'saved_trips' }
);

tripSchema.index({ userId: 1, tripKey: 1 }, { unique: true });
export const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

const favoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, enum: FAVORITE_TYPES },
    itemId: { type: String, required: true },
    title: String,
    subtitle: String,
    data: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, collection: 'favorites' }
);

favoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true });
export const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);

const recentSearchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    search: { type: tripInputSchema, required: true },
  },
  { timestamps: true, collection: 'recent_searches' }
);

recentSearchSchema.index({ userId: 1, 'search.origin': 1, 'search.destination': 1, 'search.fromDate': 1 });
export const RecentSearch = mongoose.models.RecentSearch || mongoose.model('RecentSearch', recentSearchSchema);

const packingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripKey: { type: String, required: true },
    checked: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'packing_lists' }
);

packingSchema.index({ userId: 1, tripKey: 1 }, { unique: true });
export const PackingList = mongoose.models.PackingList || mongoose.model('PackingList', packingSchema);
