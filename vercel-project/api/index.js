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
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to get absolute path to data file
const getDataFilePath = (filename) => {
  return path.join(process.cwd(), 'data', filename);
};

// Consolidated API endpoint to return all data
module.exports = async (req, res) => {
  const { type } = req.query;
  console.log(`API request received: ${type || 'all'}`);
  
  try {
    let data = [];
    let fileName = '';
    
    // Determine which data to return based on query parameter
    switch (type) {
      case 'projects':
        fileName = 'projects.csv';
        break;
      case 'assignments':
        fileName = 'assignments.csv';
        break;
      case 'availability':
        fileName = 'availability.csv';
        break;
      default:
        // Return all data if no specific type is requested
        const projects = await readCsvFile(getDataFilePath('projects.csv')).catch(() => {
          console.log('Failed to read projects.csv');
          return [];
        });
        
        const assignments = await readCsvFile(getDataFilePath('assignments.csv')).catch(() => {
          console.log('Failed to read assignments.csv');
          return [];
        });
        
        const availability = await readCsvFile(getDataFilePath('availability.csv')).catch(() => {
          console.log('Failed to read availability.csv');
          return [];
        });
        
        return res.status(200).json({
          projects,
          assignments,
          availability
        });
    }
    
    // Read data for specific file if requested
    if (fileName) {
      data = await readCsvFile(getDataFilePath(fileName)).catch(() => {
        console.log(`Failed to read ${fileName}`);
        return [];
      });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error reading data: ${error.message}`);
    res.status(500).json({ error: 'Failed to read data', message: error.message });
  }
}; 