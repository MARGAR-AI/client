# API Documentation

This document provides detailed information about the backend API endpoints in the AI Provider Assignment System.

## Base URL

All API endpoints are relative to the base URL of the server, which is typically:

```
http://localhost:5000
```

## API Endpoints

### Projects

#### Get All Projects

```
GET /api/projects
```

Retrieves a list of all projects.

**Response:**

```json
[
  {
    "Project": "Project Name",
    "Previsional launch date": "DD/MM/YYYY",
    "Previsional final date": "DD/MM/YYYY",
    "Confidence Level": "Sheduled with customer",
    "Qty": "100",
    "Status": "Active"
  },
  ...
]
```

### Providers

#### Get All Providers

```
GET /api/availability
```

Retrieves a list of all providers with their availability information.

**Response:**

```json
[
  {
    "Name": "Provider Name",
    "Role": "AI Creator",
    "Start Date": "DD/MM/YYYY",
    "End Date": "DD/MM/YYYY",
    "No longer Available": "TRUE/FALSE",
    "Status": "Active/Quit"
  },
  ...
]
```

### Assignments

#### Get All Assignments

```
GET /api/assignments
```

Retrieves a list of all assignments.

**Response:**

```json
[
  {
    "Project": "Project Name",
    "Provider": "Provider Name",
    "Qty": "50",
    "Start Date": "DD/MM/YYYY",
    "End Date": "DD/MM/YYYY"
  },
  ...
]
```

#### Create Assignment

```
POST /api/assignments
```

Creates a new assignment.

**Request Body:**

```json
{
  "Project": "Project Name",
  "Provider": "Provider Name",
  "Qty": "50",
  "Start Date": "DD/MM/YYYY",
  "End Date": "DD/MM/YYYY"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "assignment": {
    "Project": "Project Name",
    "Provider": "Provider Name",
    "Qty": "50",
    "Start Date": "DD/MM/YYYY",
    "End Date": "DD/MM/YYYY"
  }
}
```

#### Update Assignment

```
PUT /api/assignments/:id
```

Updates an existing assignment.

**Request Body:**

```json
{
  "Project": "Project Name",
  "Provider": "Provider Name",
  "Qty": "75",
  "Start Date": "DD/MM/YYYY",
  "End Date": "DD/MM/YYYY"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Assignment updated successfully",
  "assignment": {
    "Project": "Project Name",
    "Provider": "Provider Name",
    "Qty": "75",
    "Start Date": "DD/MM/YYYY",
    "End Date": "DD/MM/YYYY"
  }
}
```

#### Delete Assignment

```
DELETE /api/assignments/:id
```

Deletes an assignment.

**Response:**

```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

### Auto-Assignment Suggestions

```
GET /api/auto-assignments
```

Generates suggested assignments based on project requirements and provider availability.

**Query Parameters:**

- `projectId` (optional): Filter suggestions for a specific project

**Response:**

```json
[
  {
    "Project": "Project Name",
    "Provider": "Provider Name",
    "Qty": "50",
    "Start Date": "DD/MM/YYYY",
    "End Date": "DD/MM/YYYY",
    "Score": 0.85
  },
  ...
]
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: The request was successful
- `201 Created`: A resource was successfully created
- `400 Bad Request`: The request was malformed or invalid
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An error occurred on the server

Error responses include a JSON object with an error message:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Data Format

### Date Format

Dates in requests and responses use the format `DD/MM/YYYY` for consistency with the CSV data files.

### CSV Data Structure

The API reads data from CSV files with the following structures:

#### Projects CSV

```
Project,Previsional launch date,Previsional final date,Confidence Level,Qty,Status
```

#### Providers CSV

```
Name,Role,Start Date,End Date,No longer Available,Status
```

#### Assignments CSV

```
Project,Provider,Qty,Start Date,End Date
```

## Implementation Notes

- The API is implemented using Express.js
- Data is read from and written to CSV files
- No authentication is currently implemented
- The server performs basic validation on request data
- Error handling includes appropriate HTTP status codes and error messages
