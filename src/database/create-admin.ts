import { hashPassword } from '../auth/password.js';
import { User } from '../users/entities/user.entity.js';
import { databaseDataSource } from './data-source.js';

// Creates the admin account, or resets its password and role. Safe to re-run.
const name = process.env.ADMIN_NAME?.trim() || 'Admin';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';
if (!email || password.length < 8) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env.');

try {
  await databaseDataSource.initialize();
  const users = databaseDataSource.getRepository(User);
  const passwordHash = await hashPassword(password);
  const existing = await users.findOne({ where: { email }, select: { id: true } });
  if (existing) {
    await users.update(existing.id, { passwordHash, role: 'admin', status: 'active' });
    console.log('Admin account updated.');
  } else {
    await users.save(users.create({ name, email, passwordHash, role: 'admin' }));
    console.log('Admin account created.');
  }
} finally {
  if (databaseDataSource.isInitialized) await databaseDataSource.destroy();
}
