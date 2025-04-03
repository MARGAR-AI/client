const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { parse, format, isValid, addDays, differenceInBusinessDays } = require('date-fns');
const os = require('os');
const { performance } = require('perf_hooks');
const NodeCache = require('node-cache'); // Using in-memory caching

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize cache with 5 minute TTL (time to live)
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Memory monitoring
let lastMemoryCheck = Date.now();
const MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
const MEMORY_THRESHOLD_RATIO = 0.85; // 85% of available memory

function logMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  const totalSystemMemory = os.totalmem();
  const freeSystemMemory = os.freemem();
  const usedMemoryRatio = (totalSystemMemory - freeSystemMemory) / totalSystemMemory;
  
  console.log(`Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB | Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  console.log(`System memory: ${Math.round((totalSystemMemory - freeSystemMemory) / 1024 / 1024)}MB / ${Math.round(totalSystemMemory / 1024 / 1024)}MB (${Math.round(usedMemoryRatio * 100)}%)`);
  
  // Force garbage collection if memory usage is too high
  if (usedMemoryRatio > MEMORY_THRESHOLD_RATIO) {
    console.log('Memory usage high - attempting to free memory');
    if (global.gc) {
      global.gc();
      console.log('Garbage collection complete');
    } else {
      console.log('Garbage collection not available - restart with --expose-gc flag for this feature');
    }
  }
}

// Log memory at startup
logMemoryUsage();

// Schedule regular memory checks
setInterval(() => {
  lastMemoryCheck = Date.now();
  logMemoryUsage();
}, MEMORY_CHECK_INTERVAL);

// Add more detailed debugging to help diagnose server crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.error(err.stack);
  logMemoryUsage();
  // Don't exit the process, just log the error
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add additional logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware to measure response time and log it
app.use((req, res, next) => {
  const start = performance.now();
  
  // Check memory before processing request
  const currentTime = Date.now();
  if (currentTime - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
    lastMemoryCheck = currentTime;
    logMemoryUsage();
  }
  
  // Add response finished listener
  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`${req.method} ${req.originalUrl} completed in ${duration.toFixed(2)}ms with status ${res.statusCode}`);
    
    // Check for slow responses
    if (duration > 1000) {
      console.warn(`SLOW RESPONSE: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
});

// After the existing middleware section, add this caching middleware
// Cache middleware for GET requests
function cacheMiddleware(duration = 300) { // Default 5 minutes
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();
    
    // Create a cache key from the URL
    const key = req.originalUrl || req.url;
    
    // Check if we have a cached response
    const cachedResponse = apiCache.get(key);
    if (cachedResponse) {
      console.log(`Cache hit for ${key}`);
      return res.send(cachedResponse);
    }
    
    // If not in cache, capture the response
    const originalSend = res.send;
    res.send = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(key, body, duration);
        console.log(`Cached ${key} for ${duration} seconds`);
      }
      originalSend.call(this, body);
    };
    
    next();
  };
}

// Add proper caching to all API endpoints
app.use('/api/projects', cacheMiddleware(300)); // Cache for 5 minutes
app.use('/api/assignments', cacheMiddleware(300));
app.use('/api/availability', cacheMiddleware(300));

// CSV file paths - updated for Vercel compatibility
const DATA_DIR = process.env.VERCEL ? './vercel-data' : process.cwd();

const WORKLOAD_CSV = path.join(DATA_DIR, 'genai_creators_workload - genai_creators_workload.csv');
const AVAILABILITY_CSV = path.join(DATA_DIR, 'Planning ressource allocation_ CONCEPTION  - Availability.csv');
const CREATOR_AVAILABILITY_CSV = path.join(DATA_DIR, 'Planning ressource allocation_ CONCEPTION  - Creator Availability.csv');
const DELIVERY_PLANNING_CSV = path.join(DATA_DIR, 'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv');
const RESOURCE_ALLOCATION_CSV = path.join(DATA_DIR, 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');

// Helper function to parse dates from DD/MM/YYYY format
function parseDate(dateString) {
  if (!dateString) return null;
  
  // Try to parse DD/MM/YYYY format
  const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
  
  if (isValid(parsedDate)) {
    return parsedDate;
  }
  
  // Try to parse YYYY-MM-DD format
  const isoDate = parse(dateString, 'yyyy-MM-dd', new Date());
  
  if (isValid(isoDate)) {
    return isoDate;
  }
  
  return null;
}

// Helper function to calculate business days between two dates (excluding weekends)
function getBusinessDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  return differenceInBusinessDays(endDate, startDate) + 1; // Include both start and end dates
}

// Helper function to get client information for a project
function getProjectClient(projectId, projectsCache = null) {
  return new Promise((resolve, reject) => {
    // If we already have the projects data cached, use it
    if (projectsCache && Array.isArray(projectsCache)) {
      const project = projectsCache.find(p => p['Project ID'] === projectId);
      if (project && project['Client']) {
        return resolve(project['Client']);
      }
      return resolve(''); // No client found
    }
    
    // Otherwise, read from the CSV file
    const results = [];
    fs.createReadStream(DELIVERY_PLANNING_CSV)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const project = results.find(p => p['Project ID'] === projectId);
        if (project && project['Client']) {
          return resolve(project['Client']);
        }
        return resolve(''); // No client found
      })
      .on('error', (error) => {
        console.error('Error reading projects CSV:', error);
        return resolve(''); // Return empty on error
      });
  });
}

// Function to repair missing client information in assignments
async function repairAssignmentsClientInfo() {
  console.log('Repairing missing client information in assignments...');
  
  try {
    // Read all projects to create a cache
    const projectsPromise = new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(DELIVERY_PLANNING_CSV)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
    
    // Read all assignments
    const assignmentsPromise = new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(RESOURCE_ALLOCATION_CSV)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
    
    // Wait for both data sets
    const [projects, assignments] = await Promise.all([projectsPromise, assignmentsPromise]);
    
    let updatedCount = 0;
    
    // Check each assignment for missing client
    for (const assignment of assignments) {
      if (!assignment['Client'] && assignment['Project ID']) {
        const project = projects.find(p => p['Project ID'] === assignment['Project ID']);
        if (project && project['Client']) {
          assignment['Client'] = project['Client'];
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      // Convert back to CSV format
      let csvContent = 'Assigment ID,Provider\'s Name,Client,Project ID,Project Name,Batch,Previsional launch date,Previsional delivery date,Service,Qty,% of project\n';
      
      assignments.forEach(assignment => {
        csvContent += `${assignment['Assigment ID'] || ''},${assignment['Provider\'s Name'] || ''},${assignment['Client'] || ''},${assignment['Project ID'] || ''},${assignment['Project Name'] || ''},${assignment['Batch'] || ''},${assignment['Previsional launch date'] || ''},${assignment['Previsional delivery date'] || ''},${assignment['Service'] || ''},${assignment['Qty'] || ''},${assignment['% of project'] || ''}\n`;
      });
      
      // Write back to the file
      await new Promise((resolve, reject) => {
        fs.writeFile(RESOURCE_ALLOCATION_CSV, csvContent, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      
      console.log(`Repaired ${updatedCount} assignments with missing client information`);
    } else {
      console.log('No assignments with missing client information found');
    }
  } catch (error) {
    console.error('Error repairing client information:', error);
  }
}

// Run the repair function on server start
repairAssignmentsClientInfo();

// API endpoint to get workload data - with caching
app.get('/api/workload', cacheMiddleware(600), (req, res) => {
  const cacheKey = 'workload_data';
  const cachedData = apiCache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const results = [];
  let hasError = false;
  
  fs.createReadStream(WORKLOAD_CSV)
    .on('error', (error) => {
      hasError = true;
      console.error('Error opening workload CSV:', error);
      res.status(500).json({ error: 'Failed to read workload data' });
    })
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      if (!hasError) {
        apiCache.set(cacheKey, results, 600); // Cache for 10 minutes
        res.json(results);
      }
    })
    .on('error', (error) => {
      if (!hasError) {
        hasError = true;
        console.error('Error parsing workload CSV:', error);
        res.status(500).json({ error: 'Failed to parse workload data' });
      }
    });
});

// API endpoint to get availability data - with caching
app.get('/api/availability', cacheMiddleware(600), (req, res) => {
  const cacheKey = 'availability_data';
  const cachedData = apiCache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const results = [];
  let hasError = false;
  
  // Read from the Creator Availability CSV using the defined file path
  fs.createReadStream(CREATOR_AVAILABILITY_CSV)
    .on('error', (error) => {
      hasError = true;
      console.error('Error opening creator availability CSV:', error);
      res.status(500).json({ error: 'Failed to read availability data' });
    })
    .pipe(csvParser())
    .on('data', (data) => {
      // Only process if there's a name
      if (data['Name']) {
        // Create a standardized record that matches the format expected by the client
        const record = {
          'Provider\'s ID': data['Provider\'s ID'] || '',
          'Name': data['Name'],
          'Role': 'AI Creator',
          'Available Now': data['Available Now'] === 'Yes' ? 'TRUE' : 'FALSE',
          'Available In Future': data['Available In Future'] === 'Yes' ? 'TRUE' : 'FALSE',
          'Start Date': data['Start Date'] ? parseDate(data['Start Date']) : null,
          'End Date': data['End Date'] ? parseDate(data['End Date']) : null,
          'No longer Available': 'FALSE'
        };
        
        // Calculate duration and capacity
        if (record['Start Date'] && record['End Date']) {
          const businessDays = getBusinessDays(record['Start Date'], record['End Date']);
          record['Duration'] = businessDays;
          record['Capacity'] = businessDays * 2; // Default capacity: 2 images per day
        }
        
        results.push(record);
        
        // If there's a second period, add it as a separate record
        if (data['Add another date'] === 'Yes' && data['Start Date2']) {
          const secondRecord = { ...record };
          secondRecord['Start Date'] = data['Start Date2'] ? parseDate(data['Start Date2']) : null;
          secondRecord['End Date'] = data['End Date2'] ? parseDate(data['End Date2']) : null;
          
          // Calculate duration and capacity for second period
          if (secondRecord['Start Date'] && secondRecord['End Date']) {
            const businessDays = getBusinessDays(secondRecord['Start Date'], secondRecord['End Date']);
            secondRecord['Duration'] = businessDays;
            secondRecord['Capacity'] = businessDays * 2;
          }
          
          results.push(secondRecord);
        }
      }
    })
    .on('end', () => {
      if (!hasError) {
        apiCache.set(cacheKey, results, 600); // Cache for 10 minutes
        res.json(results);
      }
    })
    .on('error', (error) => {
      if (!hasError) {
        hasError = true;
        console.error('Error parsing creator availability CSV:', error);
        res.status(500).json({ error: 'Failed to parse availability data' });
      }
    });
});

// API endpoint to get project data - with caching
app.get('/api/projects', cacheMiddleware(600), (req, res) => {
  const cacheKey = 'projects_data';
  const cachedData = apiCache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const results = [];
  let hasError = false;
  
  fs.createReadStream(DELIVERY_PLANNING_CSV)
    .on('error', (error) => {
      hasError = true;
      console.error('Error opening delivery planning CSV:', error);
      res.status(500).json({ error: 'Failed to read projects data' });
    })
    .pipe(csvParser())
    .on('data', (data) => {
      // Parse dates
      if (data['Previsional launch date']) {
        data['Previsional launch date'] = parseDate(data['Previsional launch date']);
      }
      if (data['Previsional final date']) {
        data['Previsional final date'] = parseDate(data['Previsional final date']);
      }
      
      results.push(data);
    })
    .on('end', () => {
      if (!hasError) {
        apiCache.set(cacheKey, results, 600); // Cache for 10 minutes
        res.json(results);
      }
    })
    .on('error', (error) => {
      if (!hasError) {
        hasError = true;
        console.error('Error parsing delivery planning CSV:', error);
        res.status(500).json({ error: 'Failed to parse projects data' });
      }
    });
});

// API endpoint to get assignments data - with caching
app.get('/api/assignments', cacheMiddleware(600), (req, res) => {
  const cacheKey = 'assignments_data';
  const cachedData = apiCache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const results = [];
  let hasError = false;
  
  fs.createReadStream(RESOURCE_ALLOCATION_CSV)
    .on('error', (error) => {
      hasError = true;
      console.error('Error opening resource allocation CSV:', error);
      res.status(500).json({ error: 'Failed to read assignments data' });
    })
    .pipe(csvParser())
    .on('data', (data) => {
      // Parse dates if they exist
      if (data['Previsional launch date']) {
        data['Previsional launch date'] = parseDate(data['Previsional launch date']);
      }
      if (data['Previsional delivery date']) {
        data['Previsional delivery date'] = parseDate(data['Previsional delivery date']);
      }
      
      results.push(data);
    })
    .on('end', () => {
      if (!hasError) {
        apiCache.set(cacheKey, results, 600); // Cache for 10 minutes
        res.json(results);
      }
    })
    .on('error', (error) => {
      if (!hasError) {
        hasError = true;
        console.error('Error parsing resource allocation CSV:', error);
        res.status(500).json({ error: 'Failed to parse assignments data' });
      }
    });
});

// Helper function to parse quantities correctly, handling comma-separated values
function parseQuantity(value) {
  if (!value) return 0;
  
  // Convert value to string if it's not already
  const strValue = String(value);
  
  // Remove commas, spaces, and other non-numeric characters except decimal points
  const cleanValue = strValue.replace(/[^\d.]/g, '');
  
  return parseInt(cleanValue) || 0;
}

// API endpoint to save assignments
app.post('/api/assignments', async (req, res) => {
  const newAssignments = req.body;
  
  // For debugging only
  console.log(`======= SAVING ASSIGNMENTS =======`);
  console.log(`Received ${newAssignments.length} assignments to save`);
  
  // Try to ensure client information is included for all assignments
  const projectsPromise = new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(DELIVERY_PLANNING_CSV)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
  
  try {
    // Get all projects for client lookup
    const projects = await projectsPromise;
    
    // Ensure each assignment has client info and calculate percentages
    for (const assignment of newAssignments) {
      // Handle client info
      if (!assignment['Client'] && assignment['Project ID']) {
        const project = projects.find(p => p['Project ID'] === assignment['Project ID']);
        if (project && project['Client']) {
          assignment['Client'] = project['Client'];
        }
      }
      
      // Calculate percentage correctly
      if (assignment['Project ID'] && assignment['Project Name']) {
        // Find the matching project from the projects data
        const project = projects.find(p => 
          p['Project ID'] === assignment['Project ID'] && 
          p['Project Name'] === assignment['Project Name']
        );
        
        if (project) {
          // Calculate percentage correctly
          const assignmentQty = parseQuantity(assignment['Qty']);
          const totalProjectQty = parseQuantity(project['Qty']);
          
          if (totalProjectQty > 0) {
            assignment['% of project'] = ((assignmentQty / totalProjectQty) * 100).toFixed(2);
          }
        }
      }
    }
    
    // Convert to CSV format
  let csvContent = 'Assigment ID,Provider\'s Name,Client,Project ID,Project Name,Batch,Previsional launch date,Previsional delivery date,Service,Qty,% of project\n';
  
    newAssignments.forEach(assignment => {
    csvContent += `${assignment['Assigment ID'] || ''},${assignment['Provider\'s Name'] || ''},${assignment['Client'] || ''},${assignment['Project ID'] || ''},${assignment['Project Name'] || ''},${assignment['Batch'] || ''},${assignment['Previsional launch date'] || ''},${assignment['Previsional delivery date'] || ''},${assignment['Service'] || ''},${assignment['Qty'] || ''},${assignment['% of project'] || ''}\n`;
  });
  
    // Write the CSV file
  fs.writeFile(RESOURCE_ALLOCATION_CSV, csvContent, (err) => {
    if (err) {
      console.error('Error writing assignments CSV:', err);
      return res.status(500).json({ error: 'Failed to save assignment data' });
    }
    
    res.json({ success: true, message: 'Assignments saved successfully' });
  });
  } catch (error) {
    console.error('Error processing assignments:', error);
    return res.status(500).json({ error: 'Failed to process and save assignments' });
  }
});

// API endpoint to add a single assignment
app.post('/api/assignment', async (req, res) => {
  const newAssignment = req.body;
  console.log(`POST request to add assignment: ${JSON.stringify(newAssignment)}`);
  
  // Ensure client info is included
  if (!newAssignment['Client'] && newAssignment['Project ID']) {
    try {
      newAssignment['Client'] = await getProjectClient(newAssignment['Project ID']);
    } catch (error) {
      console.error('Error getting client for project:', error);
    }
  }
  
  // Read the current assignments file
  const results = [];
  
  fs.createReadStream(RESOURCE_ALLOCATION_CSV)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log(`Found ${results.length} existing assignments`);
      
      // Debug: Check if there are any duplicate IDs
      const existingIds = results.map(a => String(a['Assigment ID']));
      const newId = String(newAssignment['Assigment ID']);
      
      if (existingIds.includes(newId)) {
        console.log(`WARNING: Assignment ID ${newId} already exists!`);
      }
      
      // Add the new assignment
      results.push(newAssignment);
      
      // Convert back to CSV format
      let csvContent = 'Assigment ID,Provider\'s Name,Client,Project ID,Project Name,Batch,Previsional launch date,Previsional delivery date,Service,Qty,% of project\n';
      
      results.forEach(assignment => {
        csvContent += `${assignment['Assigment ID'] || ''},${assignment['Provider\'s Name'] || ''},${assignment['Client'] || ''},${assignment['Project ID'] || ''},${assignment['Project Name'] || ''},${assignment['Batch'] || ''},${assignment['Previsional launch date'] || ''},${assignment['Previsional delivery date'] || ''},${assignment['Service'] || ''},${assignment['Qty'] || ''},${assignment['% of project'] || ''}\n`;
      });
      
      // Write back to the file
      fs.writeFile(RESOURCE_ALLOCATION_CSV, csvContent, (err) => {
        if (err) {
          console.error('Error writing assignments CSV:', err);
          return res.status(500).json({ error: 'Failed to add assignment' });
        }
        
        console.log(`Successfully added assignment with ID ${newId}`);
        res.json({ 
          success: true, 
          message: 'Assignment added successfully',
          assignment: newAssignment
        });
      });
    })
    .on('error', (error) => {
      console.error('Error reading assignments CSV:', error);
      res.status(500).json({ error: 'Failed to add assignment' });
    });
});

// API endpoint to delete a single assignment
app.delete('/api/assignments/:id', (req, res) => {
  const assignmentId = req.params.id;
  console.log(`======= ASSIGNMENT DELETE =======`);
  console.log(`DELETE request for assignment ID: "${assignmentId}"`);
  
  // Read the current assignments file
  const results = [];
  
  fs.createReadStream(RESOURCE_ALLOCATION_CSV)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log(`Found ${results.length} total assignments before deletion`);
      
      // Convert assignmentId to string and trim to handle numeric IDs
      const requestId = String(assignmentId).trim();
      
      // Log first few assignments to verify IDs
      console.log('First few assignments:');
      results.slice(0, 5).forEach(a => {
        console.log(`ID: "${String(a['Assigment ID']).trim()}" | Provider: ${a['Provider\'s Name']}`);
      });
      
      // Filter out the assignment to be deleted using strict string comparison
      const updatedAssignments = results.filter(a => {
        const currentId = String(a['Assigment ID']).trim();
        const shouldKeep = currentId !== requestId;
        
        if (!shouldKeep) {
          console.log(`FOUND ASSIGNMENT TO DELETE: Provider: ${a['Provider\'s Name']} with ID ${currentId}`);
        }
        
        return shouldKeep;
      });
      
      console.log(`Keeping ${updatedAssignments.length} assignments after filtering out ID ${requestId}`);
      
      if (updatedAssignments.length === results.length) {
        console.log(`WARNING: No assignment found with ID ${requestId}`);
        console.log(`All Assignment IDs: ${results.map(a => `"${String(a['Assigment ID']).trim()}"`).join(', ')}`);
        return res.status(404).json({ success: false, error: 'Assignment not found' });
      }
      
      // Convert back to CSV format
      let csvContent = 'Assigment ID,Provider\'s Name,Client,Project ID,Project Name,Batch,Previsional launch date,Previsional delivery date,Service,Qty,% of project\n';
      
      updatedAssignments.forEach(assignment => {
        csvContent += `${assignment['Assigment ID'] || ''},${assignment['Provider\'s Name'] || ''},${assignment['Client'] || ''},${assignment['Project ID'] || ''},${assignment['Project Name'] || ''},${assignment['Batch'] || ''},${assignment['Previsional launch date'] || ''},${assignment['Previsional delivery date'] || ''},${assignment['Service'] || ''},${assignment['Qty'] || ''},${assignment['% of project'] || ''}\n`;
      });
      
      // Write back to the file
      fs.writeFile(RESOURCE_ALLOCATION_CSV, csvContent, (err) => {
        if (err) {
          console.error('Error writing assignments CSV:', err);
          return res.status(500).json({ success: false, error: 'Failed to delete assignment' });
        }
        
        console.log(`Assignment deletion successful for ID: ${requestId}`);
        console.log(`======= END DELETE =======`);
        
        res.json({ 
          success: true, 
          message: 'Assignment deleted successfully'
        });
      });
    })
    .on('error', (error) => {
      console.error('Error reading assignments CSV:', error);
      res.status(500).json({ success: false, error: 'Failed to delete assignment' });
    });
});

// New API endpoint to update a single assignment
app.put('/api/assignments/:id', async (req, res) => {
  const assignmentId = req.params.id;
  const updatedData = req.body;
  
  console.log(`======= ASSIGNMENT UPDATE =======`);
  console.log(`PUT request for assignment ID: "${assignmentId}"`);
  console.log('Updated fields:', JSON.stringify(updatedData));
  
  // Ensure client info is included in the update if it's missing
  if (!updatedData['Client'] && updatedData['Project ID']) {
    try {
      updatedData['Client'] = await getProjectClient(updatedData['Project ID']);
    } catch (error) {
      console.error('Error getting client for project:', error);
    }
  }
  
  // Read the current assignments file
  const results = [];
  
  fs.createReadStream(RESOURCE_ALLOCATION_CSV)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log(`Found ${results.length} total assignments`);
      
      // Convert the assignmentId from the request to a string
      const requestId = String(assignmentId).trim();
      console.log(`Looking for assignment with ID: "${requestId}"`);
      
      // Log first few assignments and their IDs for debugging
      console.log('First few assignments:');
      results.slice(0, 5).forEach(a => {
        console.log(`ID: "${String(a['Assigment ID']).trim()}" | Provider: ${a['Provider\'s Name']} | Project: ${a['Project ID']}`);
      });
      
      // Find and update the specific assignment - use strict equality with string conversion
      let found = false;
      const updatedAssignments = results.map(a => {
        // Convert assignment ID to string and trim for comparison
        const currentId = String(a['Assigment ID']).trim();
        
        // Direct comparison after ensuring both are strings and trimmed
        if (currentId === requestId) {
          found = true;
          console.log(`MATCH FOUND! Updating assignment: ${a['Provider\'s Name']} with ID ${currentId}`);
          return {...a, ...updatedData};
        }
        return a;
      });
      
      if (!found) {
        console.log(`WARNING: No assignment found with ID ${requestId}`);
        // Log all IDs for debugging
        console.log(`All Assignment IDs: ${results.map(a => `"${String(a['Assigment ID']).trim()}"`).join(', ')}`);
        return res.status(404).json({ success: false, error: 'Assignment not found' });
      }
      
      // Convert back to CSV format
      let csvContent = 'Assigment ID,Provider\'s Name,Client,Project ID,Project Name,Batch,Previsional launch date,Previsional delivery date,Service,Qty,% of project\n';
      
      updatedAssignments.forEach(assignment => {
        csvContent += `${assignment['Assigment ID'] || ''},${assignment['Provider\'s Name'] || ''},${assignment['Client'] || ''},${assignment['Project ID'] || ''},${assignment['Project Name'] || ''},${assignment['Batch'] || ''},${assignment['Previsional launch date'] || ''},${assignment['Previsional delivery date'] || ''},${assignment['Service'] || ''},${assignment['Qty'] || ''},${assignment['% of project'] || ''}\n`;
      });
      
      // Write back to the file
      fs.writeFile(RESOURCE_ALLOCATION_CSV, csvContent, (err) => {
        if (err) {
          console.error('Error writing assignments CSV:', err);
          return res.status(500).json({ success: false, error: 'Failed to update assignment' });
        }
        
        // Find the updated assignment
        const updatedAssignment = updatedAssignments.find(a => String(a['Assigment ID']).trim() === requestId);
        
        console.log(`Assignment update successful for ID: ${requestId}`);
        console.log(`Updated assignment: ${JSON.stringify(updatedAssignment)}`);
        console.log(`======= END UPDATE =======`);
        
        res.json({ 
          success: true, 
          message: 'Assignment updated successfully',
          assignment: updatedAssignment
        });
      });
    })
    .on('error', (error) => {
      console.error('Error reading assignments CSV:', error);
      res.status(500).json({ success: false, error: 'Failed to update assignment' });
    });
});

// API endpoint to get merged availability data
app.get('/api/merged-availability', (req, res) => {
  const results = [];
  
  // Read from the Creator Availability CSV using the defined file path
  fs.createReadStream(CREATOR_AVAILABILITY_CSV)
    .pipe(csvParser())
    .on('data', (data) => {
      // Only process if there's a name
      if (data['Name']) {
        // Create a standardized record that matches the format expected by the client
        const record = {
          'Provider\'s ID': data['Provider\'s ID'] || '',
          'Name': data['Name'],
          'Role': 'AI Creator',
          'Available Now': data['Available Now'] === 'Yes' ? 'TRUE' : 'FALSE',
          'Available In Future': data['Available In Future'] === 'Yes' ? 'TRUE' : 'FALSE',
          'Start Date': data['Start Date'] ? parseDate(data['Start Date']) : null,
          'End Date': data['End Date'] ? parseDate(data['End Date']) : null,
          'No longer Available': 'FALSE'
        };
        
        // Calculate duration and capacity
        if (record['Start Date'] && record['End Date']) {
          const businessDays = getBusinessDays(record['Start Date'], record['End Date']);
          record['Duration'] = businessDays;
          record['Capacity'] = businessDays * 2; // Default capacity: 2 images per day
        }
        
        results.push(record);
        
        // If there's a second period, add it as a separate record
        if (data['Add another date'] === 'Yes' && data['Start Date2']) {
          const secondRecord = { ...record };
          secondRecord['Start Date'] = data['Start Date2'] ? parseDate(data['Start Date2']) : null;
          secondRecord['End Date'] = data['End Date2'] ? parseDate(data['End Date2']) : null;
          
          // Calculate duration and capacity for second period
          if (secondRecord['Start Date'] && secondRecord['End Date']) {
            const businessDays = getBusinessDays(secondRecord['Start Date'], secondRecord['End Date']);
            secondRecord['Duration'] = businessDays;
            secondRecord['Capacity'] = businessDays * 2;
          }
          
          results.push(secondRecord);
        }
      }
    })
    .on('end', () => {
      res.json(results);
    })
    .on('error', (error) => {
      console.error('Error reading creator availability CSV:', error);
      res.status(500).json({ error: 'Failed to read availability data' });
    });
});

// API endpoint to create a new project
app.post('/api/projects', async (req, res) => {
  const newProject = req.body;
  console.log(`======= CREATING NEW PROJECT =======`);
  console.log(`Project Name: ${newProject['Project Name']}`);
  console.log(`Client: ${newProject['Client']}`);
  
  try {
    // Read existing projects
    const existingProjects = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(DELIVERY_PLANNING_CSV)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
    
    // Check if project ID already exists
    const projectIdExists = existingProjects.some(p => p['Project ID'] === newProject['Project ID']);
    if (projectIdExists) {
      return res.status(400).json({ 
        success: false, 
        error: `Project ID '${newProject['Project ID']}' already exists` 
      });
    }
    
    // Add the new project to the array
    existingProjects.push(newProject);
    
    // Convert to CSV format
    const headers = Object.keys(existingProjects[0] || {});
    let csvContent = headers.join(',') + '\n';
    
    existingProjects.forEach(project => {
      const row = headers.map(header => {
        const value = project[header] || '';
        // Quote values that contain commas or quotes
        return value.toString().includes(',') || value.toString().includes('"') 
          ? `"${value.toString().replace(/"/g, '""')}"` 
          : value;
      }).join(',');
      csvContent += row + '\n';
    });
    
    // Write to the file
    await new Promise((resolve, reject) => {
      fs.writeFile(DELIVERY_PLANNING_CSV, csvContent, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log(`Project '${newProject['Project Name']}' created successfully`);
    res.json({ success: true, message: 'Project created successfully' });
    
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// Combined data endpoint with caching
app.get('/api/all-data', cacheMiddleware(300), async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'all_data';
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      console.log('Cache hit for all-data');
      return res.json(cachedData);
    }

    // Read all data in parallel
    const [projects, assignments, providers] = await Promise.all([
      new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(DELIVERY_PLANNING_CSV)
          .pipe(csvParser())
          .on('data', (data) => {
            if (data['Previsional launch date']) {
              data['Previsional launch date'] = parseDate(data['Previsional launch date']);
            }
            if (data['Previsional final date']) {
              data['Previsional final date'] = parseDate(data['Previsional final date']);
            }
            results.push(data);
          })
          .on('end', () => resolve(results))
          .on('error', reject);
      }),
      new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(RESOURCE_ALLOCATION_CSV)
          .pipe(csvParser())
          .on('data', (data) => {
            if (data['Previsional launch date']) {
              data['Previsional launch date'] = parseDate(data['Previsional launch date']);
            }
            if (data['Previsional delivery date']) {
              data['Previsional delivery date'] = parseDate(data['Previsional delivery date']);
            }
            results.push(data);
          })
          .on('end', () => resolve(results))
          .on('error', reject);
      }),
      new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(CREATOR_AVAILABILITY_CSV)
          .pipe(csvParser())
          .on('data', (data) => {
            if (data['Name']) {
              const record = {
                'Provider\'s ID': data['Provider\'s ID'] || '',
                'Name': data['Name'],
                'Role': 'AI Creator',
                'Available Now': data['Available Now'] === 'Yes' ? 'TRUE' : 'FALSE',
                'Available In Future': data['Available In Future'] === 'Yes' ? 'TRUE' : 'FALSE',
                'Start Date': data['Start Date'] ? parseDate(data['Start Date']) : null,
                'End Date': data['End Date'] ? parseDate(data['End Date']) : null,
                'No longer Available': 'FALSE'
              };
              results.push(record);
            }
          })
          .on('end', () => resolve(results))
          .on('error', reject);
      })
    ]);

    const data = {
      projects,
      assignments,
      providers,
      timestamp: Date.now()
    };

    // Cache the result
    apiCache.set(cacheKey, data);

    res.json(data);
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Serve static files from the client/build directory
app.use(express.static(path.join(process.cwd(), 'client/build'), {
  maxAge: '0', // Disable caching for now
  dotfiles: 'ignore',
  fallthrough: true,
  index: 'index.html',
  redirect: false,
  setHeaders: function (res, path, stat) {
    // Disable caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
}));

// Handle any other routes by serving index.html
app.get('*', (req, res) => {
  console.log(`Fallback route handler for: ${req.url}`);
  res.sendFile(path.join(process.cwd(), 'client/build', 'index.html'), err => {
    if (err) {
      console.error(`Error sending index.html file: ${err.message}`);
      res.status(500).send('Error loading application');
    }
  });
});

// Export for Vercel serverless functions
module.exports = app;

// Start the server only in non-Vercel environments
if (process.env.VERCEL_ENV === undefined) {
  // Add this SIGTERM handler
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, preparing for graceful shutdown');
    logMemoryUsage();
    
    // Close the server
    if (server) {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Start the server with proper error handling
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Static files are being served from: ${path.resolve(process.cwd(), 'client/build')}`);
    }
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please close the other application or use a different port.`);
      // Don't exit - let the user decide what to do
    } else {
      console.error('Server error:', error);
    }
  });

  // Process error handlers to prevent crashes
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    logMemoryUsage();
    // Log but don't exit
  }); 
} 