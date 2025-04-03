const { readCsvFile } = require('./csv-reader');
const path = require('path');

module.exports = async (req, res) => {
  try {
    console.log('Reading projects file...');
    // Read directly from the original source file
    const filePath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv');
    console.log('Reading from:', filePath);
    
    const records = await readCsvFile(filePath);
    console.log(`Successfully read ${records.length} projects`);
    
    // Transform the data to match the expected format but preserve original date formats
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
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects data:', error);
    res.status(500).json({ error: 'Failed to read projects data', details: error.message });
  }
}; 