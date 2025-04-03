# Deployment Guide for AI Provider Assignment Project

This document describes how to deploy the full-stack application (React frontend + Node.js backend) to Vercel.

## Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn
- A Vercel account
- Git (for version control)

## Steps to Deploy

### 1. Clone the Repository

If you haven't already, clone the repository to your local machine:

```
git clone https://github.com/MARGAR-AI/client.git
```

### 2. Install Dependencies

Install dependencies in both the root project and the client directory:

```
npm install
cd client
npm install
cd ..
```

### 3. Build and Deploy

Run the deployment script which will handle all necessary steps:

```
./deploy.sh
```

This script will:
1. Prepare all necessary files for Vercel deployment
2. Create a deployment directory with the correct structure
3. Copy CSV data files that are needed by the backend
4. Deploy the application to Vercel

### 4. Vercel Configuration

When prompted by Vercel CLI:
- Link your GitHub repository if asked
- Choose your personal account or team
- Enter a project name (this will be part of your URL)
- Confirm the deployment settings

### 5. Access Your Deployed Application

Once deployment is complete, Vercel will provide a URL to access your application. You can also find it in your Vercel dashboard.

## Troubleshooting

### CSV Files Not Found

If your application displays errors related to missing CSV files, you may need to:
1. Check that the `vercel-builder.js` script lists all required CSV files
2. Ensure the CSV files are in the correct location
3. Update the file paths in `server.js` if necessary

### API Endpoints Not Working

If API endpoints (/api/*) return 404 errors:
1. Check the routes configuration in vercel.json
2. Ensure the server.js file is properly configured for Vercel
3. Check server logs in the Vercel dashboard

## Updating Your Deployment

To update your deployment after making changes:
1. Commit your changes to git
2. Run `./deploy.sh` again
3. Alternatively, if you've connected your GitHub repository to Vercel, changes will deploy automatically when you push to your repository 