// Test script to verify the app structure
const fs = require('fs');
const path = require('path');

console.log('Checking App.js for critical fixes...\n');

const appPath = path.join(__dirname, 'frontend/src/App.js');
const appContent = fs.readFileSync(appPath, 'utf8');

// Check for selectedFiles state
if (appContent.includes('const [selectedFiles, setSelectedFiles] = useState([])')) {
  console.log('✓ selectedFiles state is properly defined');
} else {
  console.log('✗ selectedFiles state is missing');
}

// Check for proper file handling
if (appContent.includes('setSelectedFiles(prev => [...prev, ...newFiles])')) {
  console.log('✓ File handling uses proper state updates');
} else {
  console.log('✗ File handling still uses direct mutation');
}

// Check for ChatSection component
if (appContent.includes('<ChatSection') && appContent.includes('disabled={!analysis}')) {
  console.log('✓ ChatSection is properly rendered with disabled state');
} else {
  console.log('✗ ChatSection might not be properly configured');
}

// Check for proper logo usage
const headerPath = path.join(__dirname, 'frontend/src/components/Header/Header.js');
const headerContent = fs.readFileSync(headerPath, 'utf8');

if (headerContent.includes('import QashLogo from') && headerContent.includes('<QashLogo')) {
  console.log('✓ Header uses QashLogo component');
} else {
  console.log('✗ Header might not be using QashLogo');
}

// Check for hamburger menu
if (headerContent.includes('hamburger-button') && headerContent.includes('slide-menu')) {
  console.log('✓ Hamburger menu is implemented');
} else {
  console.log('✗ Hamburger menu might be missing');
}

console.log('\nAll critical components should be marked with ✓ for proper functionality.');