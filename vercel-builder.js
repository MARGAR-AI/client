const fs = require('fs');
const path = require('path');

// List of CSV files to copy
const csvFiles = [
  'genai_creators_workload - genai_creators_workload.csv',
  'Planning ressource allocation_ CONCEPTION  - Availability.csv',
  'Planning ressource allocation_ CONCEPTION  - Creator Availability.csv',
  'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv',
  'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv'
];

// Create a directory to store the CSV files
const dataDir = path.join(__dirname, 'vercel-data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Copy each CSV file to the data directory
csvFiles.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(dataDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to vercel-data directory`);
  } else {
    console.error(`Error: File ${file} not found`);
  }
});

console.log('Vercel build preparation complete!'); 