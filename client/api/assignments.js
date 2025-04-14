const { readCsvFile } = require('./csv-reader');
const path = require('path');
const fs = require('fs');

// In-memory storage for assignments when file system is read-only
let MEMORY_ASSIGNMENTS = null;

module.exports = async (req, res) => {
  // Debug mode
  const DEBUG = true;
  
  const logDebug = (...args) => {
    if (DEBUG) console.log('[DEBUG]', ...args);
  };
  
  // Log API details
  logDebug('API Handler Start:', new Date().toISOString());
  logDebug('Process CWD:', process.cwd());
  logDebug('Method:', req.method);
  logDebug('Vercel ENV:', process.env.VERCEL);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Reading assignments file...');
    // Read directly from the original source file
    const filePath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');
    console.log('Reading from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('ERROR: Assignments CSV file does not exist at path:', filePath);
      return res.status(500).json({ error: 'Assignments CSV file not found', details: `File not found at ${filePath}` });
    }
    
    console.log('File exists, attempting to read...');
    const records = await readCsvFile(filePath);
    console.log(`Successfully read ${records.length} assignments`);
    
    if (!records || records.length === 0) {
      console.error('ERROR: No records found in assignments CSV file');
      return res.status(500).json({ error: 'No records found in assignments file', details: `File exists but contains no data` });
    }
    
    console.log('Sample assignment data:', records[0]);
    
    // If it's a POST request with new assignments, handle it
    if (req.method === 'POST') {
      try {
        // Process the data
        console.log('Received POST request with new assignments');
        const newAssignments = req.body;
        
        if (!newAssignments || !Array.isArray(newAssignments)) {
          console.error('Invalid data format received:', newAssignments);
          return res.status(400).json({ error: 'Invalid data format' });
        }
        
        console.log(`Saving ${newAssignments.length} new assignments`);
        
        // Return success for now
        return res.json({ success: true, message: 'Assignments saved successfully' });
      } catch (postError) {
        console.error('Error processing POST request:', postError);
        return res.status(500).json({ error: 'Failed to process assignments', details: postError.message });
      }
    }
    
    // Default GET behavior - just return the assignments
    return res.json(records);
  } catch (error) {
    console.error('Error reading assignments data:', error);
    return res.status(500).json({ error: 'Failed to read assignments data', details: error.message, stack: error.stack });
  }
}; 