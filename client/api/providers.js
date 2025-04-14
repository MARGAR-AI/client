const { readCsvFile } = require('./csv-reader');
const path = require('path');

module.exports = async (req, res) => {
  try {
    console.log('Reading providers file...');
    // Read directly from the original source file
    const filePath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Availability.csv');
    console.log('Reading from:', filePath);
    
    const records = await readCsvFile(filePath);
    console.log(`Successfully read ${records.length} records`);

    // Get current date and format it
    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    // Get date 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const formattedFutureDate = `${futureDate.getDate().toString().padStart(2, '0')}/${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getFullYear()}`;
    
    const providers = records
      .filter(record => record['Name'] && record['Role'])
      .map(record => {
        // Base provider object
        const provider = {
          "Provider's ID": record["Provider's ID"] || '',
          "Name": record["Name"] || '',
          "Role": record["Role"] || '',
          "Available Now": record["Available Now"] || 'FALSE',
          "Available In Future": record["Available In Future"] || 'FALSE',
          "Start Date": record["Start Date"] || '',
          "End Date": record["End Date"] || '',
          "No longer Available": record["No longer Available"] || 'FALSE'
        };
        
        // Add default dates for available providers with missing dates
        if ((provider["Available Now"] === 'TRUE' || provider["Available Now"] === 'Yes') && 
            (!provider["Start Date"] || !provider["End Date"])) {
          console.log(`Adding default dates for ${provider["Name"]}`);
          provider["Start Date"] = formattedToday;
          provider["End Date"] = formattedFutureDate;
          
          // Calculate business days between dates (approx 22 business days in 30 calendar days)
          provider["Duration"] = 22;
          provider["Capacity"] = 44; // 22 business days * 2 images per day
        }
        
        return provider;
      });

    const uniqueProviders = providers.reduce((acc, current) => {
      const x = acc.find(item => item.Name === current.Name);
      if (!x) {
        return acc.concat([current]);
      } else {
        const index = acc.findIndex(item => item.Name === current.Name);
        if (current["Start Date"] && (!x["Start Date"] || new Date(current["Start Date"]) > new Date(x["Start Date"]))) {
          acc[index] = current;
        }
        return acc;
      }
    }, []);

    console.log(`Sending ${uniqueProviders.length} providers`);
    res.json(uniqueProviders);
  } catch (error) {
    console.error('Error in providers API:', error);
    res.status(500).json({ error: 'Failed to read providers data', details: error.message });
  }
}; 