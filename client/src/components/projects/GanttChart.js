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
  Paper
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import TodayIcon from '@mui/icons-material/Today';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import axios from 'axios';
import { format, addDays, addMonths, addWeeks, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const GanttChart = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [view, setView] = useState('month'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [clientFilter, setClientFilter] = useState('All');
  const [clientMenu, setClientMenu] = useState(null);
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
        
        setProjects(projectsRes.data);
        setAssignments(assignmentsRes.data);
        setProviders(providersRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Get clients for filter
  const clients = useMemo(() => {
    const clientSet = new Set();
    projects.forEach(project => {
      if (project.Client) {
        clientSet.add(project.Client);
      }
    });
    return ['All', ...Array.from(clientSet)];
  }, [projects]);
  
  // Timeline dates based on view
  const timelineDates = useMemo(() => {
    if (view === 'day') {
      // Show 30 days
      const dates = [];
      for (let i = -15; i < 15; i++) {
        dates.push(addDays(currentDate, i));
      }
      return dates;
    } else if (view === 'week') {
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
  }, [currentDate, view]);
  
  // Generate time scale labels
  const timeScaleLabels = useMemo(() => {
    return timelineDates.map(date => {
      if (view === 'day') return format(date, 'd');
      if (view === 'week') return `Week ${format(date, 'w')}`;
      return format(date, 'MMM');
    });
  }, [timelineDates, view]);
  
  // Generate month labels for day/week views
  const monthLabels = useMemo(() => {
    if (view === 'month') return null;
    
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
  }, [timelineDates, view]);
  
  // Calculate project timeline position
  const getProjectTimeline = (project) => {
    if (!project || !project['Previsional launch date'] || !project['Previsional final date']) {
      return { left: 0, width: 0, visible: false };
    }
    
    try {
      const startDate = new Date(project['Previsional launch date']);
      const endDate = new Date(project['Previsional final date']);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { left: 0, width: 0, visible: false };
      }
      
      // Check if project is visible in current timeframe
      const viewStart = timelineDates[0];
      const viewEnd = timelineDates[timelineDates.length - 1];
      
      let isVisible = true;
      
      if (view === 'month') {
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
  
  // Get project color based on status
  const getProjectColor = (status) => {
    if (!status) return '#757575'; // Gray
    
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('completed')) return '#4caf50'; // Green
    if (lowerStatus.includes('in progress')) return '#3f51b5'; // Blue
    if (lowerStatus.includes('not started')) return '#ff9800'; // Orange
    
    return '#3f51b5'; // Default blue
  };
  
  // Filter projects
  const filteredProjects = useMemo(() => {
    if (clientFilter === 'All') return projects;
    return projects.filter(p => p.Client === clientFilter);
  }, [projects, clientFilter]);
  
  // Handle navigation
  const handleNavigate = (direction) => {
    if (view === 'day') {
      setCurrentDate(prev => direction === 'prev' ? addDays(prev, -30) : addDays(prev, 30));
    } else if (view === 'week') {
      setCurrentDate(prev => direction === 'prev' ? addWeeks(prev, -12) : addWeeks(prev, 12));
    } else {
      setCurrentDate(prev => direction === 'prev' ? addMonths(prev, -12) : addMonths(prev, 12));
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
  
  // Handle click on project to navigate to detail page
  const handleProjectClick = (projectId) => {
    if (projectId) {
      navigate(`/projects/${encodeURIComponent(projectId)}`);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(227, 232, 251, 0.5)'
      }}>
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          width: 40, 
          height: 40, 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2
        }}>
          <TodayIcon />
        </Box>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
          Project Timeline
        </Typography>
      </Box>
      
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Date and view controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Date navigator */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => handleNavigate('prev')} size="small" color="primary">
                <ChevronLeftIcon />
              </IconButton>
              
              <Typography variant="h6" sx={{ width: 150, textAlign: 'center' }}>
                {view === 'month' ? format(currentDate, 'MMMM yyyy') : 
                 view === 'week' ? `Week ${format(currentDate, 'w')} ${format(currentDate, 'yyyy')}` :
                 format(currentDate, 'dd MMM yyyy')}
              </Typography>
              
              <IconButton onClick={() => handleNavigate('next')} size="small" color="primary">
                <ChevronRightIcon />
              </IconButton>
            </Box>
            
            {/* View selector */}
            <ButtonGroup variant="outlined" size="small">
              <Button 
                variant={view === 'day' ? 'contained' : 'outlined'} 
                onClick={() => setView('day')}
                color="primary"
              >
                Day
              </Button>
              <Button 
                variant={view === 'week' ? 'contained' : 'outlined'} 
                onClick={() => setView('week')}
                color="primary"
              >
                Week
              </Button>
              <Button 
                variant={view === 'month' ? 'contained' : 'outlined'} 
                onClick={() => setView('month')}
                color="primary"
              >
                Month
              </Button>
            </ButtonGroup>
            
            {/* Go to today */}
            <IconButton color="primary" onClick={() => setCurrentDate(new Date())}>
              <TodayIcon />
            </IconButton>
          </Box>
          
          {/* Zoom and filters */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Zoom control */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 200 }}>
              <IconButton size="small" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} color="primary">
                <ZoomOutIcon />
              </IconButton>
              <Slider
                value={zoomLevel}
                min={0.5}
                max={2}
                step={0.1}
                onChange={(_, value) => setZoomLevel(value)}
                color="primary"
              />
              <IconButton size="small" onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} color="primary">
                <ZoomInIcon />
              </IconButton>
            </Stack>
            
            {/* Client filter */}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FilterAltIcon />}
              endIcon={<ExpandMoreIcon />}
              onClick={(e) => setClientMenu(e.currentTarget)}
            >
              {clientFilter === 'All' ? 'Filter by Client' : `Client: ${clientFilter}`}
            </Button>
            <Menu
              anchorEl={clientMenu}
              open={Boolean(clientMenu)}
              onClose={() => setClientMenu(null)}
            >
              {clients.map(client => (
                <MenuItem 
                  key={client} 
                  onClick={() => {
                    setClientFilter(client);
                    setClientMenu(null);
                  }}
                  selected={clientFilter === client}
                >
                  {client}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </Paper>
      
      {/* Legend */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" fontWeight="bold">Legend:</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 40, height: 8, bgcolor: 'primary.main', borderRadius: 1 }} />
            <Typography>Bar length = Project duration</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ height: 4, width: 40, bgcolor: 'primary.main', borderRadius: 1 }} />
              <Box sx={{ height: 10, width: 40, bgcolor: 'primary.main', borderRadius: 1 }} />
              <Box sx={{ height: 16, width: 40, bgcolor: 'primary.main', borderRadius: 1 }} />
            </Box>
            <Typography>Bar thickness = Project size (qty)</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              position: 'relative', 
              width: 40, 
              height: 12, 
              bgcolor: 'rgba(63, 81, 181, 0.2)',
              overflow: 'hidden',
              borderRadius: 1
            }}>
              <Box 
                sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '60%',
                  bgcolor: 'primary.main',
                  borderRadius: '4px 0 0 4px'
                }} 
              />
            </Box>
            <Typography>Filled portion = % allocated</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Gantt Chart Header */}
      <Paper 
        sx={{ 
          mb: 0, 
          borderBottomLeftRadius: 0, 
          borderBottomRightRadius: 0,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
          <Box 
            sx={{ 
              p: 1.5, 
              fontWeight: 'bold', 
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">Project List</Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <Box>
            {/* Month headers */}
            {monthLabels && (
              <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
                {monthLabels.map((month, index) => {
                  const width = ((month.endIndex - month.startIndex + 1) / timelineDates.length) * 100;
                  return (
                    <Box 
                      key={index}
                      sx={{ 
                        width: `${width}%`,
                        textAlign: 'center',
                        p: 0.5,
                        fontWeight: 'medium',
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                        borderRight: index < monthLabels.length - 1 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none'
                      }}
                    >
                      {month.label}
                    </Box>
                  );
                })}
              </Box>
            )}
            
            {/* Time scale labels */}
            <Box sx={{ display: 'flex' }}>
              {timeScaleLabels.map((label, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    flex: 1,
                    p: 1,
                    textAlign: 'center',
                    borderRight: index < timeScaleLabels.length - 1 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                    bgcolor: view === 'day' && [0, 6].includes(timelineDates[index].getDay()) ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                  }}
                >
                  <Typography variant="caption">{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Project Rows */}
      <Paper 
        sx={{ 
          maxHeight: 'calc(100vh - 350px)',
          minHeight: '600px',
          overflow: 'auto',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
      >
        <Box sx={{ 
          minWidth: 800 * zoomLevel,
          width: `${800 * zoomLevel}px`
        }}>
          {filteredProjects.map((project, index) => {
            const timeline = getProjectTimeline(project);
            const allocation = calculateAllocation(project);
            const color = getProjectColor(project['Status']);
            const qty = parseInt(project['Qty'] || 0, 10);
            
            return (
              <Box 
                key={project['Project ID'] || index}
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '300px 1fr',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  height: 80,
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' },
                }}
                onClick={() => handleProjectClick(project['Project ID'])}
              >
                {/* Project info */}
                <Box sx={{ 
                  p: 1.5, 
                  borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" fontWeight="bold">{project['Project Name']}</Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={project['Client']} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(63, 81, 181, 0.1)', 
                          color: 'primary.main',
                          height: 20,
                          fontSize: '0.7rem'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {qty} images
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Timeline bar */}
                <Box sx={{ position: 'relative', height: '100%' }}>
                  {timeline.visible ? (
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="subtitle2">{project['Project Name']}</Typography>
                          <Typography variant="body2">Client: {project['Client']}</Typography>
                          <Typography variant="body2">Start: {format(new Date(project['Previsional launch date']), 'MMM d, yyyy')}</Typography>
                          <Typography variant="body2">End: {format(new Date(project['Previsional final date']), 'MMM d, yyyy')}</Typography>
                          <Typography variant="body2">Images: {qty}</Typography>
                          <Typography variant="body2">Status: {project['Status'] || 'Not set'}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            Allocation: {allocation}% ({Math.round(allocation * qty / 100)}/{qty} images)
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          height: `${getBarHeight(qty)}%`,
                          left: timeline.left,
                          width: timeline.width,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(63, 81, 181, 0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          pl: 1,
                          pr: 1,
                          overflow: 'hidden',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${allocation}%`,
                            bgcolor: color,
                            borderRadius: '8px 0 0 8px',
                            zIndex: 0
                          }
                        }}
                      >
                        {allocation > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              zIndex: 1, 
                              fontWeight: 'bold',
                              color: allocation > 50 ? '#fff' : 'inherit',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {allocation}% ({Math.round(allocation * qty / 100)}/{qty})
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  ) : (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'text.secondary'
                      }}
                    >
                      <Typography variant="caption">Outside current view</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default GanttChart; 