// Vercel serverless function for /api/availability endpoint

const { readCsvFile, getDataFilePath } = require('../csv-reader');

// Handler function for the availability API endpoint
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
    console.log(`${new Date().toISOString()} - Availability API called`);
    
    const availabilityData = await readCsvFile(getDataFilePath('availability.csv'));
    res.status(200).json(availabilityData);
  } catch (error) {
    console.error('Error reading availability data:', error);
    res.status(500).json({ error: 'Failed to read availability data' });
  }
}; 