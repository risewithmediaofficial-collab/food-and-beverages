#!/usr/bin/env node
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/env.js';
import { OrgProfile, Factory, Department } from '../src/modules/org/org.model.js';
import { Role, User } from '../src/modules/auth/auth.model.js';

async function run() {
  try {
    console.log('[seed-fake-data] Connecting to', config.mongoUri);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });

    // Create or reuse an org profile
    let org = await OrgProfile.findOne();
    if (!org) {
      org = await OrgProfile.create({
        enterpriseName: 'Acme Foods Pvt Ltd',
        hqAddress: '100 Test Road, Sample City, SC 12345',
        gstin: '22TESTG1234F1Z1',
        pan: 'TESTP1234F',
        fssaiLicense: 'TESTFSSAI0001',
        connectedPlants: '0 Facilities',
        currency: 'Indian Rupee (INR - ₹)'
      });
      console.log('[seed-fake-data] Created OrgProfile', org._id.toString());
    } else {
      console.log('[seed-fake-data] Using existing OrgProfile', org._id.toString());
    }

    // Create 2 factories
    const factories = [];
    for (let i = 1; i <= 2; i++) {
      const f = await Factory.create({
        plantCode: `PLANT-0${i}`,
        name: `Test Plant ${i}`,
        code: `TP0${i}`,
        location: `Zone ${i}`,
        linesCount: i + 1,
        capacityPerDay: `${(i+1)*25000} Liters`,
        plantManager: `Manager ${i}`,
        status: 'Operating',
      });
      factories.push(f);
      console.log('[seed-fake-data] Created Factory', f._id.toString());
    }

    // Create 2 departments
    const departments = [];
    for (let i = 1; i <= 2; i++) {
      const d = await Department.create({
        deptCode: `DEP-0${i}`,
        name: `Department ${i}`,
        costCenter: `CC-10${i}`,
        headName: `Head ${i}`,
        staffCount: 5 + i,
        budget: 1000000 * i,
        status: 'Active',
      });
      departments.push(d);
      console.log('[seed-fake-data] Created Department', d._id.toString());
    }

    // Create 2 roles attached to org
    const roles = [];
    for (let i = 1; i <= 2; i++) {
      const r = await Role.create({
        orgId: org._id,
        name: `role_${i}`,
        roleName: i === 1 ? 'General Manager' : 'Plant Supervisor',
        accessLevel: 'Custom Access',
        permissions: ['DASHBOARD','USERS','FACTORIES'],
        description: `Seeded role ${i}`,
        activeUsers: 0,
        status: 'Active',
      });
      roles.push(r);
      console.log('[seed-fake-data] Created Role', r._id.toString());
    }

    // Create 2 users attached to org and roles; hash passwords
    for (let i = 1; i <= 2; i++) {
      const pwd = 'Password123!';
      const hash = bcrypt.hashSync(pwd, 10);
      const u = await User.create({
        orgId: org._id,
        isSuperAdmin: i === 1,
        isOrgAdmin: i === 1,
        empId: `EMP00${i}`,
        name: i === 1 ? 'Seed Super Admin' : `Seed User ${i}`,
        email: i === 1 ? 'seedadmin@example.com' : `user${i}@example.com`,
        passwordHash: hash,
        roleId: roles[i-1]._id,
        roleName: roles[i-1].roleName,
        role: roles[i-1].roleName,
        permissions: roles[i-1].permissions,
        departmentId: departments[i-1]._id,
        department: departments[i-1].name,
        factoryId: factories[i-1]._id,
        plant: factories[i-1].name,
        status: 'Active',
      });
      console.log('[seed-fake-data] Created User', u._id.toString(), 'email:', u.email);
    }

    console.log('[seed-fake-data] Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('[seed-fake-data] Error:', err);
    process.exit(1);
  }
}

run();
