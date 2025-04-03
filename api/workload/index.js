const { readCsvFile, getDataFilePath } = require('../csv-reader');

// Handler function for the workload API endpoint
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
    console.log(`${new Date().toISOString()} - Workload API called`);
    
    // Path to the workload CSV file
    const filePath = getDataFilePath('workload.csv');
    
    // Read and parse the CSV file
    const data = await readCsvFile(filePath);
    
    // Return the data as JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading workload data:', error);
    
    // Return a fallback response if CSV reading fails
    const fallbackData = [
      {
        "Provider's ID": "P001",
        "Name": "Provider 1",
        "Client": "WAYFAIR",
        "Project": "Spring Collection",
        "Type": "Product",
        "Quantity": 150,
        "Start Date": "2025-03-01",
        "End Date": "2025-03-31",
        "Status": "Active",
        "Daily Capacity": 2,
        "Total Capacity": 40,
        "Used Capacity": 30
      },
      {
        "Provider's ID": "P002",
        "Name": "Provider 2",
        "Client": "LOWES",
        "Project": "Home Essentials",
        "Type": "Product",
        "Quantity": 200,
        "Start Date": "2025-03-01",
        "End Date": "2025-03-31",
        "Status": "Active",
        "Daily Capacity": 2,
        "Total Capacity": 40,
        "Used Capacity": 35
      },
      {
        "Provider's ID": "P003",
        "Name": "Provider 3",
        "Client": "LIVINGSPACE",
        "Project": "Urban Living",
        "Type": "Lifestyle",
        "Quantity": 100,
        "Start Date": "2025-03-01",
        "End Date": "2025-03-31",
        "Status": "Active",
        "Daily Capacity": 2,
        "Total Capacity": 40,
        "Used Capacity": 25
      }
    ];
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(fallbackData);
  }
}; 