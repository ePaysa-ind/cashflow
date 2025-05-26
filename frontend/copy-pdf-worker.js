const fs = require('fs');
const path = require('path');

// Script to copy PDF.js worker to public directory
// Try multiple possible locations
const possiblePaths = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/es5/build/pdf.worker.min.js'
];

let sourcePath = null;
for (const p of possiblePaths) {
  const fullPath = path.join(__dirname, p);
  if (fs.existsSync(fullPath)) {
    sourcePath = fullPath;
    break;
  }
}

const destPath = path.join(__dirname, 'public/pdf.worker.min.js');

try {
  if (sourcePath && fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log('✅ PDF.js worker copied successfully to public directory');
    console.log('Source:', sourcePath);
  } else {
    console.error('❌ PDF.js worker source file not found');
    console.log('Searched paths:', possiblePaths);
    console.log('Please ensure pdfjs-dist is installed: npm install pdfjs-dist');
  }
} catch (error) {
  console.error('❌ Error copying PDF.js worker:', error);
}