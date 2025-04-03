const { readCsvFile, getDataFilePath } = require('./csv-reader');

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
          let projects = await readCsvFile(getDataFilePath('projects.csv')).catch((err) => {
            console.log('Failed to read projects.csv:', err.message);
            return [];
          });
          
          let assignments = await readCsvFile(getDataFilePath('assignments.csv')).catch((err) => {
            console.log('Failed to read assignments.csv:', err.message);
            return [];
          });
          
          let availability = await readCsvFile(getDataFilePath('Planning ressource allocation_ CONCEPTION  - Creator Availability.csv')).catch(async (err) => {
            console.log('Failed to read Creator Availability.csv, trying availability.csv:', err.message);
            return await readCsvFile(getDataFilePath('availability.csv')).catch(() => {
              console.log('Failed to read availability.csv, using mock data');
              return [];
            });
          });
          
          // Transform availability data to expected format
          availability = transformAvailabilityData(availability);
          
          // If any data is empty, use mock data
          if (!projects.length) projects = getMockProjects();
          if (!assignments.length) assignments = getMockAssignments();
          if (!availability.length) availability = getMockAvailability();
          
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
        if (type === 'availability') {
          // Try to read the actual availability file with the full name
          data = await readCsvFile(getDataFilePath('Planning ressource allocation_ CONCEPTION  - Creator Availability.csv')).catch(async () => {
            // Fall back to the simple name
            return await readCsvFile(getDataFilePath('availability.csv'));
          });
          
          // Transform availability data
          data = transformAvailabilityData(data);
        } else {
          data = await readCsvFile(getDataFilePath(fileName));
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
    const role = roleKey ? item[roleKey] : 'AI Creator';
    
    // Check if they are available
    const isAvailable = 
      // If we have a direct availability key
      (availabilityKey && (
        item[availabilityKey] === 'Yes' || 
        item[availabilityKey] === 'TRUE' || 
        item[availabilityKey] === 'FALSE'
      )) ||
      // Or check individual keys that might indicate availability
      item['Available Now'] === 'Yes' || 
      item['No longer Available'] === 'FALSE';
    
    // Create a standardized availability object
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