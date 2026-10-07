import mongoose from 'mongoose';

export function toUserObjectId(user) {
  if (!user?.id) return null;
  return new mongoose.Types.ObjectId(String(user.id));
}
