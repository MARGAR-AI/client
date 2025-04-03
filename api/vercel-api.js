// Vercel API handler for serverless functions

// Mock datasets
const availabilityData = [
  { "Provider's ID": "P001", "Name": "John Doe", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Photorealistic, Lifestyle" },
  { "Provider's ID": "P002", "Name": "Jane Smith", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Product, Interior" },
  { "Provider's ID": "P003", "Name": "Alex Johnson", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Lifestyle, Outdoor" },
  { "Provider's ID": "P004", "Name": "Sarah Williams", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Product, Photorealistic" },
  { "Provider's ID": "P005", "Name": "Michael Brown", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Interior, Minimal" },
  { "Provider's ID": "P006", "Name": "Emily Davis", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Product, Lifestyle" },
  { "Provider's ID": "P007", "Name": "David Wilson", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Photorealistic, Product" },
  { "Provider's ID": "P008", "Name": "Lisa Miller", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Interior, Lifestyle" },
  { "Provider's ID": "P009", "Name": "Robert Taylor", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Product, Outdoor" },
  { "Provider's ID": "P010", "Name": "Jennifer Anderson", "Role": "AI Creator", "No longer Available": "FALSE", "Skills": "Lifestyle, Interior" }
];

const assignmentsData = [
  { "Assignment ID": "A001", "Provider": "P001", "Client": "WAYFAIR", "Project": "Spring Collection", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 150 },
  { "Assignment ID": "A002", "Provider": "P002", "Client": "LOWES", "Project": "Home Essentials", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 200 },
  { "Assignment ID": "A003", "Provider": "P003", "Client": "LIVINGSPACE", "Project": "Urban Living", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 100 },
  { "Assignment ID": "A004", "Provider": "P004", "Client": "WAYFAIR", "Project": "Office Furniture", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 180 },
  { "Assignment ID": "A005", "Provider": "P005", "Client": "LOWES", "Project": "Garden Collection", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 220 },
  { "Assignment ID": "A006", "Provider": "P006", "Client": "LIVINGSPACE", "Project": "Bedroom Series", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 120 },
  { "Assignment ID": "A007", "Provider": "P007", "Client": "WAYFAIR", "Project": "Kitchen Essentials", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 160 },
  { "Assignment ID": "A008", "Provider": "P008", "Client": "LOWES", "Project": "Bathroom Collection", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 190 },
  { "Assignment ID": "A009", "Provider": "P009", "Client": "LIVINGSPACE", "Project": "Patio Furniture", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 90 },
  { "Assignment ID": "A010", "Provider": "P010", "Client": "WAYFAIR", "Project": "Dining Collection", "Start Date": "2025-03-01", "End Date": "2025-03-31", "Quantity": 170 },
  
  { "Assignment ID": "A011", "Provider": "P001", "Client": "WAYFAIR", "Project": "Spring Collection", "Start Date": "2025-04-01", "End Date": "2025-04-30", "Quantity": 150 },
  { "Assignment ID": "A012", "Provider": "P002", "Client": "LOWES", "Project": "Home Essentials", "Start Date": "2025-04-01", "End Date": "2025-04-30", "Quantity": 200 },
  
  { "Assignment ID": "A021", "Provider": "P001", "Client": "WAYFAIR", "Project": "Summer Collection", "Start Date": "2025-05-01", "End Date": "2025-05-31", "Quantity": 200 },
  { "Assignment ID": "A022", "Provider": "P002", "Client": "LOWES", "Project": "Outdoor Living", "Start Date": "2025-05-01", "End Date": "2025-05-31", "Quantity": 150 },
  { "Assignment ID": "A023", "Provider": "P003", "Client": "OAK FURN.", "Project": "Wood Essentials", "Start Date": "2025-05-01", "End Date": "2025-05-31", "Quantity": 120 },
  
  { "Assignment ID": "A031", "Provider": "P001", "Client": "WAYFAIR", "Project": "Summer Deals", "Start Date": "2025-06-01", "End Date": "2025-06-30", "Quantity": 180 },
  
  { "Assignment ID": "A041", "Provider": "P001", "Client": "WAYFAIR", "Project": "Mid-Year Sale", "Start Date": "2025-07-01", "End Date": "2025-07-31", "Quantity": 150 },
  { "Assignment ID": "A042", "Provider": "P002", "Client": "OAK FURN.", "Project": "Premium Collection", "Start Date": "2025-07-01", "End Date": "2025-07-31", "Quantity": 120 },
  
  { "Assignment ID": "A051", "Provider": "P001", "Client": "OAK FURN.", "Project": "Fall Preview", "Start Date": "2025-08-01", "End Date": "2025-08-31", "Quantity": 100 },
  
  { "Assignment ID": "A061", "Provider": "P001", "Client": "OAK FURN.", "Project": "Fall Collection", "Start Date": "2025-09-01", "End Date": "2025-09-30", "Quantity": 110 },
  
  { "Assignment ID": "A071", "Provider": "P001", "Client": "OAK FURN.", "Project": "Holiday Preview", "Start Date": "2025-10-01", "End Date": "2025-10-31", "Quantity": 130 },
  
  { "Assignment ID": "A081", "Provider": "P001", "Client": "OAK FURN.", "Project": "Holiday Collection", "Start Date": "2025-11-01", "End Date": "2025-11-30", "Quantity": 140 },
  
  { "Assignment ID": "A091", "Provider": "P001", "Client": "OAK FURN.", "Project": "Winter Collection", "Start Date": "2025-12-01", "End Date": "2025-12-31", "Quantity": 110 }
];

const projectsData = [
  { "Project ID": "PR001", "Name": "Spring Collection", "Client": "WAYFAIR", "Type": "Product", "Status": "Active" },
  { "Project ID": "PR002", "Name": "Home Essentials", "Client": "LOWES", "Type": "Product", "Status": "Active" },
  { "Project ID": "PR003", "Name": "Urban Living", "Client": "LIVINGSPACE", "Type": "Lifestyle", "Status": "Active" },
  { "Project ID": "PR004", "Name": "Office Furniture", "Client": "WAYFAIR", "Type": "Product", "Status": "Active" },
  { "Project ID": "PR005", "Name": "Garden Collection", "Client": "LOWES", "Type": "Outdoor", "Status": "Active" },
  { "Project ID": "PR006", "Name": "Bedroom Series", "Client": "LIVINGSPACE", "Type": "Interior", "Status": "Active" },
  { "Project ID": "PR007", "Name": "Kitchen Essentials", "Client": "WAYFAIR", "Type": "Product", "Status": "Active" },
  { "Project ID": "PR008", "Name": "Bathroom Collection", "Client": "LOWES", "Type": "Interior", "Status": "Active" },
  { "Project ID": "PR009", "Name": "Patio Furniture", "Client": "LIVINGSPACE", "Type": "Outdoor", "Status": "Active" },
  { "Project ID": "PR010", "Name": "Dining Collection", "Client": "WAYFAIR", "Type": "Product", "Status": "Active" },
  { "Project ID": "PR011", "Name": "Summer Collection", "Client": "WAYFAIR", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR012", "Name": "Outdoor Living", "Client": "LOWES", "Type": "Outdoor", "Status": "Planned" },
  { "Project ID": "PR013", "Name": "Wood Essentials", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR014", "Name": "Summer Deals", "Client": "WAYFAIR", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR015", "Name": "Mid-Year Sale", "Client": "WAYFAIR", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR016", "Name": "Premium Collection", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR017", "Name": "Fall Preview", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR018", "Name": "Fall Collection", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR019", "Name": "Holiday Preview", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR020", "Name": "Holiday Collection", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" },
  { "Project ID": "PR021", "Name": "Winter Collection", "Client": "OAK FURN.", "Type": "Product", "Status": "Planned" }
];

// Endpoint handlers
const handleAvailability = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(availabilityData);
};

const handleAssignments = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(assignmentsData);
};

const handleProjects = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(projectsData);
};

// Main handler function for Vercel serverless
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log the request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  // Route the request to the appropriate handler based on the path
  if (pathname === '/api/availability') {
    handleAvailability(req, res);
  } else if (pathname === '/api/assignments') {
    handleAssignments(req, res);
  } else if (pathname === '/api/projects') {
    handleProjects(req, res);
  } else {
    // Default response for unknown endpoints
    res.status(404).json({ error: 'Not found' });
  }
}; 