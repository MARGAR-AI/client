const { readCsvFile } = require('./csv-reader');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  try {
    console.log('Reading projects file...');
    // Read directly from the original source file
    const filePath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv');
    console.log('Reading from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('ERROR: Project CSV file does not exist at path:', filePath);
      return res.status(500).json({ error: 'Project CSV file not found', details: `File not found at ${filePath}` });
    }
    
    console.log('File exists, attempting to read...');
    const records = await readCsvFile(filePath);
    console.log(`Successfully read ${records.length} projects`);
    
    if (!records || records.length === 0) {
      console.error('ERROR: No records found in projects CSV file');
      return res.status(500).json({ error: 'No records found in projects file', details: `File exists but contains no data` });
    }
    
    // Transform the data to match the expected format but preserve original date formats
    console.log('Sample project data:', records[0]);
    
    try {
      const projects = records.map(record => {
        return {
          "Project ID": record["Project ID"] || '',
          "Project Name": record["Project Name"] || '',
          "Client": record["Client"] || '',
          "Type": record["Type"] || record["Service"] || '',
          "Status": record["Status"] || '',
          "Previsional launch date": record["Provisional launch date"] || record["Previsional launch date"] || '',
          "Previsional final date": record["Provisional final date"] || record["Previsional final date"] || '',
          "Qty": record["Qty"] || '0',
          "Confidence Level": record["Confidence Level"] || ''
        };
      });

      console.log(`Transformed ${projects.length} projects`);
      console.log('Sample transformed project:', projects[0]);
      
      return res.json(projects);
    } catch (transformError) {
      console.error('Error transforming project data:', transformError);
      // Try to send back raw records as a fallback
      return res.json(records);
    }
  } catch (error) {
    console.error('Error reading projects data:', error);
    return res.status(500).json({ error: 'Failed to read projects data', details: error.message, stack: error.stack });
  }
}; 