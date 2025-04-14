const { readCsvFile, getDataFilePath } = require('./csv-reader');
const fs = require('fs');
const path = require('path');

// Define the paths to our data files
const PROJECT_FILE_PATH = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv');
const ASSIGNMENT_FILE_PATH = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');
const PROVIDER_FILE_PATH = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Availability.csv');

// Cache for the data
let projects = null;
let assignments = null;
let providers = null;

// Preload all data
async function loadAllData() {
  try {
    console.log("Preloading all data...");
    if (!projects) {
      console.log("Loading projects data...");
      projects = await readCsvFile(PROJECT_FILE_PATH);
      console.log(`Loaded ${projects.length} projects`);
    }
    
    if (!assignments) {
      console.log("Loading assignments data...");
      assignments = await readCsvFile(ASSIGNMENT_FILE_PATH);
      console.log(`Loaded ${assignments.length} assignments`);
    }
    
    if (!providers) {
      console.log("Loading providers data...");
      providers = await readCsvFile(PROVIDER_FILE_PATH);
      console.log(`Loaded ${providers.length} providers`);
    }
    
    return {
      projects,
      assignments,
      providers
    };
  } catch (error) {
    console.error("Error preloading data:", error);
    throw error;
  }
}

// Fix the module.exports to make the summary endpoint the main handler
module.exports = async (req, res) => {
  try {
    // Load all data first
    await loadAllData();
    
    // Calculate unique AI Creators
    const uniqueProviderNames = new Set();
    const aiCreators = providers.filter(p => {
      if (p && p.Role === 'AI Creator' && p.Name && !uniqueProviderNames.has(p.Name)) {
        uniqueProviderNames.add(p.Name);
        return true;
      }
      return false;
    });
    
    // Calculate active AI creators (available now)
    const activeCreators = aiCreators.filter(p => p['Available Now'] === 'TRUE' && p['No longer Available'] !== 'TRUE');
    
    // Calculate assigned providers count
    const assignedProvidersSet = new Set(assignments.map(a => a["Provider's Name"]).filter(Boolean));
    
    // Create the response
    const summary = {
      providers: {
        total: uniqueProviderNames.size,
        active: activeCreators.length,
        assigned: assignedProvidersSet.size,
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.Status === 'In Progress').length,
        completed: projects.filter(p => p.Status === 'Completed').length,
      },
      assignments: {
        total: assignments.length,
      }
    };
    
    // Log the summary for debugging
    console.log("API Summary Response:", summary);
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ error: 'Failed to generate dashboard data', details: error.message });
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

// Handler for the summary endpoint
async function summary(req, res) {
  try {
    // Load all data first
    const data = await loadAllData();
    
    // Calculate unique AI Creators
    const uniqueProviderNames = new Set();
    const aiCreators = data.providers.filter(p => {
      if (p && p.Role === 'AI Creator' && p.Name && !uniqueProviderNames.has(p.Name)) {
        uniqueProviderNames.add(p.Name);
        return true;
      }
      return false;
    });
    
    // Calculate active AI creators (available now)
    const activeCreators = aiCreators.filter(p => p['Available Now'] === 'TRUE' && p['No longer Available'] !== 'TRUE');
    
    // Calculate assigned providers count
    const assignedProvidersSet = new Set(data.assignments.map(a => a["Provider's Name"]).filter(Boolean));
    
    // Create the response
    const summary = {
      providers: {
        total: uniqueProviderNames.size,
        active: activeCreators.length,
        assigned: assignedProvidersSet.size,
      },
      projects: {
        total: data.projects.length,
        active: data.projects.filter(p => p.Status === 'In Progress').length,
        completed: data.projects.filter(p => p.Status === 'Completed').length,
      },
      assignments: {
        total: data.assignments.length,
      }
    };
    
    // Log the summary for debugging
    console.log("API Summary Response:", summary);
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ error: 'Failed to generate dashboard data', details: error.message });
  }
} 