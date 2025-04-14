const { readCsvFile, getDataFilePath } = require('../csv-reader');

// Handler function for the projects API endpoint
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
    console.log(`${new Date().toISOString()} - Projects API called`);
    
    const projectsData = await readCsvFile(getDataFilePath('projects.csv'));
    res.status(200).json(projectsData);
  } catch (error) {
    console.error('Error reading projects data:', error);
    res.status(500).json({ error: 'Failed to read projects data' });
  }
}; 