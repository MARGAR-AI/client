const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Source and destination paths
const sourceDir = path.join(__dirname, 'vercel-data');
const destDir = path.join(__dirname, 'data');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

// Function to read CSV file
const readCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

// Function to write CSV file
const writeCsvFile = async (filePath, data, headers) => {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
    });
    await csvWriter.writeRecords(data);
};

// Process and transfer data
async function transferData() {
    try {
        // 1. Process Projects Data
        const projectsData = await readCsvFile(path.join(sourceDir, 'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv'));
        const formattedProjects = projectsData.map(project => ({
            'Project ID': project['Project ID'],
            'Name': project['Project Name'],
            'Client': project['Client'],
            'Type': project['Service'] || 'GENAI',
            'Status': project['Status'] || 'Active'
        }));
        await writeCsvFile(
            path.join(destDir, 'projects.csv'),
            formattedProjects,
            [
                { id: 'Project ID', title: 'Project ID' },
                { id: 'Name', title: 'Name' },
                { id: 'Client', title: 'Client' },
                { id: 'Type', title: 'Type' },
                { id: 'Status', title: 'Status' }
            ]
        );

        // 2. Process Assignments Data
        const assignmentsData = await readCsvFile(path.join(sourceDir, 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv'));
        const formattedAssignments = assignmentsData.map(assignment => ({
            'Assignment ID': assignment['Assigment ID'],
            'Provider': assignment['Provider\'s Name'],
            'Client': assignment['Client'],
            'Project': assignment['Project Name'],
            'Start Date': assignment['Previsional launch date'],
            'End Date': assignment['Previsional delivery date'],
            'Quantity': assignment['Qty']
        }));
        await writeCsvFile(
            path.join(destDir, 'assignments.csv'),
            formattedAssignments,
            [
                { id: 'Assignment ID', title: 'Assignment ID' },
                { id: 'Provider', title: 'Provider' },
                { id: 'Client', title: 'Client' },
                { id: 'Project', title: 'Project' },
                { id: 'Start Date', title: 'Start Date' },
                { id: 'End Date', title: 'End Date' },
                { id: 'Quantity', title: 'Quantity' }
            ]
        );

        // 3. Process Availability Data
        const availabilityData = await readCsvFile(path.join(sourceDir, 'Planning ressource allocation_ CONCEPTION  - Creator Availability.csv'));
        const formattedAvailability = availabilityData.map(provider => ({
            'Provider\'s ID': provider['Provider\'s ID'],
            'Name': provider['Name'],
            'Role': 'AI Creator',
            'Available Now': provider['Available Now'] === 'Yes' ? 'TRUE' : 'FALSE',
            'Available In Future': provider['Available In Future'] === 'Yes' ? 'TRUE' : 'FALSE',
            'Start Date': provider['Start Date'],
            'End Date': provider['End Date'],
            'No longer Available': 'FALSE'
        }));
        await writeCsvFile(
            path.join(destDir, 'availability.csv'),
            formattedAvailability,
            [
                { id: 'Provider\'s ID', title: 'Provider\'s ID' },
                { id: 'Name', title: 'Name' },
                { id: 'Role', title: 'Role' },
                { id: 'Available Now', title: 'Available Now' },
                { id: 'Available In Future', title: 'Available In Future' },
                { id: 'Start Date', title: 'Start Date' },
                { id: 'End Date', title: 'End Date' },
                { id: 'No longer Available', title: 'No longer Available' }
            ]
        );

        // 4. Process Workload Data
        const workloadData = await readCsvFile(path.join(sourceDir, 'genai_creators_workload - genai_creators_workload.csv'));
        await writeCsvFile(
            path.join(destDir, 'workload.csv'),
            workloadData,
            Object.keys(workloadData[0] || {}).map(key => ({ id: key, title: key }))
        );

        console.log('Data transfer completed successfully!');
    } catch (error) {
        console.error('Error during data transfer:', error);
    }
}

transferData(); 