const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Helper function to read CSV file
function readCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return csv.parse(content, {
        columns: true,
        skip_empty_lines: true
    });
}

// Helper function to write CSV file
function writeCSV(filePath, data, headers) {
    const content = stringify(data, {
        header: true,
        columns: headers
    });
    fs.writeFileSync(filePath, content);
}

// Sync projects data
function syncProjects() {
    const vercelProjects = readCSV('vercel-data/Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv');
    const projectsData = vercelProjects.map(project => ({
        'Project ID': project['Project ID'],
        'Project Name': project['Project Name'],
        'Client': project['Client'],
        'Type': project['Service'],
        'Status': project['Status'],
        'Provisional launch date': project['Previsional launch date'],
        'Provisional final date': project['Previsional final date'],
        'Qty': project['Qty']
    }));

    const headers = ['Project ID', 'Project Name', 'Client', 'Type', 'Status', 'Provisional launch date', 'Provisional final date', 'Qty'];
    writeCSV('data/projects.csv', projectsData, headers);
}

// Sync availability data
function syncAvailability() {
    const vercelAvailability = readCSV('vercel-data/Planning ressource allocation_ CONCEPTION  - Availability.csv');
    const availabilityData = vercelAvailability.map(provider => ({
        'Provider\'s ID': provider['Provider\'s ID'],
        'Name': provider['Name'],
        'Role': provider['Role'],
        'Available Now': provider['Available Now'],
        'Available In Future': provider['Available In Future'],
        'Start Date': provider['Start Date'],
        'End Date': provider['End Date'],
        'No longer Available': provider['No longer Available']
    }));

    const headers = ['Provider\'s ID', 'Name', 'Role', 'Available Now', 'Available In Future', 'Start Date', 'End Date', 'No longer Available'];
    writeCSV('data/availability.csv', availabilityData, headers);
}

// Sync assignments data
function syncAssignments() {
    const vercelAssignments = readCSV('vercel-data/Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');
    const assignmentsData = vercelAssignments.map(assignment => ({
        'Assignment ID': assignment['Assignment ID'],
        'Provider': assignment['Provider\'s Name'],
        'Client': assignment['Client'],
        'Project': assignment['Project Name'],
        'Start Date': assignment['Previsional launch date'],
        'End Date': assignment['Previsional delivery date'],
        'Quantity': assignment['Qty']
    }));

    const headers = ['Assignment ID', 'Provider', 'Client', 'Project', 'Start Date', 'End Date', 'Quantity'];
    writeCSV('data/assignments.csv', assignmentsData, headers);
}

// Sync workload data
function syncWorkload() {
    const vercelWorkload = readCSV('vercel-data/genai_creators_workload - genai_creators_workload.csv');
    const workloadData = vercelWorkload.map(workload => ({
        'ImageCreatorUserName': workload['ImageCreatorUserName'],
        'orgCode': workload['orgCode'],
        'ActiveWorkloadSKUsLaunched': workload['ActiveWorkloadSKUsLaunched'],
        'ActiveWorkloadSKUsQC': workload['ActiveWorkloadSKUsQC'],
        'TotalSKUs': workload['TotalSKUs'],
        'TotalImages': workload['TotalImages'],
        'TotalSKUsDelivered': workload['TotalSKUsDelivered'],
        'TotalImagesDelivered': workload['TotalImagesDelivered'],
        'AvgEdits': workload['AvgEdits']
    }));

    const headers = ['ImageCreatorUserName', 'orgCode', 'ActiveWorkloadSKUsLaunched', 'ActiveWorkloadSKUsQC', 'TotalSKUs', 'TotalImages', 'TotalSKUsDelivered', 'TotalImagesDelivered', 'AvgEdits'];
    writeCSV('data/workload.csv', workloadData, headers);
}

// Main synchronization function
function syncAllData() {
    try {
        console.log('Starting data synchronization...');
        
        console.log('Syncing projects...');
        syncProjects();
        
        console.log('Syncing availability...');
        syncAvailability();
        
        console.log('Syncing assignments...');
        syncAssignments();
        
        console.log('Syncing workload...');
        syncWorkload();
        
        console.log('Data synchronization completed successfully!');
    } catch (error) {
        console.error('Error during synchronization:', error);
    }
}

// Run the synchronization
syncAllData(); 