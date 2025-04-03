const { readCsvFile } = require('./csv-reader');
const path = require('path');

module.exports = async (req, res) => {
  try {
    console.log('Reading assignments file...');
    // Read directly from the original source file
    const filePath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');
    console.log('Reading from:', filePath);
    
    const records = await readCsvFile(filePath);
    console.log(`Successfully read ${records.length} assignments`);

    // Transform the data to match the expected format
    const assignments = records.map(record => ({
      "Assigment ID": record["Assigment ID"],
      "Provider's Name": record["Provider's Name"],
      "Client": record["Client"],
      "Project ID": record["Project ID"],
      "Project Name": record["Project Name"],
      "Batch": record["Batch"],
      "Previsional launch date": record["Previsional launch date"],
      "Previsional delivery date": record["Previsional delivery date"],
      "Service": record["Service"],
      "Qty": record["Qty"],
      "% of project": record["% of project"]
    }));

    console.log(`Transformed ${assignments.length} assignments`);
    res.json(assignments);
  } catch (error) {
    console.error('Error reading assignments data:', error);
    res.status(500).json({ error: 'Failed to read assignments data', details: error.message });
  }
}; 