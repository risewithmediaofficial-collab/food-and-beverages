import { connectDB } from '../src/config/db.js';
import { User, Role } from '../src/modules/auth/auth.model.js';
import { DEFAULT_ROLES, DEPARTMENT_PRESETS } from '../src/modules/auth/auth.routes.js';

const run = async () => {
  const ok = await connectDB();
  if (!ok) {
    console.error('Could not connect to MongoDB. Aborting.');
    process.exit(1);
  }

  try {
    const emailsToRemove = DEPARTMENT_PRESETS.map(p => p.email).filter(Boolean);
    // Keep superadmin
    const filtered = emailsToRemove.filter(e => e !== 'superadmin@juice-erp.com');

    if (filtered.length) {
      const ures = await User.deleteMany({ email: { $in: filtered } });
      console.log(`Removed ${ures.deletedCount || 0} seeded users.`);
    } else {
      console.log('No preset user emails to remove.');
    }

    const roleNames = DEFAULT_ROLES.map(r => r.name).filter(Boolean);
    if (roleNames.length) {
      const rres = await Role.deleteMany({ orgId: { $exists: false }, name: { $in: roleNames } });
      console.log(`Removed ${rres.deletedCount || 0} global default roles.`);
    } else {
      console.log('No default roles found to remove.');
    }

    console.log('Cleanup finished.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(2);
  }
};

run();
