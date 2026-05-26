const { execSync } = require('child_process');
require('dotenv').config({ path: '.env' });

try {
  console.log('Running prisma migrate dev...');
  execSync('npx prisma migrate dev --name "implement-login-feature"', { stdio: 'inherit' });
  console.log('Migration successful.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
