import app from './src/app.js';
import { env, getEnvStatus, hasRequiredKeys, isProd } from './src/config/env.js';
import { connectDB } from './src/config/database.js';

await connectDB();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀 BonVoyage AI API running on port ${env.port}`);
  console.log(`   Environment: ${env.nodeEnv}`);
  console.log(`   CORS origins: ${env.corsOrigins.join(', ')}`);
  console.log(`   Client URL: ${env.clientUrl}`);

  if (isProd && env.jwtSecret.includes('change_in_production')) {
    console.warn('⚠️  JWT_SECRET is still the default — set a strong secret in Render env vars.');
  }

  if (!hasRequiredKeys()) {
    console.warn('\n⚠️  Some API keys are missing.');
    getEnvStatus().forEach(({ key, configured }) => {
      if (!configured) console.warn(`   ✗ ${key}`);
    });
    console.warn('');
  } else {
    console.log('   API keys: all configured ✓');
  }

  console.log(`   Health: /api/health`);
  console.log(`   Diagnostics: /api/health/apis\n`);
});
