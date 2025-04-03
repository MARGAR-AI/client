import Papa from 'papaparse';

// Google Sheets CSV URLs
export const SHEET_URLS = {
  projects: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQVm5uU_bxZKSo2C0sF7Toxt_opImC-G-WY5rn1quNSRy3dlpGXZbEhelM6TqhU3X-OaP-0xwwA-U6M/pub?gid=536701555&single=true&output=csv',
  // Add other sheet URLs here when available
};

// Fetch and parse CSV data from Google Sheets
export const fetchSheetData = async (sheetUrl) => {
  try {
    const response = await fetch(sheetUrl);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
};

// Process projects data from Google Sheets
export const processProjectsData = (data) => {
  return data.map(project => ({
    'Project ID': project['Project ID'],
    'Client': project['Client'],
    'Project Name': project['Project Name'],
    'Previsional launch date': project['Previsional launch date'],
    'Previsional final date': project['Previsional final date'],
    'Status': project['Status'],
    'Service': project['Service'],
    'Qty': project['Qty'],
    'Comments': project['Comments']
  }));
}; 