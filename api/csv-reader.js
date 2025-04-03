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
      console.log(`Attempting to read file: ${filePath}`);
      
      // Check if file exists
      const exists = await fileExists(filePath);
      if (!exists) {
        return reject(new Error(`File not found: ${filePath}`));
      }
      
      // Try to get file stats for debugging
      try {
        const stats = await promisify(fs.stat)(filePath);
        console.log(`File ${filePath} stats: size=${stats.size}, isFile=${stats.isFile()}`);
      } catch (statsErr) {
        console.error(`Error getting file stats: ${statsErr.message}`);
      }
      
      const results = [];
      
      // Read file with detailed error handling
      const stream = fs.createReadStream(filePath)
        .on('error', (err) => {
          console.error(`Stream error for ${filePath}: ${err.message}`);
          reject(err);
        });
      
      stream.pipe(csv({
          skipLines: 0,
          mapHeaders: ({ header }) => {
            if (!header) return '';
            return header.trim();
          },
          mapValues: ({ value }) => {
            if (!value) return '';
            return value.trim();
          }
        }))
        .on('data', (data) => {
          // Process each row - handle BOM characters and other encoding issues
          const processedData = {};
          Object.keys(data).forEach(key => {
            if (!key) return; // Skip empty keys
            
            // Remove BOM characters and trim whitespace
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            const cleanValue = data[key] ? data[key].trim() : '';
            
            if (cleanKey) {
              processedData[cleanKey] = cleanValue;
            }
          });
          
          // Only add non-empty rows
          if (Object.keys(processedData).length > 0) {
            results.push(processedData);
          }
        })
        .on('end', () => {
          console.log(`Successfully read CSV file: ${filePath}`);
          console.log(`Processed ${results.length} rows`);
          
          if (results.length > 0) {
            const firstRow = results[0];
            const firstRowKeys = Object.keys(firstRow);
            console.log(`First row keys: ${JSON.stringify(firstRowKeys)}`);
            console.log(`First row sample:`, JSON.stringify(firstRow));
          } else {
            console.warn(`No data found in ${filePath}`);
          }
          
          resolve(results);
        })
        .on('error', (error) => {
          console.error(`Error parsing CSV: ${error.message}`);
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