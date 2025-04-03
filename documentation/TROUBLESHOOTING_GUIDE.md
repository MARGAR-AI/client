# Troubleshooting Guide

This guide provides solutions to common issues you might encounter when running the AI Provider Assignment System.

## Server Issues

### Server Won't Start

**Issue**: When running `node server.js`, the server fails to start.

**Possible Causes and Solutions**:

1. **Port Already in Use**

   **Error Message**: `Error: listen EADDRINUSE: address already in use :::5000`

   **Solution**:
   - Find and stop the process using port 5000:
     ```bash
     # On macOS/Linux
     lsof -i :5000
     kill -9 <PID>
     
     # On Windows
     netstat -ano | findstr :5000
     taskkill /PID <PID> /F
     ```
   - Or modify the port in `server.js`:
     ```javascript
     const PORT = process.env.PORT || 5001;  // Change to an unused port
     ```

2. **Missing Dependencies**

   **Error Message**: `Error: Cannot find module 'express'`

   **Solution**:
   - Run `npm install` to install all dependencies
   - If specific packages are missing, install them manually:
     ```bash
     npm install express csv-parser fs-extra
     ```

3. **File Path Issues**

   **Error Message**: `Error: ENOENT: no such file or directory, open '...'`

   **Solution**:
   - Verify that all CSV files are in the correct location
   - Check file paths in `server.js` and update if necessary
   - Ensure file names match exactly (case-sensitive)

### Server Crashes

**Issue**: The server starts but crashes during operation.

**Possible Causes and Solutions**:

1. **CSV Parsing Errors**

   **Error Message**: `Error: Invalid CSV data`

   **Solution**:
   - Check CSV file format and structure
   - Look for malformed data, missing commas, or extra quotes
   - Validate CSV files using a CSV validator tool

2. **Memory Issues**

   **Error Message**: `JavaScript heap out of memory`

   **Solution**:
   - Increase Node.js memory limit:
     ```bash
     node --max-old-space-size=4096 server.js
     ```
   - Optimize data processing to reduce memory usage

## Client Issues

### Client Won't Start

**Issue**: When running `npm start` in the client directory, the React app fails to start.

**Possible Causes and Solutions**:

1. **Port Already in Use**

   **Error Message**: `Something is already running on port 3000`

   **Solution**:
   - Press `Y` to run the app on another port
   - Or stop the process using port 3000 (see server port solution above)

2. **Missing Dependencies**

   **Error Message**: `Module not found: Can't resolve '...'`

   **Solution**:
   - Run `npm install` in the client directory
   - If specific packages are missing, install them manually

3. **Node Version Issues**

   **Error Message**: `You are using Node ... Please update Node to 14.0.0 or higher`

   **Solution**:
   - Update Node.js to a compatible version
   - Use a version manager like nvm to switch Node versions

### API Connection Issues

**Issue**: The client can't connect to the backend API.

**Possible Causes and Solutions**:

1. **Server Not Running**

   **Error Message**: `Failed to fetch` or `Network Error`

   **Solution**:
   - Ensure the server is running (`node server.js`)
   - Check server console for errors

2. **CORS Issues**

   **Error Message**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

   **Solution**:
   - Verify CORS configuration in `server.js`
   - Ensure the proxy setting in `client/package.json` is correct

3. **Proxy Configuration**

   **Error Message**: `Proxy error: Could not proxy request`

   **Solution**:
   - Check that the proxy in `client/package.json` matches the server URL
   - Restart both client and server

## Data Issues

### Missing or Incorrect Data

**Issue**: Data is missing or displayed incorrectly in the application.

**Possible Causes and Solutions**:

1. **CSV File Format**

   **Problem**: Data is not parsed correctly

   **Solution**:
   - Ensure CSV files use the correct format and column names
   - Check for BOM (Byte Order Mark) in CSV files
   - Verify date formats are consistent (DD/MM/YYYY)

2. **Data Transformation Issues**

   **Problem**: Data is loaded but transformed incorrectly

   **Solution**:
   - Check data transformation logic in components
   - Verify date parsing and formatting
   - Look for type conversion issues (string vs. number)

3. **Caching Issues**

   **Problem**: Old data is displayed after updates

   **Solution**:
   - Implement proper cache invalidation
   - Add timestamp parameters to API requests
   - Use browser developer tools to clear cache

## Component Issues

### Charts Not Rendering

**Issue**: Charts or visualizations are not rendering correctly.

**Possible Causes and Solutions**:

1. **Missing Data**

   **Problem**: No data available for visualization

   **Solution**:
   - Check data fetching and processing
   - Add fallback UI for empty data states

2. **Dimension Issues**

   **Problem**: Chart container has zero height/width

   **Solution**:
   - Set explicit dimensions for chart containers
   - Use useEffect to handle resize events

3. **Library Issues**

   **Problem**: Chart library errors

   **Solution**:
   - Check console for specific errors
   - Verify chart library version compatibility
   - Update or downgrade library as needed

### Performance Issues

**Issue**: The application is slow or unresponsive.

**Possible Causes and Solutions**:

1. **Large Data Sets**

   **Problem**: Processing large amounts of data

   **Solution**:
   - Implement pagination for large data sets
   - Use virtualized lists for long scrollable content
   - Optimize data processing and filtering

2. **Excessive Re-rendering**

   **Problem**: Components re-render too frequently

   **Solution**:
   - Use React.memo for pure components
   - Optimize useEffect dependencies
   - Use useCallback and useMemo for expensive operations

## Debugging Tips

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Look for errors in the Console tab
   - Check Network tab for failed API requests

2. **Server Logs**
   - Monitor server console output
   - Add console.log statements for debugging
   - Check for uncaught exceptions

3. **Component Inspection**
   - Use React Developer Tools extension
   - Inspect component props and state
   - Check component rendering lifecycle

4. **API Testing**
   - Use tools like Postman to test API endpoints
   - Verify request and response formats
   - Check for proper error handling

## Getting Help

If you encounter issues not covered in this guide:

1. Check the project documentation
2. Search for similar issues in the project repository
3. Consult with the development team
4. Provide detailed information about the issue:
   - Steps to reproduce
   - Error messages
   - Browser/Node.js versions
   - Screenshots or logs