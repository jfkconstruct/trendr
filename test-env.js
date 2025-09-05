// Test script to verify our Supabase configuration works correctly
const fs = require('fs');
const path = require('path');

console.log('Testing Supabase configuration...\n');

// Check if required files exist
const filesToCheck = [
  'lib/supabase/server.ts',
  'lib/supabase/client.ts',
  'app/analytics/page.tsx'
];

let allFilesExist = true;
filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`${filePath}: ${exists ? '✓ Found' : '✗ Missing'}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check that analytics page imports the correct client
const analyticsContent = fs.readFileSync(path.join(__dirname, 'app/analytics/page.tsx'), 'utf8');
const hasCorrectImport = analyticsContent.includes("from '@/lib/supabase/client'");
const hasOldImport = analyticsContent.includes("from '@/lib/supabase'");

console.log(`\nAnalytics page imports client correctly: ${hasCorrectImport ? '✓ Yes' : '✗ No'}`);
console.log(`Analytics page still imports old module: ${hasOldImport ? '✗ Yes (should be removed)' : '✓ No'}`);

if (hasOldImport) {
  console.log('⚠️ Warning: Old import still present in analytics page');
}

// Check that server.ts has the correct 'server-only' directive
const serverContent = fs.readFileSync(path.join(__dirname, 'lib/supabase/server.ts'), 'utf8');
const hasServerOnly = serverContent.includes("'server-only'");
console.log(`Server client has 'server-only': ${hasServerOnly ? '✓ Yes' : '✗ No'}`);

// Check that client.ts has the correct 'use client' directive
const clientContent = fs.readFileSync(path.join(__dirname, 'lib/supabase/client.ts'), 'utf8');
const hasUseClient = clientContent.includes("'use client'");
console.log(`Client client has 'use client': ${hasUseClient ? '✓ Yes' : '✗ No'}`);

console.log('\n✅ Supabase configuration test completed');
