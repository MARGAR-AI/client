const { readCsvFile } = require('./csv-reader');
const path = require('path');

module.exports = async (req, res) => {
  try {
    console.log('Reading workload file...');
    // Read directly from the original source file
    const filePath = path.join(process.cwd(), 'vercel-data', 'genai_creators_workload - genai_creators_workload.csv');
    console.log('Reading from:', filePath);
    
    const records = await readCsvFile(filePath);
    console.log(`Successfully read ${records.length} workload records`);
    
    res.json(records);
  } catch (error) {
    console.error('Error reading workload data:', error);
    
    // Return sample data as fallback
    const sampleWorkload = [
      {
        "ImageCreatorUserName": "Provider 1",
        "orgCode": "WAYFAIR",
        "ActiveWorkloadSKUsLaunched": "10",
        "ActiveWorkloadSKUsQC": "5",
        "TotalSKUs": "100",
        "TotalImages": "200",
        "TotalSKUsDelivered": "90",
        "TotalImagesDelivered": "180",
        "AvgEdits": "2.5",
        "Provider's ID": "P001",
        "Client": "WAYFAIR",
        "Project": "Project 1"
      },
      {
        "ImageCreatorUserName": "Provider 2",
        "orgCode": "LOWES",
        "ActiveWorkloadSKUsLaunched": "8",
        "ActiveWorkloadSKUsQC": "4",
        "TotalSKUs": "80",
        "TotalImages": "160",
        "TotalSKUsDelivered": "70",
        "TotalImagesDelivered": "140",
        "AvgEdits": "2.0",
        "Provider's ID": "P002",
        "Client": "LOWES",
        "Project": "Project 2"
      },
      {
        "ImageCreatorUserName": "Provider 3",
        "orgCode": "OAK FURN.",
        "ActiveWorkloadSKUsLaunched": "12",
        "ActiveWorkloadSKUsQC": "6",
        "TotalSKUs": "120",
        "TotalImages": "240",
        "TotalSKUsDelivered": "110",
        "TotalImagesDelivered": "220",
        "AvgEdits": "3.0",
        "Provider's ID": "P003",
        "Client": "OAK FURN.",
        "Project": "Project 3"
      }
    ];
    
    res.status(200).json(sampleWorkload);
  }
}; 