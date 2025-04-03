const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { promisify } = require('util');

// Check if a file exists
const fileExists = async (filePath) => {
  try {
    await promisify(fs.access)(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

// Read a CSV file and return its contents as JSON
const readCsvFile = (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if file exists
      const exists = await fileExists(filePath);
      if (!exists) {
        return reject(new Error(`File not found: ${filePath}`));
      }
      
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv({
          skipLines: 0,
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (data) => {
          // Process each row
          const processedData = {};
          Object.keys(data).forEach(key => {
            // Remove BOM characters and trim whitespace
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            processedData[cleanKey] = data[key];
          });
          results.push(processedData);
        })
        .on('end', () => {
          console.log(`Successfully read CSV file: ${filePath}`);
          console.log(`First row sample:`, results.length > 0 ? JSON.stringify(results[0]) : 'No data');
          resolve(results);
        })
        .on('error', (error) => {
          console.error(`Error reading CSV: ${error.message}`);
          reject(error);
        });
    } catch (error) {
      console.error(`Exception in readCsvFile: ${error.message}`);
      reject(error);
    }
  });
};

// Helper function to get absolute path to data file
const getDataFilePath = (filename) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  console.log(`Looking for data file at: ${filePath}`);
  return filePath;
};

module.exports = {
  readCsvFile,
  getDataFilePath
}; 