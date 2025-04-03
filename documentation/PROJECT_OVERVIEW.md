# AI Provider Assignment System - Project Overview

## Introduction

The AI Provider Assignment System is a web application designed to automate the assignment of AI creators to projects based on their availability, skills, and project requirements. The system helps manage resource allocation, track project timelines, and optimize the workload distribution among AI creators.

## Key Features

1. **Dashboard Overview**
   - Display of key metrics (projects, providers, assignments)
   - AI Creator statistics (total, active, quit)
   - Capacity projection chart with adjustable settings
   - Resource allocation summary

2. **Project Management**
   - Project listing with filtering and sorting
   - Project details with timeline visualization
   - Gantt chart for project scheduling

3. **Provider Management**
   - Provider listing with availability status
   - Provider details with skills and capacity
   - Provider workload visualization

4. **Assignment Management**
   - Manual assignment creation
   - Automated assignment suggestions
   - Assignment tracking and modification

5. **Capacity Planning**
   - Visual capacity projection over time
   - Adjustable capacity settings per provider
   - Resource allocation optimization

## Technology Stack

### Frontend
- React.js
- Material-UI for component styling
- Chart.js for data visualization
- date-fns for date manipulation

### Backend
- Node.js
- Express.js
- CSV file-based data storage

### Data Sources
- Provider data: `Providers_FUP - HR_ServiceProviderDatabase.csv`
- Project data: `Planning ressource allocation_ CONCEPTION - Delivery Planning.csv`
- Availability data: `Planning ressource allocation_ CONCEPTION - Availability.csv`
- Workload data: `genai_creators_workload - genai_creators_workload.csv`

## System Architecture

The application follows a client-server architecture:

1. **Client (React Frontend)**
   - User interface components
   - State management
   - API requests to the server

2. **Server (Node.js/Express Backend)**
   - API endpoints
   - Data processing
   - CSV file reading/writing

3. **Data Storage**
   - CSV files for persistent storage
   - In-memory caching for performance

## Project Structure

```
project-root/
├── client/                  # Frontend React application
│   ├── public/              # Static files
│   └── src/                 # React source code
│       ├── components/      # UI components
│       │   ├── assignments/ # Assignment-related components
│       │   ├── dashboard/   # Dashboard components
│       │   ├── projects/    # Project-related components
│       │   └── providers/   # Provider-related components
│       └── App.js           # Main application component
├── server.js                # Express server and API endpoints
├── documentation/           # Project documentation
└── *.csv                    # Data files
```

## Future Enhancements

1. Database integration for more robust data storage
2. User authentication and role-based access control
3. Real-time notifications for assignment changes
4. Advanced analytics and reporting features
5. Integration with external project management tools 