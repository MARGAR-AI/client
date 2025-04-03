const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

module.exports = (req, res) => {
  try {
    // Read projects data
    const projectsPath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Delivery Planning (3).csv');
    const projectsContent = fs.readFileSync(projectsPath, 'utf-8');
    const projectsRecords = csv.parse(projectsContent, {
      columns: true,
      skip_empty_lines: true
    });

    const projects = projectsRecords.map(record => ({
      "Project ID": record["Project ID"],
      "Project Name": record["Project Name"],
      "Client": record["Client"],
      "Type": record["Service"],
      "Status": record["Status"],
      "Provisional launch date": record["Previsional launch date"],
      "Provisional final date": record["Previsional final date"],
      "Qty": record["Qty"]
    }));

    // Read assignments data
    const assignmentsPath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Ressource allocation Planning.csv');
    const assignmentsContent = fs.readFileSync(assignmentsPath, 'utf-8');
    const assignmentsRecords = csv.parse(assignmentsContent, {
      columns: true,
      skip_empty_lines: true
    });

    const assignments = assignmentsRecords.map(record => ({
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

    // Read availability data
    const availabilityPath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION  - Availability.csv');
    const availabilityContent = fs.readFileSync(availabilityPath, 'utf-8');
    const availabilityRecords = csv.parse(availabilityContent, {
      columns: true,
      skip_empty_lines: true
    });

    const availability = availabilityRecords.map(record => ({
      "Provider's ID": record["Provider's ID"],
      "Name": record["Name"],
      "Role": record["Role"],
      "Available Now": record["Available Now"],
      "Available In Future": record["Available In Future"],
      "Start Date": record["Start Date"],
      "End Date": record["End Date"],
      "No longer Available": record["No longer Available"]
    }));

    // Read workload data
    const workloadPath = path.join(process.cwd(), 'vercel-data', 'genai_creators_workload - genai_creators_workload.csv');
    const workloadContent = fs.readFileSync(workloadPath, 'utf-8');
    const workloadRecords = csv.parse(workloadContent, {
      columns: true,
      skip_empty_lines: true
    });

    const workload = workloadRecords.map(record => ({
      "ImageCreatorUserName": record["ImageCreatorUserName"],
      "orgCode": record["orgCode"],
      "ActiveWorkloadSKUsLaunched": record["ActiveWorkloadSKUsLaunched"],
      "ActiveWorkloadSKUsQC": record["ActiveWorkloadSKUsQC"],
      "TotalSKUs": record["TotalSKUs"],
      "TotalImages": record["TotalImages"],
      "TotalSKUsDelivered": record["TotalSKUsDelivered"],
      "TotalImagesDelivered": record["TotalImagesDelivered"],
      "AvgEdits": record["AvgEdits"]
    }));

    res.json({
      projects,
      assignments,
      availability,
      workload
    });
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
}; 