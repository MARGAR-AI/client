import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Autocomplete
} from '@mui/material';
import axios from 'axios';

const CreateProject = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initial state for a new project
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

  // Fetch existing clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('/api/projects');
        const clientList = [...new Set(response.data.map(proj => proj['Client']))].filter(Boolean).sort();
        setClients(clientList);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load client list');
      }
    };

    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add a special handler for the client autocomplete
  const handleClientChange = (event, newValue) => {
    setProject(prev => ({
      ...prev,
      'Client': newValue || ''
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
      
      // Send the new project to server
      const response = await axios.post('/api/projects', formattedProject);
      
      if (response.data.success) {
        setSuccessMessage('Project created successfully!');
        
        // Reset form after successful submission
        setTimeout(() => {
          navigate('/projects');
        }, 2000);
      } else {
        setError('Failed to create project: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Error creating project: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 8 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Create New Project</Typography>
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
                helperText="Use a unique identifier for this project"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                freeSolo
                value={project['Client']}
                onChange={handleClientChange}
                options={clients}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Client" 
                    required
                    placeholder="Select or type a new client name"
                  />
                )}
              />
            </Grid>
            
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
                  'Create Project'
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

export default CreateProject; 