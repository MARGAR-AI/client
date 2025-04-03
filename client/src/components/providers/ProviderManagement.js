import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch
} from '@mui/material';
import { format, addDays } from 'date-fns';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ImageIcon from '@mui/icons-material/Image';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providersRes, assignmentsRes, workloadRes] = await Promise.all([
          axios.get('/api/providers'),
          axios.get('/api/assignments'),
          axios.get('/api/workload')
        ]);

        // Filter for AI Creators only
        const aiCreators = providersRes.data.filter(provider => 
          provider['Role'] === 'AI Creator' && 
          provider['No longer Available'] !== 'TRUE'
        );
        
        setProviders(aiCreators);
        setAssignments(assignmentsRes.data);
        setWorkloadData(workloadRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // If it's already a Date object
      if (dateString instanceof Date) {
        if (!isNaN(dateString.getTime())) {
          return format(dateString, 'dd/MM/yyyy');
        } else {
          return 'N/A';
        }
      }
      
      // Check if it's already in DD/MM/YYYY format
      if (typeof dateString === 'string') {
        // Handle DD/MM/YYYY format
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
          // Validate the date
          const [day, month, year] = dateString.split('/').map(Number);
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return dateString; // It's already in the correct format
          }
        }
        
        // Try parsing as ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return format(date, 'dd/MM/yyyy');
          }
        }
      }
      
      // Last resort - try to create a date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy');
      }
      
      // If all else fails, return as is
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'N/A';
    }
  };

  const getProviderExperience = (providerName) => {
    // Find all entries for this provider
    const providerEntries = workloadData.filter(w => 
      w.ImageCreatorUserName === providerName || 
      w.ImageCreatorUserName.includes(providerName) || 
      providerName.includes(w.ImageCreatorUserName)
    );
    
    if (providerEntries.length === 0) return { images: 0, edits: 0, clients: [] };
    
    // Get unique clients (orgCodes)
    const uniqueClients = [...new Set(providerEntries.map(entry => entry.orgCode))];
    
    // Calculate total images and average edits
    let totalImages = 0;
    let totalEdits = 0;
    
    providerEntries.forEach(entry => {
      totalImages += parseInt(entry.TotalImagesDelivered) || 0;
      totalEdits += parseFloat(entry.AvgEdits) || 0;
    });
    
    const avgEdits = providerEntries.length > 0 ? totalEdits / providerEntries.length : 0;
    
    return {
      images: totalImages,
      edits: avgEdits,
      clients: uniqueClients
    };
  };

  const getProviderAssignments = (providerName) => {
    return assignments.filter(a => 
      a['Provider\'s Name'] === providerName || 
      a['Provider\'s Name']?.includes(providerName) || 
      providerName.includes(a['Provider\'s Name'] || '')
    );
  };

  // Check if a provider is currently available
  const isProviderAvailableNow = (providerEntries) => {
    return providerEntries.some(entry => 
      entry['Available Now'] === 'TRUE' || 
      entry['Available Now'] === true ||
      entry['Available Now'] === 'Yes'
    );
  };

  // Process availability periods to handle empty dates and calculate end dates
  const processAvailabilityPeriods = (providerEntries) => {
    console.log("Processing availability periods:", providerEntries);
    return providerEntries
      .map(entry => {
        // Make a copy to avoid mutating the original
        const processedEntry = { ...entry };
        
        // Ensure duration and capacity are numeric
        if (processedEntry['Duration']) {
          processedEntry['Duration'] = Number(processedEntry['Duration']);
        }
        
        if (processedEntry['Capacity']) {
          processedEntry['Capacity'] = Number(processedEntry['Capacity']);
        }
        
        // If both start and end dates are empty, mark for filtering out
        if (!entry['Start Date'] && !entry['End Date']) {
          // Keep entries that have availability data even without dates
          if (entry['Available Now'] === 'TRUE' || entry['Available Now'] === true || 
              entry['Available In Future'] === 'TRUE' || entry['Available In Future'] === true) {
            // For available providers without dates, set default duration and capacity
            processedEntry['Duration'] = 30; // Default 30 days for available providers
            processedEntry['Capacity'] = 60; // 30 days * 2 images per day
            
            // Also create default dates for display
            const today = new Date();
            processedEntry['Start Date'] = today;
            
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            processedEntry['End Date'] = futureDate;
            
            return processedEntry;
          }
          return null;
        }
        
        // If start date exists but end date is empty, calculate end date as start date + 30 days
        if (entry['Start Date'] && !entry['End Date']) {
          try {
            let startDate;
            if (typeof entry['Start Date'] === 'string' && entry['Start Date'].includes('/')) {
              // Parse DD/MM/YYYY format
              const [day, month, year] = entry['Start Date'].split('/').map(Number);
              startDate = new Date(year, month - 1, day);
            } else {
              startDate = new Date(entry['Start Date']);
            }
            
            if (!isNaN(startDate.getTime())) {
              processedEntry['End Date'] = addDays(startDate, 30);
              // Recalculate duration and capacity
              processedEntry['Duration'] = 30;
              processedEntry['Capacity'] = 60; // 30 days * 2 images per day
            }
          } catch (error) {
            console.error('Error processing date:', error);
          }
        }
        
        // If both dates exist, calculate the duration and capacity
        if (entry['Start Date'] && entry['End Date']) {
          try {
            let startDate, endDate;
            
            // Parse start date
            if (typeof entry['Start Date'] === 'string' && entry['Start Date'].includes('/')) {
              // Parse DD/MM/YYYY format
              const [day, month, year] = entry['Start Date'].split('/').map(Number);
              startDate = new Date(year, month - 1, day);
            } else {
              startDate = new Date(entry['Start Date']);
            }
            
            // Parse end date
            if (typeof entry['End Date'] === 'string' && entry['End Date'].includes('/')) {
              // Parse DD/MM/YYYY format
              const [day, month, year] = entry['End Date'].split('/').map(Number);
              endDate = new Date(year, month - 1, day);
            } else {
              endDate = new Date(entry['End Date']);
            }
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              const diffTime = Math.abs(endDate - startDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              processedEntry['Duration'] = diffDays;
              processedEntry['Capacity'] = diffDays * 2; // 2 images per day
            }
          } catch (error) {
            console.error('Error calculating duration:', error, entry);
          }
        }
        
        return processedEntry;
      })
      .filter(entry => entry !== null); // Remove null entries (those with both dates empty)
  };

  // Group providers by name
  const groupProvidersByName = () => {
    const groupedProviders = {};
    
    providers.forEach(provider => {
      const name = provider['Name'];
      if (!name) return;
      
      if (!groupedProviders[name]) {
        groupedProviders[name] = [];
      }
      
      groupedProviders[name].push(provider);
    });
    
    return groupedProviders;
  };

  const handleAccordionChange = (providerName) => (event, isExpanded) => {
    setExpandedProvider(isExpanded ? providerName : null);
  };

  const filteredProviders = () => {
    const grouped = groupProvidersByName();
    
    let filtered = {};
    
    // Apply search term filter
    Object.keys(grouped).forEach(name => {
      if (!searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[name] = grouped[name];
      }
    });
    
    // Apply available now filter if enabled
    if (showOnlyAvailable) {
      const availableFiltered = {};
      Object.keys(filtered).forEach(name => {
        if (isProviderAvailableNow(filtered[name])) {
          availableFiltered[name] = filtered[name];
        }
      });
      filtered = availableFiltered;
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const groupedProviders = filteredProviders();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Provider Management
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search providers..."
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
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  color="primary"
                />
              }
              label="Show only available now"
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontWeight: showOnlyAvailable ? 'bold' : 'normal',
                  color: showOnlyAvailable ? 'primary.main' : 'text.primary'
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          AI Providers ({Object.keys(groupedProviders).length})
        </Typography>
        
        {Object.keys(groupedProviders).length === 0 ? (
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No providers found matching your search criteria.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          Object.keys(groupedProviders).map(providerName => {
            const providerEntries = groupedProviders[providerName];
            const experience = getProviderExperience(providerName);
            const providerAssignments = getProviderAssignments(providerName);
            const isAvailableNow = isProviderAvailableNow(providerEntries);
            
            return (
              <Accordion 
                key={providerName}
                expanded={expandedProvider === providerName}
                onChange={handleAccordionChange(providerName)}
                sx={{ 
                  mb: 2, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  '&:before': {
                    display: 'none',
                  },
                  ...(isAvailableNow && {
                    borderLeft: '4px solid',
                    borderColor: 'success.main'
                  })
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    bgcolor: expandedProvider === providerName ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      <PersonIcon />
                    </Box>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
                          {providerName}
                        </Typography>
                        {isAvailableNow && (
                          <Chip 
                            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            label="Available Now"
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(76, 175, 80, 0.1)', 
                              color: 'success.main',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip 
                          icon={<ImageIcon sx={{ fontSize: 16 }} />}
                          label={`${experience.images} Images`}
                          size="small"
                          sx={{ mr: 1, mb: 0.5, bgcolor: 'rgba(25, 118, 210, 0.1)', color: 'primary.main' }}
                        />
                        <Chip 
                          label={`Avg Edits: ${experience.edits.toFixed(2)}`}
                          size="small"
                          sx={{ mr: 1, mb: 0.5, bgcolor: 'rgba(220, 0, 78, 0.1)', color: 'secondary.main' }}
                        />
                        {experience.clients.length > 0 && (
                          <Chip 
                            icon={<BusinessIcon sx={{ fontSize: 16 }} />}
                            label={`${experience.clients.length} Client${experience.clients.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ mb: 0.5, bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'success.main' }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        {providerEntries.length} Availability Period{providerEntries.length !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {providerAssignments.length} Assignment{providerAssignments.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ p: 3 }}>
                    {experience.clients.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          Previous Clients
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {experience.clients.map((client, index) => (
                            <Chip 
                              key={index}
                              label={client}
                              size="medium"
                              sx={{ 
                                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                                color: 'success.main',
                                fontWeight: 'medium'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Availability Periods
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {processAvailabilityPeriods(providerEntries).map((entry, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card 
                            sx={{ 
                              borderRadius: 2, 
                              border: '1px solid',
                              borderColor: entry['Available Now'] === 'TRUE' ? 'success.main' : 'divider',
                              height: '100%',
                              position: 'relative',
                              ...(entry['Available Now'] === 'TRUE' && {
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
                              })
                            }}
                          >
                            {entry['Available Now'] === 'TRUE' && (
                              <Box 
                                sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  right: 0, 
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderBottomLeftRadius: 8,
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                Available Now
                              </Box>
                            )}
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle2">
                                  Period {index + 1}
                                </Typography>
                              </Box>
                              
                              <Divider sx={{ mb: 2 }} />
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Start Date
                                </Typography>
                                <Typography variant="body1">
                                  {formatDate(entry['Start Date'])}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  End Date
                                </Typography>
                                <Typography variant="body1">
                                  {formatDate(entry['End Date'])}
                                  {entry['Start Date'] && !entry['End Date'] && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      (Auto-calculated: Start + 30 days)
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Duration (Business Days)
                                </Typography>
                                <Typography variant="body1">
                                  {entry['Duration'] || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Capacity (Images)
                                </Typography>
                                <Typography variant="body1">
                                  {entry['Capacity'] || 'N/A'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Assignments
                    </Typography>
                    
                    {providerAssignments.length === 0 ? (
                      <Box sx={{ py: 2 }}>
                        <Typography variant="body1" color="text.secondary">
                          No assignments for this provider.
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Project</TableCell>
                              <TableCell>Client</TableCell>
                              <TableCell>Launch Date</TableCell>
                              <TableCell>Delivery Date</TableCell>
                              <TableCell>Images</TableCell>
                              <TableCell>% of Project</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {providerAssignments.map((assignment) => (
                              <TableRow key={assignment['Assigment ID']}>
                                <TableCell>{assignment['Project Name']}</TableCell>
                                <TableCell>{assignment['Client']}</TableCell>
                                <TableCell>{assignment['Previsional launch date']}</TableCell>
                                <TableCell>{assignment['Previsional delivery date']}</TableCell>
                                <TableCell>{assignment['Qty']}</TableCell>
                                <TableCell>{assignment['% of project']}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>
    </div>
  );
};

export default ProviderManagement; 