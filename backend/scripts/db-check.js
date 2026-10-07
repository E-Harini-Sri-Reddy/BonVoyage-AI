/**
 * Verify BonVoyage MongoDB setup and optionally migrate data from the default "test" database.
 *
 * Usage:
 *   node scripts/db-check.js
 *   node scripts/db-check.js --migrate
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = (process.env.MONGODB_URI || '').trim();
const dbName = process.env.MONGODB_DB_NAME || 'bonvoyage';
const shouldMigrate = process.argv.includes('--migrate');

const BONVOYAGE_COLLECTIONS = [
  { from: 'users', to: 'users' },
  { from: 'trips', to: 'saved_trips' },
  { from: 'saved_trips', to: 'saved_trips' },
  { from: 'favorites', to: 'favorites' },
  { from: 'recentsearches', to: 'recent_searches' },
  { from: 'recent_searches', to: 'recent_searches' },
  { from: 'packinglists', to: 'packing_lists' },
  { from: 'packing_lists', to: 'packing_lists' },
];

async function listDb(client, name) {
  const db = client.db(name);
  const collections = await db.listCollections().toArray();
  const counts = {};
  for (const col of collections) {
    counts[col.name] = await db.collection(col.name).countDocuments();
  }
  return counts;
}

async function migrateCollection(sourceDb, targetDb, from, to) {
  const source = sourceDb.collection(from);
  const count = await source.countDocuments();
  if (!count) return 0;

  const target = targetDb.collection(to);
  const docs = await source.find().toArray();
  let migrated = 0;

  for (const doc of docs) {
    const { _id, ...rest } = doc;
    if (from === 'trips' && to === 'saved_trips' && !rest.tripKey && rest.input) {
      rest.tripKey = [
        rest.input.origin,
        rest.input.destination,
        rest.input.fromDate,
        rest.input.toDate,
        rest.input.budget,
        rest.input.currency,
      ]
        .filter(Boolean)
        .join('|');
    }
    await target.updateOne({ _id }, { $set: rest }, { upsert: true });
    migrated += 1;
  }
  return migrated;
}

async function main() {
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log(`\nBonVoyage DB check`);
  console.log(`URI host: ${uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:***@')}`);
  console.log(`Target database: ${dbName}\n`);

  const client = new mongoose.mongo.MongoClient(uri);
  await client.connect();

  const admin = client.db().admin();
  const { databases } = await admin.listDatabases();
  const dbNames = databases.map((d) => d.name);

  console.log('Databases on this cluster:');
  for (const name of dbNames) {
    const marker = name === 'sample_mflix' ? ' ← Atlas sample data (NOT BonVoyage — safe to delete)' : '';
    const marker2 = name === dbName ? ' ← BonVoyage app database' : '';
    console.log(`  • ${name}${marker}${marker2}`);
  }
  console.log('');

  for (const checkDb of [dbName, 'test']) {
    if (!dbNames.includes(checkDb)) continue;
    const counts = await listDb(client, checkDb);
    console.log(`Collections in "${checkDb}":`);
    if (!Object.keys(counts).length) {
      console.log('  (empty)');
    } else {
      for (const [col, count] of Object.entries(counts)) {
        console.log(`  • ${col}: ${count} document(s)`);
      }
    }
    console.log('');
  }

  if (shouldMigrate && dbNames.includes('test')) {
    console.log('Migrating BonVoyage data from "test" → "' + dbName + '"...');
    const sourceDb = client.db('test');
    const targetDb = client.db(dbName);
    let total = 0;
    const seen = new Set();
    for (const { from, to } of BONVOYAGE_COLLECTIONS) {
      if (seen.has(to)) continue;
      const n = await migrateCollection(sourceDb, targetDb, from, to);
      if (n) {
        console.log(`  ✓ ${from} → ${to}: ${n} document(s)`);
        total += n;
        seen.add(to);
      }
    }
    console.log(total ? `\n✅ Migration complete (${total} documents)` : '\n⚠️  No documents to migrate from test');
  } else if (!dbNames.includes(dbName) || !(await listDb(client, dbName)) || !Object.keys(await listDb(client, dbName)).length) {
    console.log(`ℹ️  The "${dbName}" database will be created automatically on first save.`);
    console.log('   Run with --migrate to copy any existing data from the "test" database.\n');
  }

  console.log('Expected BonVoyage collections:');
  console.log('  users, saved_trips, favorites, recent_searches, packing_lists\n');

  await client.close();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
