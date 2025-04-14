const { readCsvFile, getDataFilePath } = require('../csv-reader');

// Handler function for the merged-availability API endpoint
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
    console.log(`${new Date().toISOString()} - Merged-Availability API called`);
    
    // Path to the merged-availability CSV file
    const filePath = getDataFilePath('merged-availability.csv');
    
    // Read and parse the CSV file
    const data = await readCsvFile(filePath);
    
    // Return the data as JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading merged-availability data:', error);
    
    // Return a fallback response if CSV reading fails
    const fallbackData = [
      {
        "Provider's ID": "P001",
        "Name": "Provider 1",
        "Role": "AI Creator",
        "Available Now": "Yes",
        "Available In Future": "Yes",
        "Start Date": "2025-03-01",
        "End Date": "2025-05-31",
        "No longer Available": "No",
        "Skills": "Product, Lifestyle",
        "Experience": "3 years",
        "Total Assignments": 2,
        "Current Capacity": 80,
        "Max Capacity": 100
      },
      {
        "Provider's ID": "P002",
        "Name": "Provider 2",
        "Role": "AI Creator",
        "Available Now": "Yes",
        "Available In Future": "Yes",
        "Start Date": "2025-03-15",
        "End Date": "2025-06-15",
        "No longer Available": "No",
        "Skills": "Product, Interior",
        "Experience": "2 years",
        "Total Assignments": 1,
        "Current Capacity": 60,
        "Max Capacity": 100
      },
      {
        "Provider's ID": "P003",
        "Name": "Provider 3",
        "Role": "AI Creator",
        "Available Now": "No",
        "Available In Future": "Yes",
        "Start Date": "2025-04-01",
        "End Date": "2025-07-31",
        "No longer Available": "No",
        "Skills": "Lifestyle, Outdoor",
        "Experience": "4 years",
        "Total Assignments": 0,
        "Current Capacity": 0,
        "Max Capacity": 100
      }
    ];
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(fallbackData);
  }
}; 