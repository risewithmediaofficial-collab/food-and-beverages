#!/usr/bin/env node
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import {
  OrgProfile,
  Factory,
  Department,
  Warehouse,
  AuditLog,
} from '../src/modules/org/org.model.js';
import { Role, User } from '../src/modules/auth/auth.model.js';

async function run() {
  try {
    console.log('[cleanup-all-seeded] Connecting to', config.mongoUri);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });

    const results = {};

    results.orgProfiles = (await OrgProfile.deleteMany({})).deletedCount || 0;
    results.factories = (await Factory.deleteMany({})).deletedCount || 0;
    results.departments = (await Department.deleteMany({})).deletedCount || 0;
    results.warehouses = (await Warehouse.deleteMany({})).deletedCount || 0;
    results.auditLogs = (await AuditLog.deleteMany({})).deletedCount || 0;

    results.roles = (await Role.deleteMany({})).deletedCount || 0;
    results.users = (await User.deleteMany({})).deletedCount || 0;

    console.log('[cleanup-all-seeded] Deletion results:', results);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[cleanup-all-seeded] Error:', err.message);
    process.exit(1);
  }
}

run();
