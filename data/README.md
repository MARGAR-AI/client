# CSV Data Files for API Endpoints

Place your CSV files in this directory to be served by the Vercel API endpoints.

## Required Files

The following CSV files should be placed in this directory:

1. `availability.csv` - Provider availability data
2. `assignments.csv` - Project assignments data
3. `projects.csv` - Project information data

## CSV File Format

Ensure your CSV files have headers that match the expected format for each API endpoint.

Example headers:

### availability.csv

```
Provider's ID,Name,Role,No longer Available,Skills
```

### assignments.csv

```
Assignment ID,Provider,Client,Project,Start Date,End Date,Quantity
```

### projects.csv

```
Project ID,Name,Client,Type,Status
```

## Deployment

When deploying to Vercel, make sure these CSV files are included in your deployment. The API endpoints will automatically read these files to serve the data.
