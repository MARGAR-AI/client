import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import axios from 'axios';
import { format, parseISO, parse, isValid } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SortIcon from '@mui/icons-material/Sort';

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, projectsRes] = await Promise.all([
          axios.get('/api/assignments'),
          axios.get('/api/projects')
        ]);

        // Enhance assignments with project data for missing dates
        const enhancedAssignments = assignmentsRes.data.map(assignment => {
          const project = projectsRes.data.find(p => p['Project ID'] === assignment['Project ID']);
          
          // If the assignment doesn't have dates but the project does, use the project dates
          const enhancedAssignment = { ...assignment };
          if (project) {
            if (!enhancedAssignment['Previsional launch date'] && project['Previsional launch date']) {
              enhancedAssignment['Previsional launch date'] = project['Previsional launch date'];
            }
            if (!enhancedAssignment['Previsional delivery date'] && project['Previsional final date']) {
              enhancedAssignment['Previsional delivery date'] = project['Previsional final date'];
            }
          }
          return enhancedAssignment;
        });

        setAssignments(enhancedAssignments);
        setProjects(projectsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMenuOpen = (event, assignment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      const updatedAssignments = assignments.filter(a => a['Assigment ID'] !== selectedAssignment['Assigment ID']);
      
      // Save to server
      await axios.post('/api/assignments', updatedAssignments);
      
      // Update local state
      setAssignments(updatedAssignments);
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const getUniqueClients = () => {
    const clients = new Set();
    assignments.forEach(assignment => {
      if (assignment['Client']) {
        clients.add(assignment['Client']);
      }
    });
    return Array.from(clients);
  };

  const filteredAssignments = () => {
    return assignments.filter(assignment => {
      const matchesSearch = 
        (assignment['Provider\'s Name']?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         assignment['Project Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         assignment['Project ID']?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesClient = !filterClient || assignment['Client'] === filterClient;
      
      return matchesSearch && matchesClient;
    });
  };

  const exportToCSV = () => {
    const headers = Object.keys(assignments[0] || {}).join(',');
    const csv = [
      headers,
      ...filteredAssignments().map(assignment => 
        Object.values(assignment).map(value => `"${value || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assignments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format date function to handle different date formats
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Check if it's already in DD/MM/YYYY format
      if (typeof dateString === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        // Already in the desired format, just return it
        return dateString;
      }
      
      // Try parsing as ISO date (YYYY-MM-DD)
      if (typeof dateString === 'string' && dateString.includes('-')) {
        const date = parseISO(dateString);
        if (isValid(date)) {
          return format(date, 'dd/MM/yyyy');
        }
      }
      
      // Try parsing as DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(year, month - 1, day);
        if (isValid(date)) {
          return format(date, 'dd/MM/yyyy');
        }
      }
      
      // Try as regular date object
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
    }
    
    // Return the original string if parsing fails
    return dateString || '-';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const uniqueClients = getUniqueClients();
  const filtered = filteredAssignments();

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Assignments
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<FileDownloadIcon />}
          onClick={exportToCSV}
          sx={{ 
            borderRadius: 8, 
            textTransform: 'none',
            boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
          }}
        >
          Export to CSV
        </Button>
      </Box>

      <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
        <TextField
          placeholder="Search assignments..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 8,
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }
          }}
        />
        
        <TextField
          select
          label="Filter by Client"
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterListIcon />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 8,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }
          }}
        >
          <MenuItem value="">All Clients</MenuItem>
          {uniqueClients.map(client => (
            <MenuItem key={client} value={client}>
              {client}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              All Assignments ({filtered.length})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                {filtered.length} of {assignments.length} assignments
              </Typography>
              <IconButton size="small">
                <SortIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Divider />
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Provider</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Launch Date</TableCell>
                  <TableCell>Delivery Date</TableCell>
                  <TableCell>Images</TableCell>
                  <TableCell>% of Project</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No assignments found matching your criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((assignment) => (
                    <TableRow key={assignment['Assigment ID']}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {assignment['Provider\'s Name']}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {assignment['Project Name']}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment['Project ID']}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={assignment['Client']} 
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.1)', 
                            color: 'primary.main',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(assignment['Previsional launch date'])}</TableCell>
                      <TableCell>{formatDate(assignment['Previsional delivery date'])}</TableCell>
                      <TableCell>{assignment['Qty']}</TableCell>
                      <TableCell>{assignment['% of project']}%</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuOpen(e, assignment)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
      >
        <MenuItem 
          component={RouterLink} 
          to={`/projects/${encodeURIComponent(selectedAssignment?.['Project ID'] || '')}`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Project</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteAssignment}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete Assignment</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default AssignmentList; 