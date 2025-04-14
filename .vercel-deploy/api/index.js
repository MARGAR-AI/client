const { readCsvFile, getDataFilePath } = require('./csv-reader');
const fs = require('fs');
const path = require('path');

// Consolidated API endpoint to return all data
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query;
  console.log(`API request received: ${type || 'all'}`);
  console.log(`Current working directory: ${process.cwd()}`);
  
  // List all files in the data directory for debugging
  try {
    const dataDir = path.join(process.cwd(), 'data');
    console.log(`Checking data directory: ${dataDir}`);
    
    const files = fs.readdirSync(dataDir);
    console.log('Files in data directory:', files);
  } catch (error) {
    console.error(`Error listing data directory: ${error.message}`);
  }
  
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
        try {
          console.log('Attempting to load all data files...');
          
          let projects = [];
          try {
            projects = await readCsvFile(getDataFilePath('projects.csv'));
            console.log('Projects loaded successfully:', projects.length);
          } catch (err) {
            console.error('Failed to read projects.csv:', err.message);
          }
          
          let assignments = [];
          try {
            assignments = await readCsvFile(getDataFilePath('assignments.csv'));
            console.log('Assignments loaded successfully:', assignments.length);
          } catch (err) {
            console.error('Failed to read assignments.csv:', err.message);
          }
          
          let availability = [];
          try {
            availability = await readCsvFile(getDataFilePath('availability.csv'));
            console.log('Availability loaded successfully:', availability.length);
          } catch (err) {
            console.error('Failed to read availability.csv:', err.message);
            try {
              availability = await readCsvFile(getDataFilePath('Planning ressource allocation_ CONCEPTION  - Creator Availability.csv'));
              console.log('Creator Availability loaded successfully:', availability.length);
            } catch (err2) {
              console.error('Failed to read Creator Availability.csv:', err2.message);
            }
          }
          
          // Transform availability data
          availability = transformAvailabilityData(availability);
          
          // If any data is empty, use mock data
          if (!projects.length) {
            console.log('Using mock projects data');
            projects = getMockProjects();
          }
          
          if (!assignments.length) {
            console.log('Using mock assignments data');
            assignments = getMockAssignments();
          }
          
          if (!availability.length) {
            console.log('Using mock availability data');
            availability = getMockAvailability();
          }
          
          return res.status(200).json({
            projects,
            assignments,
            availability
          });
        } catch (err) {
          console.error('Error fetching all data:', err);
          return res.status(200).json({
            projects: getMockProjects(),
            assignments: getMockAssignments(),
            availability: getMockAvailability()
          });
        }
    }
    
    // Read data for specific file if requested
    if (fileName) {
      try {
        console.log(`Attempting to read ${fileName}...`);
        data = await readCsvFile(getDataFilePath(fileName));
        console.log(`Successfully read ${fileName}, ${data.length} records`);
        
        // Transform availability data if needed
        if (type === 'availability') {
          data = transformAvailabilityData(data);
        }
      } catch (err) {
        console.log(`Failed to read ${fileName}, using mock data:`, err.message);
        // Return mock data based on type
        switch (type) {
          case 'projects':
            data = getMockProjects();
            break;
          case 'assignments':
            data = getMockAssignments();
            break;
          case 'availability':
            data = getMockAvailability();
            break;
          default:
            data = [];
        }
      }
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error reading data: ${error.message}`);
    res.status(200).json({ error: 'Failed to read data', message: error.message });
  }
};

// Transform availability data from the actual CSV format to the expected format
function transformAvailabilityData(data) {
  if (!data || !data.length) return [];
  
  console.log('Raw availability data sample:', JSON.stringify(data[0]));
  
  return data.map(item => {
    // Check if this is already in the right format
    if (item.Role && item['No longer Available'] !== undefined) {
      return item;
    }
    
    // Check each possible key pattern in the data
    const roleKey = Object.keys(item).find(key => 
      key.includes('Role') || key.includes('role') || 
      key.includes('Name') || (key.includes('ID') && key.includes('Name'))
    );
    
    const availabilityKey = Object.keys(item).find(key => 
      key.includes('Available Now') || key.includes('Available In') || 
      key.includes('No longer Available')
    );
    
    // Extract role value - use AI Creator as default
    const role = item['Name'] || item['Role'] || 'AI Creator';
    
    // Check if they are available
    let isAvailable = true;
    
    // Try to determine availability from various possible fields
    if (item['Available Now'] === 'Yes' || item['Available Now'] === 'yes') {
      isAvailable = true;
    } else if (item['No longer Available'] === 'FALSE') {
      isAvailable = true;
    } else if (item['No longer Available'] === 'TRUE') {
      isAvailable = false;
    }
    
    // Return a standardized availability object
    return {
      "Role": "AI Creator", // Always use AI Creator as the role
      "No longer Available": isAvailable ? "FALSE" : "TRUE"
    };
  });
}

// Mock data functions
function getMockProjects() {
  return [
    { "Client": "WAYFAIR", "Type": "Product" },
    { "Client": "LOWES", "Type": "Product" },
    { "Client": "OAK FURN.", "Type": "Product" },
    { "Client": "LIVINGSPACE", "Type": "Product" }
  ];
}

function getMockAssignments() {
  return [
    { "Client": "WAYFAIR", "Month": "January", "Assigned": "2" },
    { "Client": "LOWES", "Month": "January", "Assigned": "3" },
    { "Client": "OAK FURN.", "Month": "January", "Assigned": "2" },
    { "Client": "LIVINGSPACE", "Month": "January", "Assigned": "1" },
    { "Client": "WAYFAIR", "Month": "February", "Assigned": "3" },
    { "Client": "LOWES", "Month": "February", "Assigned": "2" },
    { "Client": "OAK FURN.", "Month": "February", "Assigned": "2" },
    { "Client": "LIVINGSPACE", "Month": "February", "Assigned": "2" },
    { "Client": "WAYFAIR", "Month": "March", "Assigned": "4" },
    { "Client": "LOWES", "Month": "March", "Assigned": "3" },
    { "Client": "OAK FURN.", "Month": "March", "Assigned": "3" },
    { "Client": "LIVINGSPACE", "Month": "March", "Assigned": "2" }
  ];
}

function getMockAvailability() {
  return Array(10).fill().map(() => ({
    "Role": "AI Creator",
    "No longer Available": "FALSE"
  }));
} 