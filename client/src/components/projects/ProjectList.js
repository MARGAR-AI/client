import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  LinearProgress,
  CircularProgress,
  Chip,
  ButtonGroup,
  Tooltip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { format, isAfter } from 'date-fns';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [selectedClient, setSelectedClient] = useState('');
  const [uniqueClients, setUniqueClients] = useState([]);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [projectToCancel, setProjectToCancel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        const [projectsRes, assignmentsRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/assignments')
        ]);
        
        console.log('Projects data:', projectsRes.data);
        
        // Sort projects by default (newest first)
        const sortedProjects = sortProjectsByDate(projectsRes.data, 'newest');
        
        // Extract unique clients for filter dropdown
        const clients = [...new Set(projectsRes.data.map(project => project['Client']))].filter(Boolean).sort();
        
        setProjects(sortedProjects);
        setFilteredProjects(sortedProjects);
        setUniqueClients(clients);
        setAssignments(assignmentsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters and sorting whenever related state changes
  useEffect(() => {
    let result = [...projects];
    
    // Apply filter for upcoming projects
    if (showUpcomingOnly) {
      const today = new Date();
      result = result.filter(project => {
        if (!project['Previsional final date']) return true;
        const finalDate = new Date(project['Previsional final date']);
        return isAfter(finalDate, today);
      });
    }
    
    // Apply client filter
    if (selectedClient) {
      result = result.filter(project => project['Client'] === selectedClient);
    }
    
    // Apply sorting
    result = sortProjectsByDate(result, sortOrder);
    
    setFilteredProjects(result);
  }, [projects, showUpcomingOnly, sortOrder, selectedClient]);

  // Function to sort projects by date
  const sortProjectsByDate = (projectsToSort, order) => {
    return [...projectsToSort].sort((a, b) => {
      let dateA, dateB;
      try {
        const [dayA, monthA, yearA] = (a['Previsional launch date'] || '').split('/');
        const [dayB, monthB, yearB] = (b['Previsional launch date'] || '').split('/');
        dateA = new Date(yearA, monthA - 1, dayA);
        dateB = new Date(yearB, monthB - 1, dayB);
      } catch (error) {
        dateA = new Date(0);
        dateB = new Date(0);
      }
      
      if (order === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const toggleUpcomingFilter = () => {
    setShowUpcomingOnly(!showUpcomingOnly);
  };

  const handleClientChange = (event) => {
    setSelectedClient(event.target.value);
  };

  const clearFilters = () => {
    setShowUpcomingOnly(false);
    setSelectedClient('');
  };

  const calculateAllocation = (projectId) => {
    // Get this specific project
    const project = projects.find(p => p['Project ID'] === projectId);
    if (!project) return { totalAssigned: 0, totalRequired: 0, percentage: 0, assignedProviders: 0 };

    // Filter assignments by both project ID and project name to ensure correct matches
    const projectAssignments = assignments.filter(a => 
      a['Project ID'] === projectId && 
      a['Project Name'] === project['Project Name']
    );
    
    // Parse quantities properly, handling comma-separated values like "1,890"
    const totalAssigned = projectAssignments.reduce((sum, a) => {
      // Remove commas and other non-numeric characters except decimals
      const cleanQty = String(a.Qty || '0').replace(/[^\d.]/g, '');
      return sum + (parseInt(cleanQty) || 0);
    }, 0);
    
    // Clean the project quantity in the same way
    const projQtyStr = String(project?.Qty || '0').replace(/[^\d.]/g, '');
    const totalRequired = parseInt(projQtyStr) || 0;
    
    return {
      totalAssigned,
      totalRequired,
      percentage: totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0,
      assignedProviders: projectAssignments.length
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Check if it's already in DD/MM/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        // It's already in the correct format, just return it
        return dateString;
      }
      
      // If it's in another format, try to parse it
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'En cours':
        return 'primary';
      case 'A venir':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = showUpcomingOnly || selectedClient;

  // Remove the getConfidenceLevel function and replace with this function to get original confidence level color
  const getConfidenceLevelColor = (confidenceLevel) => {
    if (!confidenceLevel) return 'default';
    
    const level = confidenceLevel.toLowerCase();
    if (level.includes('sheduled with customer')) {
      return 'success';
    } else if (level.includes('signed')) {
      return 'info';
    } else {
      return 'warning';
    }
  };

  // New function to handle project cancellation
  const handleCancelProject = (project) => {
    setProjectToCancel(project);
    setOpenCancelDialog(true);
  };

  // Confirm cancellation and update the project status
  const confirmCancelProject = async () => {
    if (!projectToCancel) return;
    
    try {
      // Create a copy of the project with updated status
      const updatedProject = {
        ...projectToCancel,
        'Status': 'Cancelled'
      };
      
      // Here you would typically send a PUT request to update the project
      // Since the API endpoint may not exist yet, we're just updating the local state
      
      // Update local state
      const updatedProjects = projects.map(p => 
        p['Project ID'] === projectToCancel['Project ID'] ? updatedProject : p
      );
      
      setProjects(updatedProjects);
      
      // Close the dialog
      setOpenCancelDialog(false);
      setProjectToCancel(null);
    } catch (error) {
      console.error('Error cancelling project:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 3, 
        flexWrap: 'wrap', 
        alignItems: 'center' 
      }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Projects
            {hasActiveFilters && (
              <Typography component="span" variant="subtitle1" sx={{ ml: 2, color: 'text.secondary' }}>
                {showUpcomingOnly && "(Upcoming only)"}
                {showUpcomingOnly && selectedClient && " • "}
                {selectedClient && `(Client: ${selectedClient})`}
              </Typography>
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Moved Create Project button to prominent position with green color */}
          <Button 
            variant="contained" 
            color="success"
            size="large"
            onClick={() => navigate('/projects/create')}
            startIcon={<AddIcon />}
            sx={{ 
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#388e3c'
              },
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: '24px',
              px: 3
            }}
          >
            Create New Project
          </Button>
          
          {/* Moved Export CSV button under Create Project and made it blue */}
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Export projects to CSV
              const headers = Object.keys(projects[0] || {}).join(',');
              const csv = [
                headers,
                ...projects.map(project => Object.values(project).map(value => `"${value || ''}"`).join(','))
              ].join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'projects.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            sx={{
              borderRadius: '24px',
              px: 3,
              backgroundColor: '#1976d2', 
              '&:hover': { 
                backgroundColor: '#115293' 
              }
            }}
          >
            Export to CSV
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title={showUpcomingOnly ? "Show all projects" : "Show only upcoming projects"}>
            <Button 
              onClick={toggleUpcomingFilter}
              variant={showUpcomingOnly ? "contained" : "outlined"}
              startIcon={<FilterListIcon />}
            >
              {showUpcomingOnly ? "All Dates" : "Upcoming Only"}
            </Button>
          </Tooltip>
          
          <Tooltip title={`Sort by date (${sortOrder === 'newest' ? 'newest first' : 'oldest first'})`}>
            <Button 
              onClick={toggleSortOrder}
              startIcon={sortOrder === 'newest' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
            >
              {sortOrder === 'newest' ? "Newest First" : "Oldest First"}
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="client-filter-label">Filter by Client</InputLabel>
          <Select
            labelId="client-filter-label"
            id="client-filter"
            value={selectedClient}
            onChange={handleClientChange}
            input={<OutlinedInput label="Filter by Client" />}
            startAdornment={<BusinessIcon sx={{ mr: 1, ml: -0.5, color: 'action.active' }} />}
            endAdornment={
              selectedClient ? (
                <IconButton 
                  size="small" 
                  sx={{ mr: -0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClient('');
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null
            }
          >
            {uniqueClients.map((client) => (
              <MenuItem key={client} value={client}>
                {client}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <Button 
              variant="outlined" 
              size="small" 
              color="secondary"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          </Tooltip>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>
                Client
                {uniqueClients.length > 0 && (
                  <Tooltip title="Filter by client">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        const menu = document.getElementById('client-filter');
                        if (menu) menu.click();
                      }}
                    >
                      <FilterListIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                Launch Date
                <IconButton size="small" onClick={toggleSortOrder}>
                  {sortOrder === 'newest' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                </IconButton>
              </TableCell>
              <TableCell>Final Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Confidence Level</TableCell>
              <TableCell>Images</TableCell>
              <TableCell>Allocation</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const allocation = calculateAllocation(project['Project ID']);
                const confidenceLevel = project['Confidence Level'] || 'Unknown';
                const confidenceColor = getConfidenceLevelColor(confidenceLevel);
                const isCancelled = project['Status'] === 'Cancelled';
                
                return (
                  <TableRow 
                    key={project['Project ID']}
                    sx={{ 
                      opacity: isCancelled ? 0.7 : 1,
                      backgroundColor: isCancelled ? 'rgba(0,0,0,0.03)' : 'inherit'
                    }}
                  >
                    <TableCell>{project['Project Name']}</TableCell>
                    <TableCell>
                      <Chip 
                        label={project['Client']} 
                        size="small"
                        onClick={() => setSelectedClient(project['Client'])}
                        color={selectedClient === project['Client'] ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell>{formatDate(project['Previsional launch date'])}</TableCell>
                    <TableCell>{formatDate(project['Previsional final date'])}</TableCell>
                    <TableCell>
                      <Chip 
                        label={project['Status'] || 'Unknown'} 
                        color={
                          project['Status'] === 'Cancelled' ? 'error' :
                          getStatusColor(project['Status'])
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={confidenceLevel}
                        color={confidenceColor}
                        size="small"
                        sx={{ 
                          minWidth: '80px',
                          maxWidth: '200px',
                          textAlign: 'center'
                        }}
                      />
                    </TableCell>
                    <TableCell>{project['Qty']}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(allocation.percentage, 100)} 
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              bgcolor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: allocation.percentage >= 100 ? '#4caf50' : 
                                        allocation.percentage >= 50 ? '#2196f3' : '#ff9800'
                              }
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {`${Math.round(allocation.percentage)}%`} ({allocation.totalAssigned}/{allocation.totalRequired})
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button 
                          component={RouterLink} 
                          to={`/projects/${encodeURIComponent(project['Project ID'])}`}
                          variant="contained" 
                          fullWidth
                          size="small"
                          sx={{ minWidth: '120px' }}
                        >
                          Details
                        </Button>
                        
                        {/* Place Edit and Cancel buttons side by side with only icons */}
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                          <Tooltip title="Edit Project">
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => navigate(`/projects/edit/${encodeURIComponent(project['Project ID'])}`)}
                              disabled={isCancelled}
                              sx={{ flex: 1, minWidth: '55px' }}
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          
                          <Tooltip title={isCancelled ? "Project already cancelled" : "Cancel Project"}>
                            <span>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleCancelProject(project)}
                                disabled={isCancelled}
                                sx={{ flex: 1, minWidth: '55px' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No projects match the current filters
                  </Typography>
                  {hasActiveFilters && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      sx={{ mt: 2 }}
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog for Project Cancellation */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
      >
        <DialogTitle>Cancel Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the project "{projectToCancel?.['Project Name']}"? 
            This will mark the project as cancelled and may affect resource allocations.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} color="primary">
            No, Keep Project Active
          </Button>
          <Button onClick={confirmCancelProject} color="error" variant="contained">
            Yes, Cancel Project
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectList; 