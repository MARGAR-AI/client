# Component Documentation

This document provides detailed information about the key components in the AI Provider Assignment System.

## Table of Contents

1. [Dashboard Components](#dashboard-components)
2. [Project Components](#project-components)
3. [Provider Components](#provider-components)
4. [Assignment Components](#assignment-components)

## Dashboard Components

### Dashboard (`client/src/components/Dashboard.js`)

The main dashboard component that displays key metrics and serves as the application's homepage.

**Key Features:**
- Displays summary cards with project, provider, and assignment counts
- Shows AI Creator statistics (total, active, quit)
- Includes resource allocation information
- Integrates the CapacityProjection component

**State Management:**
- `loading`: Boolean to track data loading status
- `stats`: Object containing dashboard statistics

**Key Functions:**
- `fetchData()`: Retrieves data from the backend API endpoints

### CapacityProjection (`client/src/components/dashboard/CapacityProjection.js`)

A visualization component that shows capacity projections over time.

**Key Features:**
- Displays a chart of potential capacity, used capacity, and available capacity
- Allows adjusting the time unit (weeks, months, years) and range
- Provides capacity settings with adjustable daily capacity per provider
- Shows capacity summary statistics

**State Management:**
- `loading`: Boolean to track data loading status
- `providers`, `projects`, `assignments`: Arrays of data from the API
- `timeUnit`, `timeRange`: Settings for the time display
- `defaultCapacity`: Default daily capacity value
- `providerCapacities`: Object mapping provider names to their capacity values
- `showCapacitySettings`: Boolean to toggle settings visibility
- `projectionData`: Calculated projection data for the chart

**Key Functions:**
- `fetchData()`: Retrieves data from the backend API endpoints
- `generateProjectionData()`: Calculates projection data based on settings
- `calculatePotentialMaxCapacity()`: Calculates maximum potential capacity
- `calculateProgrammedUsedCapacity()`: Calculates scheduled capacity
- `calculatePotentiallyUsedCapacity()`: Calculates potential future capacity
- `handleTimeUnitChange()`, `handleTimeRangeChange()`: Event handlers for settings
- `handleDefaultCapacityChange()`, `handleProviderCapacityChange()`: Capacity adjustment handlers

## Project Components

### ProjectList (`client/src/components/projects/ProjectList.js`)

Displays a list of all projects with filtering and sorting options.

**Key Features:**
- Table view of all projects
- Filtering by project status
- Sorting by various columns
- Links to project detail pages

**State Management:**
- `loading`: Boolean to track data loading status
- `projects`: Array of project data
- `filteredProjects`: Array of filtered project data

**Key Functions:**
- `fetchProjects()`: Retrieves project data from the API
- `handleFilterChange()`: Updates filters and filtered projects

### ProjectDetail (`client/src/components/projects/ProjectDetail.js`)

Displays detailed information about a specific project.

**Key Features:**
- Project metadata and description
- Timeline information
- Associated assignments
- Edit functionality

**State Management:**
- `loading`: Boolean to track data loading status
- `project`: Object containing project details
- `assignments`: Array of assignments for this project

**Key Functions:**
- `fetchProjectData()`: Retrieves project and assignment data
- `handleEdit()`: Handles project editing

### ProjectGantt (`client/src/components/projects/ProjectGantt.js`)

Displays a Gantt chart visualization of project timelines.

**Key Features:**
- Visual representation of project timelines
- Color-coding by project status
- Interactive tooltips with project details

**State Management:**
- `loading`: Boolean to track data loading status
- `projects`: Array of project data
- `timeScale`: Scale for the Gantt chart

**Key Functions:**
- `fetchProjects()`: Retrieves project data from the API
- `generateGanttData()`: Transforms project data into Gantt chart format

## Provider Components

### ProviderManagement (`client/src/components/providers/ProviderManagement.js`)

Manages the list of providers and their details.

**Key Features:**
- Table view of all providers
- Filtering by provider status and role
- Sorting by various columns
- Links to provider detail pages

**State Management:**
- `loading`: Boolean to track data loading status
- `providers`: Array of provider data
- `filteredProviders`: Array of filtered provider data

**Key Functions:**
- `fetchProviders()`: Retrieves provider data from the API
- `handleFilterChange()`: Updates filters and filtered providers

### ProviderDetail (`client/src/components/providers/ProviderDetail.js`)

Displays detailed information about a specific provider.

**Key Features:**
- Provider metadata and skills
- Availability information
- Current assignments
- Capacity visualization

**State Management:**
- `loading`: Boolean to track data loading status
- `provider`: Object containing provider details
- `assignments`: Array of assignments for this provider

**Key Functions:**
- `fetchProviderData()`: Retrieves provider and assignment data
- `calculateCapacity()`: Calculates provider capacity metrics

## Assignment Components

### AssignmentList (`client/src/components/assignments/AssignmentList.js`)

Displays a list of all assignments with filtering and sorting options.

**Key Features:**
- Table view of all assignments
- Filtering by project and provider
- Sorting by various columns
- Links to assignment detail pages

**State Management:**
- `loading`: Boolean to track data loading status
- `assignments`: Array of assignment data
- `filteredAssignments`: Array of filtered assignment data
- `projects`: Array of project data for filtering
- `providers`: Array of provider data for filtering

**Key Functions:**
- `fetchData()`: Retrieves assignment, project, and provider data
- `handleFilterChange()`: Updates filters and filtered assignments

### AutoAssignments (`client/src/components/assignments/AutoAssignments.js`)

Generates and displays suggested assignments based on project requirements and provider availability.

**Key Features:**
- Automatic assignment generation
- Assignment quality scoring
- Manual adjustment options
- Bulk assignment creation

**State Management:**
- `loading`: Boolean to track data loading status
- `projects`: Array of project data
- `providers`: Array of provider data
- `suggestedAssignments`: Array of generated assignment suggestions

**Key Functions:**
- `fetchData()`: Retrieves project and provider data
- `generateSuggestedAssignments()`: Creates assignment suggestions
- `calculateAssignmentScore()`: Scores assignment quality
- `handleCreateAssignments()`: Creates selected assignments

## Common Patterns

Throughout the application, components follow these common patterns:

1. **Data Fetching**: Components fetch data in `useEffect` hooks when mounted
2. **Loading States**: Loading indicators are shown during data fetching
3. **Error Handling**: Try/catch blocks handle API errors
4. **Responsive Design**: Material-UI components ensure responsive layouts
5. **Consistent Styling**: Common styling patterns across components

## Component Dependencies

- Most components depend on Material-UI for styling and UI elements
- Chart components use Chart.js for visualization
- Date handling relies on date-fns library
- API requests use axios for HTTP communication 