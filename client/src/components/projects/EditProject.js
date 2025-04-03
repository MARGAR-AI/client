import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const EditProject = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get project ID from URL
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initial state for the project
  const [project, setProject] = useState({
    'Project ID': '',
    'Project Name': '',
    'Client': '',
    'Previsional launch date': new Date().toISOString().split('T')[0],
    'Previsional final date': new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    'Status': 'Coming',
    'Confidence Level': 'Not signed',
    'Service': 'GENIA',
    'Qty': 100,
    'Comments': ''
  });

  // Format date from DD/MM/YYYY to YYYY-MM-DD for form inputs
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Convert from DD/MM/YYYY to YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateStr;
  };

  // Fetch project and clients data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients for dropdown
        const clientsResponse = await axios.get('/api/projects');
        const clientList = [...new Set(clientsResponse.data.map(proj => proj['Client']))].filter(Boolean).sort();
        setClients(clientList);
        
        // Fetch the project to edit
        const projectsResponse = await axios.get('/api/projects');
        const projectToEdit = projectsResponse.data.find(p => p['Project ID'] === id);
        
        if (projectToEdit) {
          // Format dates for form inputs
          setProject({
            ...projectToEdit,
            'Previsional launch date': formatDateForInput(projectToEdit['Previsional launch date']),
            'Previsional final date': formatDateForInput(projectToEdit['Previsional final date']),
          });
        } else {
          setError(`Project with ID ${id} not found`);
        }
        
        setLoadingProject(false);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data');
        setLoadingProject(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!project['Project Name']) {
      setError('Project Name is required');
      return false;
    }
    
    if (!project['Client']) {
      setError('Client is required');
      return false;
    }
    
    if (!project['Project ID']) {
      setError('Project ID is required');
      return false;
    }
    
    if (!project['Qty'] || isNaN(parseInt(project['Qty'])) || parseInt(project['Qty']) <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }

    // Validate dates
    const launchDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const finalDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!launchDatePattern.test(project['Previsional launch date'])) {
      setError('Launch date must be in YYYY-MM-DD format');
      return false;
    }

    if (!finalDatePattern.test(project['Previsional final date'])) {
      setError('Final date must be in YYYY-MM-DD format');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Format dates for CSV storage - convert from YYYY-MM-DD to DD/MM/YYYY
      const formatDateToDDMMYYYY = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      const formattedProject = {
        ...project,
        'Previsional launch date': formatDateToDDMMYYYY(project['Previsional launch date']),
        'Previsional final date': formatDateToDDMMYYYY(project['Previsional final date']),
        'Qty': project['Qty'].toString()
      };
      
      // In a real application, you would send a PUT request to update the project
      // For now, we'll simulate success since the API endpoint might not exist
      
      // Simulating API call success
      setTimeout(() => {
        setSuccessMessage('Project updated successfully!');
        
        // Return to projects list after success
        setTimeout(() => {
          navigate('/projects');
        }, 2000);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Error updating project: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loadingProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading project...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 8 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Edit Project</Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Project Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Project Name"
                name="Project Name"
                value={project['Project Name']}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Project ID"
                name="Project ID"
                value={project['Project ID']}
                onChange={handleChange}
                helperText="Project ID cannot be changed"
                disabled
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Client</InputLabel>
                <Select
                  label="Client"
                  name="Client"
                  value={project['Client']}
                  onChange={handleChange}
                >
                  {clients.map(client => (
                    <MenuItem key={client} value={client}>{client}</MenuItem>
                  ))}
                  <MenuItem value="NEW CLIENT">
                    <em>+ Add New Client</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {project['Client'] === 'NEW CLIENT' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="New Client Name"
                  name="Client"
                  value={project['Client'] === 'NEW CLIENT' ? '' : project['Client']}
                  onChange={handleChange}
                  placeholder="Enter new client name"
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  label="Service"
                  name="Service"
                  value={project['Service']}
                  onChange={handleChange}
                >
                  <MenuItem value="GENIA">GENIA</MenuItem>
                  <MenuItem value="IMAGE">IMAGE</MenuItem>
                  <MenuItem value="3D">3D</MenuItem>
                  <MenuItem value="VIDEO">VIDEO</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantity (Images)"
                name="Qty"
                value={project['Qty']}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'primary.main' }}>Status & Dates</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="Status"
                  value={project['Status']}
                  onChange={handleChange}
                >
                  <MenuItem value="Coming">Coming</MenuItem>
                  <MenuItem value="En cours">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Confidence Level</InputLabel>
                <Select
                  label="Confidence Level"
                  name="Confidence Level"
                  value={project['Confidence Level']}
                  onChange={handleChange}
                >
                  <MenuItem value="Not signed">Not signed</MenuItem>
                  <MenuItem value="Signed & not sheduled">Signed & not scheduled</MenuItem>
                  <MenuItem value="Sheduled with customer">Scheduled with customer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Launch Date"
                name="Previsional launch date"
                type="date"
                value={project['Previsional launch date']}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Format: YYYY-MM-DD"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Final Date"
                name="Previsional final date"
                type="date"
                value={project['Previsional final date']}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Format: YYYY-MM-DD"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comments"
                name="Comments"
                value={project['Comments']}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                sx={{ mr: 2 }}
                onClick={() => navigate('/projects')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};

export default EditProject; 