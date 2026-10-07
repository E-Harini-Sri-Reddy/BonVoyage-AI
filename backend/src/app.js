import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env, isProd } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Render / reverse proxies terminate TLS — needed for secure cookies & correct IPs
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", 'https://accounts.google.com', 'https://apis.google.com'],
            'frame-src': ["'self'", 'https://accounts.google.com'],
            'connect-src': ["'self'", 'https://accounts.google.com', 'https://oauth2.googleapis.com'],
            'img-src': ["'self'", 'data:', 'https:', 'blob:'],
            'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
            'font-src': ["'self'", 'data:', 'https:'],
          },
        }
      : false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin / non-browser requests omit Origin
      if (!origin) return callback(null, true);
      if (env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`[cors] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter, routes);

// Production: serve Vite build from the same Render Web Service (recommended)
if (isProd && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { maxAge: '1d', index: false }));
  // Express 5-safe SPA fallback (do not use app.get('*'))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
  console.log(`   Serving frontend from ${frontendDist}`);
}

app.use(errorHandler);

export default app;
