import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  DialogContentText
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [assignmentQty, setAssignmentQty] = useState(10);
  const [error, setError] = useState('');
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editAllMode, setEditAllMode] = useState(false);
  const [globalQty, setGlobalQty] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openCancelAllDialog, setOpenCancelAllDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, assignmentsRes, providersRes, workloadRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/assignments'),
          axios.get('/api/availability'),
          axios.get('/api/workload')
        ]);

        const projectData = projectsRes.data.find(p => p['Project ID'] === id);
        
        if (!projectData) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        setProject(projectData);
        
        // Filter assignments for this project
        const projectAssignments = assignmentsRes.data.filter(a => a['Project ID'] === id);
        setAssignments(projectAssignments);
        
        // Filter providers who are available during the project period
        const projectStartDate = new Date(projectData['Previsional launch date']);
        const projectEndDate = new Date(projectData['Previsional final date']);
        
        const availableProviders = providersRes.data.filter(provider => {
          if (!provider['Start Date'] || !provider['End Date']) return false;
          
          const providerStartDate = new Date(provider['Start Date']);
          const providerEndDate = new Date(provider['End Date']);
          
          return (
            providerStartDate <= projectEndDate && 
            providerEndDate >= projectStartDate &&
            provider['Available In Future'] === 'TRUE' &&
            provider['No longer Available'] !== 'TRUE'
          );
        });
        
        setProviders(availableProviders);
        setWorkloadData(workloadRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project details:', error);
        setError('Failed to load project data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProvider('');
    setAssignmentQty(10);
  };

  const handleAddAssignment = async () => {
    if (!selectedProvider) {
      setError('Please select a provider');
      return;
    }

    try {
      console.log(`=== CLIENT: ADDING NEW ASSIGNMENT ===`);
      
      // Create a more reliable unique ID
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000);
      const uniqueId = `${id}-${selectedProvider.replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}`;
      
      console.log(`Generated assignment ID: "${uniqueId}"`);
      
      // Create new assignment
      const newAssignment = {
        'Assigment ID': uniqueId,
        'Provider\'s Name': selectedProvider,
        'Client': project['Client'],
        'Project ID': id,
        'Project Name': project['Project Name'],
        'Batch': project['Batch'],
        'Previsional launch date': format(new Date(project['Previsional launch date']), 'dd/MM/yyyy'),
        'Previsional delivery date': format(new Date(project['Previsional final date']), 'dd/MM/yyyy'),
        'Service': project['Service'],
        'Qty': assignmentQty,
        '% of project': ((assignmentQty / parseInt(project['Qty'])) * 100).toFixed(2)
      };

      // Use the POST endpoint to add a single assignment
      console.log(`Making POST request with new assignment:`, newAssignment);
      const response = await axios.post('/api/assignment', newAssignment);
      console.log('Server response:', response.data);
      
      if (!response.data.success) {
        throw new Error('Server indicated assignment creation was not successful');
      }
      
      // Update local state by adding the new assignment
      setAssignments([...assignments, newAssignment]);
      setSuccessMessage(`Added ${selectedProvider} with ${assignmentQty} images`);
      setTimeout(() => setSuccessMessage(''), 3000);
      handleCloseDialog();
      console.log(`=== CLIENT: ADD COMPLETE ===`);
      
    } catch (error) {
      console.error('Error adding assignment:', error);
      setError('Failed to add assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      // Get provider details from the assignment to delete
      const assignmentToDelete = assignments.find(a => String(a['Assigment ID']) === String(assignmentId));
      
      if (!assignmentToDelete) {
        setError('Cannot find the assignment to delete');
        return;
      }
      
      const providerName = assignmentToDelete['Provider\'s Name'];
      const projectId = assignmentToDelete['Project ID'];
      
      console.log(`=== CLIENT: DELETING ASSIGNMENT ===`);
      console.log(`Provider: ${providerName}`);
      console.log(`Project: ${projectId}`);
      console.log(`Assignment ID: ${assignmentId}`);
      
      // Get all assignments first
      const allAssignmentsResponse = await axios.get('/api/assignments');
      const allAssignments = allAssignmentsResponse.data;
      
      // Create composite key based on provider name + project ID
      const compositeKey = `${providerName}-${projectId}`;
      console.log(`Composite key for matching: ${compositeKey}`);
      
      // Filter out the assignment to delete
      const updatedAllAssignments = allAssignments.filter(a => {
        const currentCompositeKey = `${a['Provider\'s Name']}-${a['Project ID']}`;
        return currentCompositeKey !== compositeKey;
      });
      
      // Save all assignments back to the server
      console.log(`Saving updated assignments back to server`);
      const saveResponse = await axios.post('/api/assignments', updatedAllAssignments);
      
      if (!saveResponse.data.success) {
        throw new Error('Failed to save updated assignments');
      }
      
      // Update local state
      const updatedProjectAssignments = assignments.filter(a => 
        !(a['Provider\'s Name'] === providerName && a['Project ID'] === projectId)
      );
      
      setAssignments(updatedProjectAssignments);
      setSuccessMessage(`Assignment for ${providerName} deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      console.log(`=== CLIENT: DELETE COMPLETE ===`);
      
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const getProviderExperience = (providerName) => {
    const providerData = workloadData.find(w => 
      w.ImageCreatorUserName === providerName || 
      w.ImageCreatorUserName.includes(providerName) || 
      providerName.includes(w.ImageCreatorUserName)
    );
    
    if (!providerData) return { images: 0, edits: 0 };
    
    return {
      images: parseInt(providerData.TotalImagesDelivered) || 0,
      edits: parseFloat(providerData.AvgEdits) || 0
    };
  };

  const calculateAllocation = () => {
    // Filter assignments by both project ID and project name for this specific project
    const projectAssignments = assignments.filter(a => 
      a['Project ID'] === project['Project ID'] && 
      a['Project Name'] === project['Project Name']
    );
    
    // Parse quantities properly, handling comma-separated values like "1,890"
    const totalAssigned = projectAssignments.reduce((sum, a) => {
      // Remove commas and other non-numeric characters except decimals
      const cleanQty = String(a.Qty).replace(/[^\d.]/g, '');
      return sum + (parseInt(cleanQty) || 0);
    }, 0);
    
    // Clean the project quantity in the same way
    const projQtyStr = String(project?.Qty || '0').replace(/[^\d.]/g, '');
    const totalRequired = parseInt(projQtyStr) || 0;
    
    return {
      totalAssigned,
      totalRequired,
      percentage: totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0
    };
  };

  const handleEditAssignment = (assignment) => {
    // Explicitly convert the assignment ID to string and trim
    const assignmentId = String(assignment['Assigment ID']).trim();
    
    console.log(`Setting editing mode for assignment: ${assignmentId}`);
    console.log(`Provider: ${assignment['Provider\'s Name']}`);
    
    // Set the editing state
    setEditingAssignment(assignmentId);
    setEditQty(assignment['Qty']);
  };

  const handleCancelEdit = () => {
    setEditingAssignment(null);
    setEditQty('');
  };

  const handleSaveEdit = async (assignment) => {
    try {
      // Clear any errors and disable UI during update
      setError('');
      setLoading(true);
      
      // Validate the quantity input
      const newQty = parseInt(editQty);
      if (isNaN(newQty) || newQty <= 0) {
        setError('Please enter a valid quantity');
        setLoading(false);
        setEditQty('');
        return;
      }
      
      // Calculate the new percentage
      const projectQty = parseInt(project['Qty']) || 1;
      const newPercentage = ((newQty / projectQty) * 100).toFixed(2);
      
      console.log(`=== CLIENT: EDITING ASSIGNMENT ===`);
      console.log(`Provider: ${assignment['Provider\'s Name']}`);
      console.log(`Project: ${assignment['Project ID']}`);
      console.log(`Assignment ID: ${assignment['Assigment ID']}`);
      console.log(`Changing quantity from ${assignment['Qty']} to ${newQty}`);
      
      // Get all assignments first
      const allAssignmentsResponse = await axios.get('/api/assignments');
      const allAssignments = allAssignmentsResponse.data;
      
      // Create composite key based on provider name + project ID
      const providerName = assignment['Provider\'s Name'];
      const projectId = assignment['Project ID'];
      const compositeKey = `${providerName}-${projectId}`;
      
      console.log(`Composite key for matching: ${compositeKey}`);
      
      // Update only the matching assignment by provider+project
      const updatedAllAssignments = allAssignments.map(a => {
        // Create composite key for current assignment
        const currentCompositeKey = `${a['Provider\'s Name']}-${a['Project ID']}`;
        
        if (currentCompositeKey === compositeKey) {
          console.log(`FOUND MATCH: Updating assignment for ${a['Provider\'s Name']} in project ${a['Project ID']}`);
          return {
            ...a,
            'Qty': newQty.toString(),
            '% of project': newPercentage
          };
        }
        return a;
      });
      
      // Save all assignments back to the server
      console.log(`Saving updated assignments back to server`);
      const saveResponse = await axios.post('/api/assignments', updatedAllAssignments);
      
      if (!saveResponse.data.success) {
        throw new Error('Failed to save updated assignments');
      }
      
      // Only update the local assignments for the current project view
      const updatedProjectAssignments = assignments.map(a => {
        if (a['Provider\'s Name'] === providerName && a['Project ID'] === projectId) {
          return {
            ...a,
            'Qty': newQty.toString(),
            '% of project': newPercentage
          };
        }
        return a;
      });
      
      // Reset edit state
      setEditingAssignment(null);
      
      // Update the UI
      setAssignments(updatedProjectAssignments);
      setSuccessMessage(`Updated quantity for ${assignment['Provider\'s Name']} to ${newQty} images`);
      setTimeout(() => setSuccessMessage(''), 3000);
      console.log(`=== CLIENT: EDIT COMPLETE ===`);
      
    } catch (error) {
      console.error('Error updating assignment:', error);
      setError(`Error: ${error.message}`);
    } finally {
      // Always reset loading
      setLoading(false);
      setEditQty('');
      setEditingAssignment(null);
    }
  };

  const handleEditAllProviders = () => {
    setEditAllMode(true);
    setGlobalQty('');
  };

  const handleCancelEditAll = () => {
    setEditAllMode(false);
    setGlobalQty('');
  };

  const handleSaveEditAll = async () => {
    try {
      // Basic validation
      const newQty = parseInt(globalQty);
      if (isNaN(newQty) || newQty <= 0) {
        setError('Please enter a valid quantity');
        return;
      }
      
      // Disable UI during update
      setError('');
      setLoading(true);
      setEditAllMode(false);
      setGlobalQty('');
      
      // Calculate the new percentage
      const projectQty = parseInt(project['Qty']) || 1;
      const newPercentage = ((newQty / projectQty) * 100).toFixed(2);
      
      console.log(`=== CLIENT: EDITING ALL ASSIGNMENTS ===`);
      console.log(`Project ID: ${id}`);
      console.log(`Setting all providers to quantity: ${newQty}`);
      
      // Get all assignments first
      const allAssignmentsResponse = await axios.get('/api/assignments');
      const allAssignments = allAssignmentsResponse.data;
      
      // Update only the assignments for this project
      const updatedAllAssignments = allAssignments.map(a => {
        if (a['Project ID'] === id) {
          console.log(`Updating assignment for ${a['Provider\'s Name']} in project ${a['Project ID']}`);
          return {
            ...a,
            'Qty': newQty.toString(),
            '% of project': newPercentage
          };
        }
        return a;
      });
      
      // Save all assignments back to the server
      console.log(`Saving updated assignments back to server`);
      const saveResponse = await axios.post('/api/assignments', updatedAllAssignments);
      
      if (!saveResponse.data.success) {
        throw new Error('Failed to save updated assignments');
      }
      
      // Update all assignments in local state
      const updatedProjectAssignments = assignments.map(assignment => ({
        ...assignment,
        'Qty': newQty.toString(),
        '% of project': newPercentage
      }));
      
      // Update UI
      setAssignments(updatedProjectAssignments);
      setSuccessMessage(`Updated all providers in this project to ${newQty} images`);
      setTimeout(() => setSuccessMessage(''), 3000);
      console.log(`=== CLIENT: EDIT ALL COMPLETE ===`);
      
    } catch (error) {
      console.error('Error updating all assignments:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAllAssignments = async () => {
    try {
      setLoading(true);
      console.log(`=== CLIENT: CANCELING ALL ASSIGNMENTS FOR PROJECT ${id} ===`);
      
      // Get all assignments first
      const allAssignmentsResponse = await axios.get('/api/assignments');
      const allAssignments = allAssignmentsResponse.data;
      
      // Filter out all assignments for this project
      const updatedAllAssignments = allAssignments.filter(a => a['Project ID'] !== id);
      
      // Save all assignments back to the server
      console.log(`Saving updated assignments back to server after removing all for project ID: ${id}`);
      const saveResponse = await axios.post('/api/assignments', updatedAllAssignments);
      
      if (!saveResponse.data.success) {
        throw new Error('Failed to save updated assignments');
      }
      
      // Update local state
      setAssignments([]);
      setSuccessMessage(`All assignments for this project have been canceled`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setOpenCancelAllDialog(false);
      console.log(`=== CLIENT: CANCEL ALL ASSIGNMENTS COMPLETE ===`);
      
    } catch (error) {
      console.error('Error canceling all assignments:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelAllDialog = () => {
    setOpenCancelAllDialog(true);
  };

  const handleCloseCancelAllDialog = () => {
    setOpenCancelAllDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !project) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          component={RouterLink} 
          to="/projects"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  const allocation = calculateAllocation();

  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={RouterLink} 
          to="/projects"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="div">
          {project['Project Name']}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Project Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Project ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {project['Project ID']}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {project['Client']}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Launch Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(project['Previsional launch date'])}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Final Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(project['Previsional final date'])}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={project['Status'] || 'Unknown'} 
                    color={project['Status'] === 'En cours' ? 'primary' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {project['Service']}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Comments
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {project['Comments'] || 'No comments'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Assigned Providers
                </Typography>
                <Box>
                  {assignments.length > 0 && !editAllMode && !editingAssignment && (
                    <>
                      <Button 
                        variant="outlined" 
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={handleOpenCancelAllDialog}
                        sx={{ 
                          borderRadius: 8, 
                          textTransform: 'none',
                          mr: 2
                        }}
                      >
                        Cancel All
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<EditIcon />}
                        onClick={handleEditAllProviders}
                        sx={{ 
                          borderRadius: 8, 
                          textTransform: 'none',
                          mr: 2
                        }}
                      >
                        Edit All
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    sx={{ 
                      borderRadius: 8, 
                      textTransform: 'none',
                      boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
                    }}
                  >
                    Add Provider
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {assignments.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No providers assigned to this project yet.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    sx={{ mt: 2, borderRadius: 8, textTransform: 'none' }}
                  >
                    Assign Provider
                  </Button>
                </Box>
              ) : (
                <>
                  {editAllMode && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        Set quantity for all providers:
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={globalQty}
                        onChange={(e) => setGlobalQty(e.target.value)}
                        inputProps={{ min: 1 }}
                        sx={{ width: '100px', mr: 2 }}
                        autoFocus
                      />
                      <Tooltip title="Save">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={handleSaveEditAll}
                        >
                          <SaveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton 
                          size="small" 
                          color="default"
                          onClick={handleCancelEditAll}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                  <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Provider</TableCell>
                          <TableCell>Images</TableCell>
                          <TableCell>% of Project</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map((assignment) => {
                          // Get the assignment ID as a trimmed string
                          const assignmentId = String(assignment['Assigment ID']).trim();
                          
                          return (
                            <TableRow key={assignmentId} data-assignment-id={assignmentId}>
                              <TableCell>{assignment['Provider\'s Name']}</TableCell>
                              <TableCell>
                                {editingAssignment === assignmentId ? (
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    inputProps={{ min: 1 }}
                                    sx={{ width: '80px' }}
                                    autoFocus
                                  />
                                ) : (
                                  assignment['Qty']
                                )}
                              </TableCell>
                              <TableCell>{assignment['% of project']}%</TableCell>
                              <TableCell>
                                {editingAssignment === assignmentId ? (
                                  <>
                                    <Tooltip title="Save">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => handleSaveEdit(assignment)}
                                      >
                                        <SaveIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancel">
                                      <IconButton 
                                        size="small" 
                                        color="default"
                                        onClick={handleCancelEdit}
                                      >
                                        <CancelIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <>
                                    <Tooltip title="Edit">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => handleEditAssignment(assignment)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleDeleteAssignment(assignment['Assigment ID'])}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Resource Allocation
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Images Required
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {project['Qty']}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Images Allocated
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: allocation.percentage >= 100 ? 'success.main' : 
                           allocation.percentage >= 50 ? 'primary.main' : 'error.main'
                  }}
                >
                  {allocation.totalAssigned} ({Math.round(allocation.percentage)}%)
                </Typography>
              </Box>
              
              <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 5, height: 20, position: 'relative', mb: 2 }}>
                <Box
                  sx={{
                    width: `${Math.min(allocation.percentage, 100)}%`,
                    bgcolor: allocation.percentage >= 100 ? 'success.main' : 
                            allocation.percentage >= 50 ? 'primary.main' : 'error.main',
                    height: 20,
                    borderRadius: 5,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Assigned Providers
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {assignments.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Available Providers
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {providers.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                  No providers available for this project period.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {providers.map((provider) => {
                    const experience = getProviderExperience(provider['Name']);
                    
                    return (
                      <Box 
                        key={`${provider['Name']}-${provider['Provider\'s ID']}`}
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          borderRadius: 2, 
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                            borderColor: 'primary.light'
                          }
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {provider['Name']}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Images: {experience.images}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Edits: {experience.edits.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(provider['Start Date'])} - {formatDate(provider['End Date'])}
                          </Typography>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => {
                              setSelectedProvider(provider['Name']);
                              handleOpenDialog();
                            }}
                            sx={{ borderRadius: 8, textTransform: 'none' }}
                          >
                            Assign
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Assignment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Assign Provider to Project
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="provider-select-label">Provider</InputLabel>
            <Select
              labelId="provider-select-label"
              value={selectedProvider}
              label="Provider"
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              {providers.map((provider) => (
                <MenuItem 
                  key={`${provider['Name']}-${provider['Provider\'s ID']}`} 
                  value={provider['Name']}
                >
                  {provider['Name']}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Number of Images"
            type="number"
            fullWidth
            value={assignmentQty}
            onChange={(e) => setAssignmentQty(Math.max(1, parseInt(e.target.value) || 0))}
            InputProps={{ inputProps: { min: 1 } }}
          />
          
          {selectedProvider && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Provider Details
              </Typography>
              <Typography variant="body2">
                {selectedProvider}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Experience: {getProviderExperience(selectedProvider).images} images
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Edits: {getProviderExperience(selectedProvider).edits.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ borderRadius: 8, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddAssignment} 
            variant="contained"
            sx={{ borderRadius: 8, textTransform: 'none' }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel All Assignments Confirmation Dialog */}
      <Dialog
        open={openCancelAllDialog}
        onClose={handleCloseCancelAllDialog}
        aria-labelledby="cancel-all-dialog-title"
        aria-describedby="cancel-all-dialog-description"
      >
        <DialogTitle id="cancel-all-dialog-title" sx={{ bgcolor: 'error.main', color: 'white' }}>
          Cancel All Assignments?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-all-dialog-description" sx={{ mt: 2 }}>
            Are you sure you want to cancel all assignments for this project? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseCancelAllDialog}
            sx={{ borderRadius: 8, textTransform: 'none' }}
          >
            No, Keep Assignments
          </Button>
          <Button 
            onClick={handleCancelAllAssignments} 
            variant="contained"
            color="error"
            sx={{ borderRadius: 8, textTransform: 'none' }}
          >
            Yes, Cancel All
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectDetail; 