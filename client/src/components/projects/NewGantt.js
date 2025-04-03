import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import axios from 'axios';

const NewGantt = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/projects');
        console.log('Projects data:', response.data);
        setProjects(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getProjectBarPosition = (startDate, endDate) => {
    try {
      // First, determine the timeline range
      const allDates = projects
        .map(p => [
          p['Previsional launch date'] ? new Date(p['Previsional launch date']) : null,
          p['Previsional final date'] ? new Date(p['Previsional final date']) : null
        ])
        .flat()
        .filter(date => date !== null && !isNaN(date.getTime()));

      if (allDates.length === 0) return { left: '0%', width: '0%' };

      const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      const latestDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      
      let start = startDate ? new Date(startDate) : null;
      let end = endDate ? new Date(endDate) : null;
      
      if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
        return { left: '0%', width: '0%' };
      }
      
      const timelineWidth = latestDate.getTime() - earliestDate.getTime();
      if (timelineWidth <= 0) return { left: '0%', width: '0%' };
      
      const startOffset = Math.max(0, start.getTime() - earliestDate.getTime());
      const barWidth = Math.max(0, end.getTime() - start.getTime());
      
      const leftPercent = (startOffset / timelineWidth) * 100;
      const widthPercent = (barWidth / timelineWidth) * 100;
      
      return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`
      };
    } catch (error) {
      console.error('Error calculating bar position:', error);
      return { left: '0%', width: '0%' };
    }
  };

  const getMonthLabels = () => {
    const allDates = projects
      .map(p => [
        p['Previsional launch date'] ? new Date(p['Previsional launch date']) : null,
        p['Previsional final date'] ? new Date(p['Previsional final date']) : null
      ])
      .flat()
      .filter(date => date !== null && !isNaN(date.getTime()));

    if (allDates.length === 0) {
      const now = new Date();
      const months = [];
      for (let i = 0; i < 12; i++) {
        const month = new Date(now.getFullYear(), i, 1);
        months.push(month);
      }
      return months;
    }

    const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    earliestDate.setMonth(earliestDate.getMonth() - 1);
    latestDate.setMonth(latestDate.getMonth() + 1);
    
    const months = [];
    const currentDate = new Date(earliestDate);
    currentDate.setDate(1);
    
    while (currentDate <= latestDate) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };

  const getStatusColor = (status) => {
    if (!status) return theme.palette.grey[500];
    
    switch (status.toLowerCase()) {
      case 'completed': return theme.palette.success.main;
      case 'in progress': return theme.palette.primary.main;
      case 'not started': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  const getTodayPosition = () => {
    const today = new Date();
    
    // Get all valid dates from projects
    const allDates = projects
      .map(p => [
        p['Previsional launch date'] ? new Date(p['Previsional launch date']) : null,
        p['Previsional final date'] ? new Date(p['Previsional final date']) : null
      ])
      .flat()
      .filter(date => date !== null && !isNaN(date.getTime()));

    if (allDates.length === 0) return null;
    
    const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Check if today is within our timeline
    if (today < earliestDate || today > latestDate) return null;
    
    const timelineWidth = latestDate.getTime() - earliestDate.getTime();
    const todayOffset = today.getTime() - earliestDate.getTime();
    
    return {
      left: `${(todayOffset / timelineWidth) * 100}%`
    };
  };

  const getBarHeight = (qty) => {
    // Set bar height based on project size (qty)
    const min = 24; // Minimum height
    const max = 50; // Maximum height
    const count = parseInt(qty, 10) || 0;
    
    return Math.min(max, Math.max(min, min + (count / 20)));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const months = getMonthLabels();
  const todayPosition = getTodayPosition();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Project Gantt Chart</Typography>
      
      <Paper elevation={3} sx={{ p: 2, overflowX: 'auto' }}>
        <Box sx={{ minWidth: 800 }}>
          {/* Timeline Header */}
          <Box sx={{ display: 'flex', mb: 2, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
            <Box sx={{ width: 300, flexShrink: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold">Project</Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex' }}>
              {months.map((month, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    flex: 1,
                    textAlign: 'center',
                    borderLeft: index > 0 ? 1 : 0,
                    borderColor: 'divider',
                    py: 1,
                    bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
                  }}
                >
                  <Typography variant="caption">
                    {month.toLocaleString('default', { month: 'short', year: '2-digit' })}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Today Marker */}
            {todayPosition && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: todayPosition.left,
                  width: '2px',
                  bgcolor: theme.palette.success.main,
                  zIndex: 2
                }}
              >
                <Tooltip title="Today">
                  <Chip
                    icon={<TodayIcon fontSize="small" />}
                    label="Today"
                    size="small"
                    color="success"
                    sx={{ 
                      position: 'absolute',
                      top: -22,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Project Rows */}
          {projects.map((project, index) => {
            const barPosition = getProjectBarPosition(
              project['Previsional launch date'],
              project['Previsional final date']
            );
            
            const barHeight = getBarHeight(project['Qty']);

            return (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex',
                  minHeight: 60,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <Box sx={{ width: 300, flexShrink: 0, p: 2 }}>
                  <Typography variant="subtitle2">
                    {project['Project Name']}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {project['Client']} • {project['Qty']} images
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, position: 'relative' }}>
                  <Tooltip title={`${project['Project Name']} (${project['Qty']} images)`}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: barPosition.left,
                        width: barPosition.width,
                        top: '50%',
                        height: barHeight,
                        transform: 'translateY(-50%)',
                        bgcolor: getStatusColor(project['Status']),
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        px: 1,
                        boxShadow: 1
                      }}
                    >
                      {project['Project Name']}
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}

          {projects.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No projects found
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default NewGantt; 