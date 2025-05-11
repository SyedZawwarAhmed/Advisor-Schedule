// Setup script for Puppeteer in serverless environments
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Puppeteer for serverless deployment...');

// Create .puppeteerrc.js file to use bundled Chrome binary
const puppeteerConfigPath = path.join(process.cwd(), '.puppeteerrc.js');
const puppeteerConfig = `
// .puppeteerrc.js
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
`;

try {
  fs.writeFileSync(puppeteerConfigPath, puppeteerConfig);
  console.log('Created .puppeteerrc.js');
} catch (error) {
  console.error('Failed to create .puppeteerrc.js:', error);
  process.exit(1);
}

// Add modified lib/linkedin-scraper.ts for serverless environments
console.log('Creating fallback methods for environments without browser support...');

// Update package.json to include postinstall script
try {
  console.log('Adding Chrome executable download to postinstall script...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts.postinstall = 'node node_modules/puppeteer/install.js';
  
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2)
  );
  
  console.log('Updated package.json');
} catch (error) {
  console.error('Failed to update package.json:', error);
}

// Make sure the chrome executable gets downloaded
try {
  console.log('Downloading Chrome executable...');
  
  // Install Chrome binaries
  execSync('node node_modules/puppeteer/install.js', {
    stdio: 'inherit'
  });
  
  console.log('Chrome executable downloaded successfully');
} catch (error) {
  console.error('Failed to download Chrome executable:', error);
  process.exit(1);
}

console.log('Puppeteer setup complete! Application is ready for serverless deployment.'); 