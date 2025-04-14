import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  ButtonGroup, 
  IconButton, 
  Slider,
  Stack,
  Menu,
  MenuItem,
  CircularProgress,
  Chip,
  Tooltip,
  Paper,
  ListItemText,
  Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import TodayIcon from '@mui/icons-material/Today';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import { format, addDays, addMonths, addWeeks, startOfMonth, endOfMonth, isBefore, isAfter, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, differenceInDays, isSameMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

const ViewButton = styled(Button)(({ theme, active }) => ({
  backgroundColor: active ? theme.palette.primary.main : 'transparent',
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.04)'
  }
}));

const GanttChart = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState(50);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [clientMenuAnchor, setClientMenuAnchor] = useState(null);
  const navigate = useNavigate();
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, assignmentsRes, providersRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/assignments'),
          axios.get('/api/providers')
        ]);
        
        setAllProjects(projectsRes.data);
        setProjects(projectsRes.data);
        setAssignments(assignmentsRes.data);
        setProviders(providersRes.data);
        
        // Get unique clients
        const uniqueClients = [...new Set(projectsRes.data.map(p => p.Client).filter(Boolean))];
        setClients(uniqueClients);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter projects when client changes
  useEffect(() => {
    if (selectedClient === 'all') {
      setProjects(allProjects);
    } else {
      setProjects(allProjects.filter(p => p.Client === selectedClient));
    }
  }, [selectedClient, allProjects]);
  
  // Timeline dates based on view
  const timelineDates = useMemo(() => {
    if (viewMode === 'day') {
      // Show 30 days
      const dates = [];
      for (let i = -15; i < 15; i++) {
        dates.push(addDays(currentDate, i));
      }
      return dates;
    } else if (viewMode === 'week') {
      // Show 12 weeks
      const dates = [];
      for (let i = -6; i < 6; i++) {
        dates.push(addWeeks(currentDate, i));
      }
      return dates;
    } else {
      // Month view - show 12 months
      const dates = [];
      for (let i = -6; i < 6; i++) {
        dates.push(addMonths(currentDate, i));
      }
      return dates;
    }
  }, [currentDate, viewMode]);
  
  // Generate time scale labels
  const timeScaleLabels = useMemo(() => {
    return timelineDates.map(date => {
      if (viewMode === 'day') return format(date, 'd');
      if (viewMode === 'week') return `Week ${format(date, 'w')}`;
      return format(date, 'MMM');
    });
  }, [timelineDates, viewMode]);
  
  // Generate month labels for day/week views
  const monthLabels = useMemo(() => {
    if (viewMode === 'month') return null;
    
    const months = {};
    timelineDates.forEach((date, index) => {
      const monthStr = format(date, 'MMM yyyy');
      if (!months[monthStr]) {
        months[monthStr] = { 
          label: monthStr,
          startIndex: index,
          endIndex: index
        };
      } else {
        months[monthStr].endIndex = index;
      }
    });
    
    return Object.values(months);
  }, [timelineDates, viewMode]);
  
  // Calculate allocation percentage
  const calculateAllocation = (project) => {
    if (!project || !project['Project ID']) return 0;
    
    const projectAssignments = assignments.filter(a => a && a['Project ID'] === project['Project ID']);
    const totalAllocated = projectAssignments.reduce((sum, a) => {
      return sum + parseInt(a['Allocated Images'] || 0, 10);
    }, 0);
    
    const qty = parseInt(project['Qty'] || 0, 10);
    if (!qty) return 0;
    
    return Math.min(100, Math.round((totalAllocated / qty) * 100));
  };
  
  // Get project color based on allocation percentage
  const getProjectColor = (allocation) => {
    if (allocation >= 100) return '#4caf50'; // Green (fully allocated)
    if (allocation >= 75) return '#8bc34a';  // Light green (mostly allocated)
    if (allocation >= 50) return '#ffc107';  // Amber (half allocated)
    if (allocation >= 25) return '#ff9800';  // Orange (partially allocated)
    return '#f44336';                        // Red (low allocation)
  };
  
  // Calculate project timeline position
  const getProjectTimeline = (project) => {
    if (!project || !project['Previsional launch date'] || !project['Previsional final date']) {
      return { left: 0, width: 0, visible: false };
    }
    
    try {
      let startDate = new Date(project['Previsional launch date']);
      let endDate = new Date(project['Previsional final date']);
      
      // Force parse dates if they're in DD/MM/YYYY format
      if (isNaN(startDate.getTime())) {
        const parts = project['Previsional launch date'].split('/');
        if (parts.length === 3) {
          startDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
      }
      
      if (isNaN(endDate.getTime())) {
        const parts = project['Previsional final date'].split('/');
        if (parts.length === 3) {
          endDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
      }
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates for project:', project['Project Name']);
        return { left: 0, width: 0, visible: false };
      }
      
      // Ensure end date is after start date
      if (endDate < startDate) {
        [startDate, endDate] = [endDate, startDate];
      }
      
      // Check if project is visible in current timeframe
      const viewStart = timelineDates[0];
      const viewEnd = timelineDates[timelineDates.length - 1];
      
      let isVisible = true;
      
      if (viewMode === 'month') {
        const viewStartMonth = startOfMonth(viewStart);
        const viewEndMonth = endOfMonth(viewEnd);
        
        isVisible = !(isBefore(endDate, viewStartMonth) || isAfter(startDate, viewEndMonth));
      } else {
        isVisible = !(isBefore(endDate, viewStart) || isAfter(startDate, viewEnd));
      }
      
      if (!isVisible) {
        return { left: 0, width: 0, visible: false };
      }
      
      // Calculate position
      const timelineWidth = 100;
      const timelineStart = timelineDates[0];
      const timelineEnd = timelineDates[timelineDates.length - 1];
      const timelineDuration = timelineEnd - timelineStart;
      
      let left = Math.max(0, (startDate - timelineStart) / timelineDuration * timelineWidth);
      let width = Math.max(0, (endDate - startDate) / timelineDuration * timelineWidth);
      
      // Clamp values
      left = Math.min(left, timelineWidth - 1);
      width = Math.min(width, timelineWidth - left);
      
      // Ensure minimum width
      if (width < 0.5) width = 0.5;
      
      return {
        left: `${left}%`,
        width: `${width}%`,
        visible: true
      };
    } catch (error) {
      console.error('Error calculating project timeline:', error);
      return { left: 0, width: 0, visible: false };
    }
  };
  
  // Get project bar height based on quantity
  const getBarHeight = (qty) => {
    const parsedQty = parseInt(qty || 0, 10);
    const minHeight = 12; // Minimum height in percentage
    const maxHeight = 70; // Maximum height in percentage
    
    // Calculate height based on quantity with a logarithmic scale for better visualization
    // This gives smaller projects more visibility while preventing large projects from dominating
    if (parsedQty <= 0) return minHeight;
    
    const height = minHeight + (Math.log10(parsedQty) * 15);
    return Math.min(Math.max(height, minHeight), maxHeight);
  };
  
  // Handle navigation
  const handleNavigation = (direction) => {
    const modifier = direction === 'next' ? 1 : -1;
    
    if (viewMode === 'day') {
      setCurrentDate(prevDate => addDays(prevDate, modifier * 7));
    } else if (viewMode === 'week') {
      setCurrentDate(prevDate => addWeeks(prevDate, modifier * 2));
    } else {
      setCurrentDate(prevDate => addMonths(prevDate, modifier * 3));
    }
  };
  
  // Update the status color function to be more distinct
  const getStatusColor = (project) => {
    const status = project['Status'] ? project['Status'].toLowerCase() : '';
    
    if (status.includes('completed')) {
      return '#4caf50'; // Green
    } else if (status.includes('progress')) {
      return '#3f51b5'; // Blue
    } else if (status.includes('not started')) {
      return '#ff9800'; // Orange
    } else {
      return '#757575'; // Gray for unknown status
    }
  };
  
  // Calculate project bar dimensions and position
  const getProjectBarStyle = (project) => {
    try {
      const startDate = new Date(project['Previsional launch date']);
      const endDate = new Date(project['Previsional final date']);
      
      // Force parse dates if they're in DD/MM/YYYY format
      let parsedStartDate = startDate;
      let parsedEndDate = endDate;
      
      if (isNaN(startDate.getTime())) {
        const parts = project['Previsional launch date'].split('/');
        if (parts.length === 3) {
          parsedStartDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
      }
      
      if (isNaN(endDate.getTime())) {
        const parts = project['Previsional final date'].split('/');
        if (parts.length === 3) {
          parsedEndDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
      }
      
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        console.error('Invalid dates for project:', project['Project Name']);
        return { display: 'none' };
      }
      
      const periods = timelineDates;
      const timelineStart = viewMode === 'day' 
        ? periods[0] 
        : viewMode === 'week'
          ? startOfWeek(periods[0])
          : startOfMonth(periods[0]);
          
      const timelineEnd = viewMode === 'day'
        ? periods[periods.length - 1]
        : viewMode === 'week'
          ? endOfWeek(periods[periods.length - 1])
          : endOfMonth(periods[periods.length - 1]);
      
      // Skip if project is completely outside the timeline
      if (parsedEndDate < timelineStart || parsedStartDate > timelineEnd) {
        return { display: 'none' };
      }
      
      // Calculate project position
      const timelineDuration = differenceInDays(timelineEnd, timelineStart) || 1;
      const projectStart = Math.max(0, differenceInDays(parsedStartDate, timelineStart));
      const projectDuration = Math.max(1, differenceInDays(
        parsedEndDate < timelineEnd ? parsedEndDate : timelineEnd,
        parsedStartDate > timelineStart ? parsedStartDate : timelineStart
      ));
      
      // Scale factors
      const leftPercent = (projectStart / timelineDuration) * 100;
      const widthPercent = (projectDuration / timelineDuration) * 100;
      
      // Adjust bar height based on project size (Qty)
      const qty = parseInt(project['Qty'] || 0, 10);
      let barHeight;
      
      if (qty <= 10) {
        barHeight = 20; // Minimum height
      } else if (qty <= 50) {
        barHeight = 30;
      } else if (qty <= 200) {
        barHeight = 40;
      } else {
        barHeight = 50; // Maximum height for large projects
      }
      
      const statusColor = getStatusColor(project);
      
      return {
        position: 'absolute',
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: `${barHeight}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'white',
        border: `2px solid ${statusColor}`,
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 2,
      };
    } catch (error) {
      console.error('Error calculating project bar:', error, project);
      return { display: 'none' };
    }
  };
  
  // Get allocation fill style
  const getAllocationFillStyle = (project) => {
    const allocation = parseFloat(project['Allocation %'] || 0);
    const statusColor = getStatusColor(project);
    
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${allocation}%`,
      backgroundColor: statusColor,
      borderRadius: '14px 0 0 14px'
    };
  };
  
  // Handle project click
  const handleProjectClick = (projectId) => {
    if (projectId) {
      navigate(`/projects/${encodeURIComponent(projectId)}`);
    }
  };
  
  // Handle client menu
  const handleClientMenuOpen = (event) => {
    setClientMenuAnchor(event.currentTarget);
  };
  
  const handleClientMenuClose = () => {
    setClientMenuAnchor(null);
  };
  
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    handleClientMenuClose();
  };
  
  // Project tooltip component
  const ProjectTooltip = ({ project }) => {
    if (!project) return null;
    
    // For debugging - ensure we're getting project data
    console.log('Tooltip project data:', project);
    
    let startDate, endDate;
    
    try {
      // Parse start date
      if (project['Previsional launch date']) {
        startDate = new Date(project['Previsional launch date']);
        if (isNaN(startDate.getTime())) {
          const parts = project['Previsional launch date'].split('/');
          if (parts.length === 3) {
            startDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
          }
        }
      }
      
      // Parse end date
      if (project['Previsional final date']) {
        endDate = new Date(project['Previsional final date']);
        if (isNaN(endDate.getTime())) {
          const parts = project['Previsional final date'].split('/');
          if (parts.length === 3) {
            endDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
          }
        }
      }
    } catch (error) {
      console.error('Error parsing dates for tooltip:', error, project);
    }
    
    const qty = parseInt(project['Qty'] || 0, 10);
    const allocation = parseFloat(project['Allocation %'] || 0);
    const done = parseInt(project['Done'] || 0, 10);
    
    return (
      <Box sx={{ 
        p: 2, 
        width: 300,
        borderRadius: 2,
        bgcolor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
          {project['Project Name'] || 'Unnamed Project'}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={project['Client'] || 'No Client'} 
            size="small" 
            sx={{ 
              mb: 1,
              bgcolor: '#e3f2fd', 
              color: '#0d47a1', 
              fontWeight: 'medium',
              mr: 1
            }} 
          />
          <Chip 
            label={project['Status'] || 'Not Set'} 
            size="small" 
            sx={{ 
              bgcolor: alpha(getStatusColor(project), 0.1),
              color: getStatusColor(project),
              fontWeight: 'medium' 
            }} 
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Start Date:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {startDate && !isNaN(startDate.getTime()) ? format(startDate, 'MMM d, yyyy') : 'Not set'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">End Date:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {endDate && !isNaN(endDate.getTime()) ? format(endDate, 'MMM d, yyyy') : 'Not set'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Duration:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime()) 
                ? `${differenceInDays(endDate, startDate) + 1} days` 
                : 'Not available'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Total Images:</Typography>
            <Typography variant="body2" fontWeight="medium">{qty || 0}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Completed:</Typography>
            <Typography variant="body2" fontWeight="medium">{done || 0} images</Typography>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Allocation:</Typography>
              <Typography variant="body2" fontWeight="bold">{allocation || 0}%</Typography>
            </Box>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: '#f0f0f0',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                height: '100%', 
                width: `${allocation || 0}%`,
                bgcolor: getStatusColor(project)
              }} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const periods = timelineDates;
  const periodLabel = viewMode === 'month' 
    ? `${format(periods[0], 'MMMM yyyy')} - ${format(periods[periods.length - 1], 'MMMM yyyy')}`
    : viewMode === 'week'
      ? `Week ${format(periods[0], 'w')} - Week ${format(periods[periods.length - 1], 'w')}`
      : `${format(periods[0], 'MMM d')} - ${format(periods[periods.length - 1], 'MMM d, yyyy')}`;

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: '#f5f7fa', 
      borderRadius: 2, 
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 2, 
        borderRadius: 4,
        bgcolor: '#e3e8f0'
      }}>
        <TodayIcon color="primary" fontSize="large" />
        <Typography variant="h4" color="primary" fontWeight="medium">
          Project Timeline
        </Typography>
      </Box>
      
      {/* Controls */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1, 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 2,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f7fa', borderRadius: 4, p: 0.5 }}>
            <IconButton size="small" onClick={() => handleNavigation('prev')}>
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            
            <Typography variant="h6" sx={{ px: 2, minWidth: 240, textAlign: 'center' }}>
              {periodLabel}
            </Typography>
            
            <IconButton size="small" onClick={() => handleNavigation('next')}>
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <ButtonGroup variant="outlined" sx={{ ml: 2 }}>
            <ViewButton 
              active={viewMode === 'day' ? 1 : 0}
              onClick={() => setViewMode('day')}
            >
              Day
            </ViewButton>
            <ViewButton 
              active={viewMode === 'week' ? 1 : 0}
              onClick={() => setViewMode('week')}
            >
              Week
            </ViewButton>
            <ViewButton 
              active={viewMode === 'month' ? 1 : 0}
              onClick={() => setViewMode('month')}
            >
              Month
            </ViewButton>
          </ButtonGroup>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            width: 180,
            bgcolor: '#f5f7fa',
            borderRadius: 8,
            px: 1
          }}>
            <IconButton size="small" onClick={() => setZoomLevel(Math.max(zoomLevel - 25, 0))}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <Slider
              value={zoomLevel}
              onChange={(e, newValue) => setZoomLevel(newValue)}
              sx={{ mx: 1 }}
              size="small"
            />
            <IconButton size="small" onClick={() => setZoomLevel(Math.min(zoomLevel + 25, 100))}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              endIcon={<ArrowForwardIosIcon fontSize="small" />}
              onClick={handleClientMenuOpen}
              sx={{ borderRadius: 6 }}
            >
              Filter by Client
            </Button>
            <Menu
              anchorEl={clientMenuAnchor}
              open={Boolean(clientMenuAnchor)}
              onClose={handleClientMenuClose}
            >
              <MenuItem onClick={() => handleClientSelect('all')}>
                <ListItemText primary="All Clients" />
              </MenuItem>
              {clients.map(client => (
                <MenuItem key={client} onClick={() => handleClientSelect(client)}>
                  <ListItemText primary={client} />
                </MenuItem>
              ))}
            </Menu>
          </Box>
          
          <IconButton sx={{ bgcolor: '#f5f7fa', p: 1 }}>
            <PeopleIcon />
          </IconButton>
        </Box>
      </Paper>
      
      {/* Gantt Chart */}
      <Paper 
        elevation={0}
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden', 
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Chart header */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '250px 1fr',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ p: 2, fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1">Project</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', overflow: 'hidden' }}>
            {viewMode === 'month' && (
              <Box sx={{ display: 'flex', width: '100%' }}>
                {periods.map((month, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      flex: 1,
                      p: 2,
                      textAlign: 'center',
                      borderRight: index < periods.length - 1 ? '1px solid #e0e0e0' : 'none',
                      fontWeight: 'medium'
                    }}
                  >
                    {format(month, 'MMM yyyy')}
                  </Box>
                ))}
              </Box>
            )}
            
            {viewMode === 'week' && (
              <Box sx={{ display: 'flex', width: '100%' }}>
                {periods.map((week, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      flex: 1,
                      borderRight: index < periods.length - 1 ? '1px solid #e0e0e0' : 'none',
                    }}
                  >
                    <Box sx={{ p: 1, textAlign: 'center', fontWeight: 'medium' }}>
                      Week {format(week, 'w')}
                    </Box>
                    <Box sx={{ display: 'flex', borderTop: '1px solid #e0e0e0' }}>
                      {eachDayOfInterval({ start: week, end: addDays(week, 7) }).map((day, dayIndex) => (
                        <Box 
                          key={dayIndex} 
                          sx={{ 
                            flex: 1,
                            p: 0.5,
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            borderRight: dayIndex < 6 ? '1px solid #f0f0f0' : 'none',
                            bgcolor: format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' 
                              ? 'rgba(0,0,0,0.03)' 
                              : 'transparent'
                          }}
                        >
                          {format(day, 'd')}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            
            {viewMode === 'day' && (
              <Box sx={{ display: 'flex', width: '100%' }}>
                {periods.map((day, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      p: 1,
                      flex: 1,
                      textAlign: 'center',
                      borderRight: index < periods.length - 1 ? '1px solid #e0e0e0' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      bgcolor: format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' 
                        ? 'rgba(0,0,0,0.03)' 
                        : 'transparent',
                      fontWeight: isSameMonth(day, currentDate) ? 'normal' : 'light'
                    }}
                  >
                    <Typography variant="caption">{format(day, 'EEE')}</Typography>
                    <Typography>{format(day, 'd')}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Projects list */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          minHeight: 400,
          position: 'relative'
        }}>
          {projects.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '250px 1fr' }}>
              {/* Project names column */}
              <Box sx={{ borderRight: '1px solid #e0e0e0' }}>
                {projects.map((project, index) => (
                  <Box
                    key={`name-${project['Project ID'] || index}`}
                    sx={{
                      p: 2,
                      height: '60px',
                      borderBottom: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }
                    }}
                    onClick={() => handleProjectClick(project['Project ID'])}
                  >
                    <Typography variant="body1" fontWeight="medium" noWrap title={project['Project Name'] || 'Unnamed Project'}>
                      {project['Project Name'] || 'Unnamed Project'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={project['Client']} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: '#e3f2fd', 
                          color: '#0d47a1'
                        }} 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
              
              {/* Timeline bars column */}
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                {projects.map((project, index) => (
                  <Box
                    key={`bar-${project['Project ID'] || index}`}
                    sx={{
                      position: 'relative',
                      height: '60px',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }
                    }}
                    onClick={() => handleProjectClick(project['Project ID'])}
                  >
                    <Tooltip
                      title={<ProjectTooltip project={project} />}
                      placement="top"
                      arrow
                      followCursor
                      enterDelay={100}
                      leaveDelay={300}
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'transparent',
                            maxWidth: 'none',
                            '& .MuiTooltip-arrow': {
                              color: 'white'
                            }
                          }
                        }
                      }}
                    >
                      <Box sx={getProjectBarStyle(project)}>
                        <Box sx={getAllocationFillStyle(project)} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            position: 'relative', 
                            zIndex: 2, 
                            fontWeight: 'medium',
                            color: 'rgba(0,0,0,0.87)',
                            px: 1,
                            textShadow: '0 0 4px rgba(255,255,255,0.8)'
                          }}
                        >
                          {project['Allocation %'] || 0}% allocated ({project['Done'] || 0}/{project['Qty'] || 0})
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No projects match your filter criteria
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default GanttChart; 