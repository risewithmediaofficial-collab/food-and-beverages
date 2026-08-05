import mongoose from 'mongoose';
import { config } from '../../config/env.js';

const clearDatabase = async () => {
  try {
    console.log(`[MongoDB Clear] Connecting to ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`[MongoDB Clear] Found ${collections.length} collections.`);
    for (const col of collections) {
      await db.collection(col.name).deleteMany({});
      console.log(`[MongoDB Clear] Cleared collection: ${col.name}`);
    }
    
    console.log('[MongoDB Clear] Successfully wiped all data from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('[MongoDB Clear Error]', err);
    process.exit(1);
  }
};

clearDatabase();
