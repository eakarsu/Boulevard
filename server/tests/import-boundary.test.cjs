const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.join(__dirname, '..');

test('server build, route, middleware, migration, and seed targets exist', () => {
  const required = [
    'src/app.ts',
    'src/config/database.ts',
    'src/middleware/auth.ts',
    'boulevard/index.ts',
    'boulevard/routes/locations.ts',
    'boulevard/routes/cart.ts',
    'boulevard/routes/booking.ts',
    'boulevard/routes/auth.ts',
    'src/database/migrate.ts',
    'src/database/seed.ts',
  ];
  for (const relativePath of required) {
    assert.ok(fs.existsSync(path.join(serverRoot, relativePath)), `${relativePath} should exist`);
  }
  const app = fs.readFileSync(path.join(serverRoot, 'src/app.ts'), 'utf8');
  assert.doesNotMatch(app, /bypassAuth/);
  assert.match(app, /authenticateToken/);
  assert.match(app, /ENABLE_DEBUG_ROUTES/);
  assert.match(app, /requireDebugRoutes, authenticateToken/);
});
