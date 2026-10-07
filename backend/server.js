import app from './src/app.js';
import { env, getEnvStatus, hasRequiredKeys } from './src/config/env.js';
import { connectDB } from './src/config/database.js';

await connectDB();

app.listen(env.port, () => {
  console.log(`🚀 BonVoyage AI API running on http://localhost:${env.port}`);
  console.log(`   Environment: ${env.nodeEnv}`);
  console.log(`   CORS origin: ${env.corsOrigin}`);

  if (!hasRequiredKeys()) {
    console.warn('\n⚠️  Some API keys are missing. Copy backend/.env.example → backend/.env');
    getEnvStatus().forEach(({ key, configured }) => {
      if (!configured) console.warn(`   ✗ ${key}`);
    });
    console.warn('');
  } else {
    console.log('   API keys: all configured ✓');
  }

  console.log(`   Diagnostics: http://localhost:${env.port}/api/health/apis\n`);
});
