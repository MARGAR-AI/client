# Installation and Setup Guide

This guide provides step-by-step instructions for setting up and running the AI Provider Assignment System.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

## Installation Steps

### 1. Clone or Download the Project

If you're using Git:

```bash
git clone <repository-url>
cd ai-provider-assignment
```

Or simply extract the project files to a directory of your choice.

### 2. Install Server Dependencies

From the root directory of the project, run:

```bash
npm install
```

This will install all the required server-side dependencies.

### 3. Install Client Dependencies

Navigate to the client directory and install the client-side dependencies:

```bash
cd client
npm install
```

### 4. Verify Data Files

Ensure the following CSV files are present in the root directory:

- `Providers_FUP - HR_ServiceProviderDatabase.csv`
- `Planning ressource allocation_ CONCEPTION - Delivery Planning.csv`
- `Planning ressource allocation_ CONCEPTION - Availability.csv`
- `genai_creators_workload - genai_creators_workload.csv`

## Running the Application

### 1. Start the Backend Server

From the root directory, run:

```bash
node server.js
```

You should see a message indicating that the server is running on port 5000:

```
Server running on port 5000
```

### 2. Start the Frontend Development Server

Open a new terminal window, navigate to the client directory, and run:

```bash
cd client
npm start
```

This will start the React development server and automatically open the application in your default web browser at `http://localhost:3000`.

## Troubleshooting

### Port Already in Use

If you see an error like:

```
Error: listen EADDRINUSE: address already in use :::5000
```

It means port 5000 is already being used by another application. You can:

1. Find and stop the process using port 5000, or
2. Modify the port in `server.js` to use a different port

### Server Not Found

If the frontend cannot connect to the backend, ensure:

1. The backend server is running
2. The proxy setting in `client/package.json` matches the backend server URL

### CSV File Errors

If you encounter errors related to CSV files:

1. Check that all required CSV files are present in the root directory
2. Verify the CSV file format and structure
3. Ensure the file paths in `server.js` are correct

## Production Deployment

For production deployment:

1. Build the React frontend:

```bash
cd client
npm run build
```

2. Configure the server to serve the static files from the build directory
3. Set appropriate environment variables for production
4. Use a process manager like PM2 to keep the server running

## Updating the Application

To update the application:

1. Pull the latest changes or replace the files with the new version
2. Install any new dependencies
3. Restart the server and client applications

## Data Backup

Regularly backup your CSV data files to prevent data loss. Consider implementing a version control system for your data files. 