import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { signToken } from '../utils/jwt.js';
import { isDBConnected } from '../config/database.js';

const googleClient = env.googleClientId
  ? new OAuth2Client(env.googleClientId)
  : null;

const SALT_ROUNDS = 12;

function formatUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    authProvider: user.authProvider,
    isGuest: user.isGuest,
  };
}

export async function registerUser({ name, email, password }) {
  if (!isDBConnected()) throw new AppError('Database not available', 503);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    authProvider: 'email',
  });

  const token = signToken({ id: user._id, email: user.email });
  return { user: formatUser(user), token };
}

export async function loginUser({ email, password }) {
  if (!isDBConnected()) throw new AppError('Database not available', 503);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.password) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const token = signToken({ id: user._id, email: user.email });
  return { user: formatUser(user), token };
}

export async function googleAuth(credential) {
  if (!isDBConnected()) throw new AppError('Database not available', 503);
  if (!googleClient) throw new AppError('Google OAuth not configured', 503);

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (picture) user.avatar = picture;
      await user.save();
    }
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      avatar: picture,
      authProvider: 'google',
    });
  }

  const token = signToken({ id: user._id, email: user.email });
  return { user: formatUser(user), token };
}

export async function getUserById(id) {
  if (!isDBConnected()) return null;
  const user = await User.findById(id);
  return user ? formatUser(user) : null;
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AppError('Password must include uppercase, lowercase, and a number', 400);
  }
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) throw new AppError('Invalid email address', 400);
}
