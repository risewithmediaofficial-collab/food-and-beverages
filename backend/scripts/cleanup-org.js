#!/usr/bin/env node
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { OrgProfile } from '../src/modules/org/org.model.js';

async function run() {
  try {
    console.log('[cleanup-org] Connecting to', config.mongoUri);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    const count = await OrgProfile.countDocuments();
    console.log(`[cleanup-org] Found ${count} OrgProfile document(s)`);
    if (count === 0) {
      console.log('[cleanup-org] No org documents to remove. Exiting.');
      process.exit(0);
    }
    const res = await OrgProfile.deleteMany({});
    console.log('[cleanup-org] Deleted', res.deletedCount, 'OrgProfile document(s)');
    process.exit(0);
  } catch (err) {
    console.error('[cleanup-org] Error:', err.message);
    process.exit(1);
  }
}

run();
