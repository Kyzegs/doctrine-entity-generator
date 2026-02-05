const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get git tag
  const gitTag = execSync('git describe --tags --exact-match 2>/dev/null || echo ""', {
    encoding: 'utf8',
  }).trim();

  // Create version object
  const versionInfo = {
    gitTag: gitTag || null,
  };

  // Write to public directory for client access
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionInfo, null, 2));

  console.log('Version info generated:', versionInfo);
} catch (error) {
  console.warn('Could not generate git version info:', error.message);

  // Fallback version
  const fallbackVersion = {
    gitTag: null,
  };

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(fallbackVersion, null, 2));
}
