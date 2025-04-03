# AI Provider Assignment System Documentation

Welcome to the documentation for the AI Provider Assignment System. This documentation provides comprehensive information about the system, its components, and how to use it.

## Table of Contents

1. [Project Overview](PROJECT_OVERVIEW.md)
   - Introduction to the system
   - Key features
   - Technology stack
   - System architecture
   - Project structure

2. [Installation Guide](INSTALLATION_GUIDE.md)
   - Prerequisites
   - Installation steps
   - Running the application
   - Troubleshooting installation issues
   - Production deployment

3. [Component Documentation](COMPONENT_DOCUMENTATION.md)
   - Dashboard components
   - Project components
   - Provider components
   - Assignment components
   - Common patterns and dependencies

4. [API Documentation](API_DOCUMENTATION.md)
   - API endpoints
   - Request and response formats
   - Error handling
   - Data formats
   - Implementation notes

5. [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
   - Server issues
   - Client issues
   - Data issues
   - Component issues
   - Debugging tips

## Quick Start

To quickly get started with the AI Provider Assignment System:

1. Ensure you have Node.js installed (v14.0.0 or higher)
2. Install server dependencies: `npm install` (in the root directory)
3. Install client dependencies: `cd client && npm install`
4. Start the server: `node server.js` (in the root directory)
5. Start the client: `cd client && npm start`
6. Access the application at `http://localhost:3000`

## System Requirements

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Browser**: Latest versions of Chrome, Firefox, Safari, or Edge
- **Operating System**: Windows, macOS, or Linux

## Data Files

The system relies on the following CSV data files:

- `Providers_FUP - HR_ServiceProviderDatabase.csv`: Provider information
- `Planning ressource allocation_ CONCEPTION - Delivery Planning.csv`: Project data
- `Planning ressource allocation_ CONCEPTION - Availability.csv`: Availability data
- `genai_creators_workload - genai_creators_workload.csv`: Workload data

Ensure these files are present in the root directory of the project.

## Support and Maintenance

For support or maintenance requests:

1. Refer to the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) for common issues
2. Check the project repository for updates and known issues
3. Contact the development team for assistance

## Future Development

The system is designed to be extensible. Future development plans include:

- Database integration
- User authentication
- Advanced analytics
- Mobile responsiveness improvements
- Integration with external tools

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. 