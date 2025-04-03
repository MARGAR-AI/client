const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// CSV file paths
const SOURCE_CSV = path.join(__dirname, 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning (2).csv');
const TARGET_CSV = path.join(__dirname, 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');

// Read the CSV file
const results = [];
fs.createReadStream(SOURCE_CSV)
  .pipe(csvParser())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Convert results to CSV format
    let csvContent = 'Assigment ID,Provider\'s Name,Client,Project ID,Project Name,Batch,Previsional launch date,Previsional delivery date,Service,Qty,% of project\n';
    
    results.forEach(assignment => {
      csvContent += `${assignment['Assigment ID'] || ''},${assignment['Provider\'s Name'] || ''},${assignment['Client'] || ''},${assignment['Project ID'] || ''},${assignment['Project Name'] || ''},${assignment['Batch'] || ''},${assignment['Previsional launch date'] || ''},${assignment['Previsional delivery date'] || ''},${assignment['Service'] || ''},${assignment['Qty'] || ''},${assignment['% of project'] || ''}\n`;
    });
    
    // Write back to the file
    fs.writeFile(TARGET_CSV, csvContent, (err) => {
      if (err) {
        console.error('Error writing assignments CSV:', err);
        return;
      }
      
      console.log('Assignments updated successfully with new data');
    });
  }); 