# AI Provider Assignment Application

A web application for automated planned assignment of AI providers on projects, ensuring efficiency and optimal allocation based on predefined criteria.

## Features

- **Project Management**: View and manage projects with details like launch dates, delivery dates, and required images.
- **Provider Management**: Track AI provider availability and capacity.
- **Assignment Management**: Assign providers to projects based on availability and experience.
- **Timeline Visualization**: Gantt chart view of projects and assignments.
- **Resource Allocation**: Track allocation status for each project.

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: React with Material UI
- **Data Handling**: CSV parsing for data import/export
- **Date Handling**: date-fns for date manipulation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ai-provider-assignment
   ```

2. Install dependencies:
   ```
   npm install
   cd client
   npm install
   cd ..
   ```

3. Start the development server:
   ```
   npm run dev
   ```

This will start both the backend server (on port 5000) and the React development server (on port 3000).

## Data Sources

The application uses the following CSV files as data sources:

1. **genai_creators_workload.csv**: Contains information about AI creators' workload and experience.
2. **Planning ressource allocation_ CONCEPTION - Availability.csv**: Contains provider availability information.
3. **Planning ressource allocation_ CONCEPTION - Delivery Planning.csv**: Contains project planning information.
4. **Planning ressource allocation_ CONCEPTION - Ressource allocation Planning.csv**: Contains assignment information.

## Key Concepts

- **Provider Capacity**: Each AI provider can create 2 images per day (configurable).
- **Allocation Percentage**: The percentage of a project's required images that have been assigned to providers.
- **Provider Experience**: Based on the number of images delivered and average edits required.

## Usage

1. **Dashboard**: View overall statistics and resource allocation.
2. **Projects**: View all projects and their allocation status.
3. **Project Details**: View and manage assignments for a specific project.
4. **Providers**: View and manage provider availability and capacity.
5. **Assignments**: View all assignments across all projects.
6. **Timeline**: Visualize projects on a Gantt chart.

## API Endpoints

- `GET /api/projects`: Get all projects
- `GET /api/providers`: Get all providers
- `GET /api/assignments`: Get all assignments
- `GET /api/workload`: Get provider workload data
- `POST /api/assignments`: Save assignments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by Gamma.app
- Material UI for the component library

## Documentation

Comprehensive documentation for this project is available in the [documentation](./documentation) folder. The documentation includes:

- [Project Overview](./documentation/PROJECT_OVERVIEW.md)
- [Installation Guide](./documentation/INSTALLATION_GUIDE.md)
- [Component Documentation](./documentation/COMPONENT_DOCUMENTATION.md)
- [API Documentation](./documentation/API_DOCUMENTATION.md)
- [Troubleshooting Guide](./documentation/TROUBLESHOOTING_GUIDE.md)

Please refer to these documents for detailed information about the system, its components, and how to use it. 