const { readCsvFile, getDataFilePath } = require('../csv-reader');

// Handler function for the assignments API endpoint
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Log the request
    console.log(`${new Date().toISOString()} - Assignments API called`);
    
    // Path to the assignments CSV file
    const filePath = getDataFilePath('assignments.csv');
    
    // Read and parse the CSV file
    const data = await readCsvFile(filePath);
    
    // Return the data as JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading assignments data:', error);
    res.status(500).json({ error: 'Failed to read assignments data' });
  }
}; 