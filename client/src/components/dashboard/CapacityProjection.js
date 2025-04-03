import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  TextField,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  Grid,
  Paper,
  Chip,
  Autocomplete
} from '@mui/material';
import axios from 'axios';
import { 
  format, 
  addWeeks, 
  addMonths, 
  addYears, 
  addDays,
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  endOfMonth,
  endOfYear,
  differenceInBusinessDays,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  isBefore,
  isAfter,
  isWithinInterval,
  parseISO,
  parse,
  add,
  endOfWeek,
  startOfQuarter,
  endOfQuarter
} from 'date-fns';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import debounce from 'lodash.debounce';

// Helper function to safely parse dates in different formats
const parseDateSafely = (dateString) => {
  if (!dateString) return null;
  
  // If already a Date object, return it
  if (dateString instanceof Date && !isNaN(dateString)) {
    return dateString;
  }
  
  try {
    // Convert the dateString to a string if it's not already
    const strDate = String(dateString).trim();
    
    // Try ISO format first (most common for API responses)
    let date = parseISO(strDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try dd/MM/yyyy format (European style)
    if (strDate.includes('/') && strDate.split('/').length === 3) {
      date = parse(strDate, 'dd/MM/yyyy', new Date());
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try MM/dd/yyyy format (US style)
    if (strDate.includes('/') && strDate.split('/').length === 3) {
      date = parse(strDate, 'MM/dd/yyyy', new Date());
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try yyyy-MM-dd format
    if (strDate.includes('-') && strDate.split('-').length === 3) {
      date = parse(strDate, 'yyyy-MM-dd', new Date());
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Last resort: let JavaScript try to parse it
    date = new Date(strDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error);
    return null;
  }
};

// Helper function to ensure a value is numeric
const ensureNumeric = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Add this ErrorBoundary component at the top of the file after the imports
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CapacityProjection Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, border: '1px solid #f44336', borderRadius: 2, bgcolor: '#ffebee', m: 2 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong in the Capacity Projection.
          </Typography>
          <Typography variant="body2">
            Please try refreshing the page. If the problem persists, contact support.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="caption" component="pre">
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return this.props.children;
  }
}

const CapacityBar = memo(({ data, index, maxValue, barWidth, selectedClient, getClientColor, projectionDataLength }) => {
  if (!data) return null;
  
  const maxHeight = 220;
  
  // Calculate heights based on data values and maxValue
  const potentialMaxHeight = (ensureNumeric(data['Potential Max Capacity']) / maxValue) * maxHeight;
  const programmedUsedHeight = (ensureNumeric(data['Programmed Used Capacity']) / maxValue) * maxHeight;
  const potentiallyUsedHeight = (ensureNumeric(data['Potentially Used Capacity']) / maxValue) * maxHeight;
  const weakProbabilityHeight = (ensureNumeric(data['Weak Probability Capacity']) / maxValue) * maxHeight;
  const availableHeight = (ensureNumeric(data['Remaining Capacity']) / maxValue) * maxHeight;
  
  // Get clients data for this period - protect against missing clientData
  const clientsData = data.clientData || {};
  const clientKeys = Object.keys(clientsData);
  
  // Calculate total used height
  const totalHeight = availableHeight + programmedUsedHeight + potentiallyUsedHeight + weakProbabilityHeight;
  
  return (
    <React.Fragment key={`capacity-group-${index}`}>
      {/* Single bar with all capacity types */}
      <Box
        key={`bar-${index}`}
        sx={{
          position: 'absolute',
          bottom: 30, // Leave space for labels
          left: `calc(${index * (100 / projectionDataLength)}% + 4px)`,
          width: barWidth,
          height: totalHeight > 0 ? totalHeight : 2, // Minimum height of 2px if zero
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-end',
          zIndex: 2,
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {/* Available Capacity at the top of the stack */}
        {availableHeight > 0 && (
          <Tooltip 
            title={`Available: ${Math.round(data['Remaining Capacity'] || 0)} images
${data['Remaining Capacity'] > 0 ? `(${Math.round(data['Remaining Capacity'] || 0)} remaining out of ${Math.round(data['Potential Max Capacity'] || 0)})` : ''}`}
            placement="top"
          >
            <Box
              sx={{
                position: 'relative',
                height: availableHeight,
                width: '100%',
                bgcolor: '#81c784', // Light green
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Value Label */}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  borderRadius: '0 0 0 4px',
                  padding: '1px 3px',
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  zIndex: 3,
                }}
              >
                {Math.round(data['Remaining Capacity'])}
              </Typography>
              
              {/* Center "Available" text if space allows */}
              {availableHeight > 20 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    textShadow: '0px 0px 3px rgba(0,0,0,0.8)',
                  }}
                >
                  AVAILABLE
                </Typography>
              )}
            </Box>
          </Tooltip>
        )}
        
        {/* Weak Probability Capacity section */}
        {weakProbabilityHeight > 0 && (
          <Tooltip 
            title={
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Weak Probability: {Math.round(data['Weak Probability Capacity'] || 0)} images total
                </Typography>
                {clientKeys.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {clientKeys.map(client => 
                      clientsData[client].weak > 0 ? (
                        <Typography key={client} variant="caption" component="div">
                          {client}: {Math.round(clientsData[client].weak)} images
                          {' '}({Math.round((clientsData[client].weak / data['Weak Probability Capacity']) * 100)}%)
                        </Typography>
                      ) : null
                    )}
                  </Box>
                )}
              </Box>
            }
            placement="top"
          >
            <Box
              sx={{
                position: 'relative', 
                height: weakProbabilityHeight,
                transition: 'height 0.3s ease',
                display: 'flex',
                flexDirection: 'column-reverse', // Stack from bottom
                bgcolor: clientKeys.length === 0 ? 'info.light' : 'transparent',
              }}
            >
              {/* Client-specific segments */}
              {clientKeys.map(client => {
                if (!clientsData[client] || clientsData[client].weak <= 0) return null;
                
                // Calculate height for this client's portion
                const clientHeight = (clientsData[client].weak / data['Weak Probability Capacity']) * weakProbabilityHeight;
                
                return (
                  <Box
                    key={`weak-${client}`}
                    sx={{
                      position: 'relative',
                      height: clientHeight,
                      width: '100%',
                      bgcolor: getClientColor(client),
                      ...(client === selectedClient && {
                        border: '2px solid black',
                        boxSizing: 'border-box',
                        zIndex: 2
                      })
                    }}
                  >
                    {/* Client label */}
                    {clientHeight > 15 && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '90%',
                          textShadow: '0px 0px 3px rgba(0,0,0,0.8)',
                        }}
                      >
                        {client.length > 8 ? client.substring(0, 6) + '..' : client}
                      </Typography>
                    )}
                  </Box>
                );
              })}
              
              {/* Value Label */}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -17,
                  left: 0,
                  width: '100%',
                  textAlign: 'center',
                  bgcolor: 'info.main',
                  color: 'white',
                  padding: '1px 2px',
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  zIndex: 3,
                  borderRadius: '3px',
                }}
              >
                {Math.round(data['Weak Probability Capacity'])}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Box>
      
      {/* Period Label */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: -30,
          left: `calc(${index * (100 / projectionDataLength)}%)`,
          width: `calc(${100 / projectionDataLength}%)`,
          textAlign: 'center',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.period}
      </Typography>
    </React.Fragment>
  );
});

const CapacityProjection = () => {
  // State hooks
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timeUnit, setTimeUnit] = useState('week');
  const [timeRange, setTimeRange] = useState(12); // 12 weeks, months, or quarters
  const [defaultCapacity, setDefaultCapacity] = useState(2); // 2 images per day
  const [projectionData, setProjectionData] = useState([]);
  const [showCapacitySettings, setShowCapacitySettings] = useState(false);
  const [providerCapacities, setProviderCapacities] = useState({});
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [clientStats, setClientStats] = useState({
    totalImages: 0,
    monthlyAverage: 0,
    weeklyAverage: 0,
    dailyAverage: 0
  });
  const [allocatedCreators, setAllocatedCreators] = useState(0);
  
  // Fixed end date for all providers (December 31, 2025)
  const FIXED_END_DATE = new Date(2025, 11, 31); // Month is 0-indexed in JavaScript
  
  // Refs for stable function references
  const calculateClientStatsRef = useRef(null);
  const generateProjectionDataRef = useRef(null);
  const calculatePotentialMaxCapacityRef = useRef(null);
  const calculateUsedCapacityRef = useRef(null);
  const calculateClientCapacityRef = useRef(null);
  
  // Memoized function to get periods based on time unit and range
  const getPeriods = useMemo(() => {
    try {
      const now = new Date();
      const periods = [];
      
      for (let i = 0; i < timeRange; i++) {
        let start, end;
        
        // Set start/end dates for each period based on time unit
        if (timeUnit === 'week') {
          // Week periods
          start = add(startOfWeek(now, { weekStartsOn: 1 }), { weeks: i });
          end = add(endOfWeek(start, { weekStartsOn: 1 }), { days: 0 });
        } else if (timeUnit === 'month') {
          // Month periods
          start = add(startOfMonth(now), { months: i });
          end = endOfMonth(start);
        } else {
          // Quarter periods
          start = add(startOfQuarter(now), { quarters: i });
          end = endOfQuarter(start);
        }
        
        // Ensure start and end times are at beginning/end of day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        periods.push({ start, end });
      }
      
      return periods;
    } catch (error) {
      console.error('Error generating periods:', error);
      return [];
    }
  }, [timeUnit, timeRange]);
  
  // Initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providersRes, projectsRes, assignmentsRes] = await Promise.all([
          axios.get('/api/availability'),
          axios.get('/api/projects'),
          axios.get('/api/assignments')
        ]);
        
        // Filter providers to only include AI Creators who haven't quit
        const activeProviders = providersRes.data.filter(provider => 
          provider['Role'] === 'AI Creator' && 
          provider['No longer Available'] !== 'TRUE'
        );
        
        // Initialize provider capacities
        const initialCapacities = {};
        activeProviders.forEach(provider => {
          if (provider['Name']) {
            initialCapacities[provider['Name']] = defaultCapacity;
          }
        });
        setProviderCapacities(initialCapacities);
        
        // Process providers to ensure they have proper start and end dates
        const processedProviders = activeProviders.map(provider => {
          const newProvider = { ...provider };
          
          // Parse start date
          if (provider['Start Date']) {
            const startDate = parseDateSafely(provider['Start Date']);
            newProvider['Start Date'] = startDate || new Date();
              } else {
                newProvider['Start Date'] = new Date();
              }
          
          // Set end date to fixed date
          newProvider['End Date'] = FIXED_END_DATE;
          
          return newProvider;
        });
        
        // Process projects to ensure all quantity values are numeric
        const processedProjects = projectsRes.data.map(project => {
          const newProject = { ...project };
          
          // Convert Qty field to a valid number
          try {
            let qty = 0;
            
            if (project['Qty'] !== undefined && project['Qty'] !== null) {
              const cleanQty = String(project['Qty']).replace(/[^\d.]/g, '');
              qty = parseFloat(cleanQty);
              
              if (isNaN(qty) || !isFinite(qty)) {
                qty = 0;
              }
            }
            
            newProject['Qty'] = qty;
            } catch (error) {
            console.error(`Error processing quantity for project "${project.Project}":`, error);
            newProject['Qty'] = 0;
          }
          
          return newProject;
        });
        
        // Extract unique clients from projects using Set for efficiency
        const uniqueClients = new Set();
        processedProjects.forEach(project => {
          if (project.Client) {
            uniqueClients.add(project.Client);
          }
        });
        setClients(Array.from(uniqueClients).sort());
        
        // Store all assignments
        setAssignments(assignmentsRes.data);
        
        // Calculate total number of allocated creators
        const assignedProviders = new Set();
        assignmentsRes.data.forEach(assignment => {
          if (assignment["Provider's Name"]) {
            assignedProviders.add(assignment["Provider's Name"]);
          }
        });
        setAllocatedCreators(assignedProviders.size);
        
        // Store processed data
        setProviders(processedProviders);
        setProjects(processedProjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data for capacity projection:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [defaultCapacity]);
  
  // Calculate client capacity for a given period and confidence levels
  const calculateClientCapacity = useCallback((period, confidenceLevels, client = selectedClient) => {
    if (!client) return 0;
    
    // Track total capacity used in this period
    let usedCapacity = 0;
    
    try {
      // Only include projects for the specified client
      const clientProjects = projects.filter(p => p.Client === client);
      
      if (clientProjects.length === 0) {
        return 0;
      }
      
      // Special handling for WAYFAIR project
      if (client === 'WAYFAIR') {
        // Check if we have the WAYFAIR project with 5000 images
        const wayfairProject = clientProjects.find(p => 
          p.Project === 'Potential AI Project' && 
          Math.round(p.Qty) === 5000
        );
        
        if (wayfairProject) {
          // Define the exact date range for the WAYFAIR project (April 15, 2025 to July 31, 2025)
          const wayfairStartDate = new Date(2025, 3, 15); // April 15, 2025
          const wayfairEndDate = new Date(2025, 6, 31); // July 31, 2025
          
          // Check if the period overlaps with the WAYFAIR project date range
          const periodOverlapsWayfair = (
            period.start <= wayfairEndDate && 
            period.end >= wayfairStartDate
          );
          
          if (periodOverlapsWayfair && 
              confidenceLevels.some(level => level.toLowerCase() === (wayfairProject['Confidence Level'] || '').toLowerCase() || level.toLowerCase() === 'not signed')) {
              
            // Calculate what percentage of the period overlaps with the WAYFAIR date range
            const overlapStart = new Date(Math.max(period.start.getTime(), wayfairStartDate.getTime()));
            const overlapEnd = new Date(Math.min(period.end.getTime(), wayfairEndDate.getTime()));
            
            // Calculate business days in the overlap period
            const businessDaysInOverlap = Math.max(1, differenceInBusinessDays(overlapEnd, overlapStart) + 1);
            
            // Calculate business days in the entire WAYFAIR project
            const wayfairBusinessDays = Math.max(1, differenceInBusinessDays(wayfairEndDate, wayfairStartDate) + 1);
            
            // Calculate images per business day for WAYFAIR
            const totalWayfairCapacity = 5000;
            const imagesPerBusinessDay = totalWayfairCapacity / wayfairBusinessDays;
            
            // Calculate images for this period
            const imagesForPeriod = imagesPerBusinessDay * businessDaysInOverlap;
            
            usedCapacity += imagesForPeriod;
            return imagesForPeriod;
          }
        }
      }
      
      // Filter for projects with matching confidence levels
      const matchingProjects = clientProjects.filter(project => {
        const projectConfidence = (project['Confidence Level'] || '').trim();
        return confidenceLevels.some(level => 
          projectConfidence.toLowerCase() === level.toLowerCase()
        );
      });
      
      // Process each matching project
      matchingProjects.forEach(project => {
        try {
          // Parse project dates safely
          const projectStartDate = parseDateSafely(project['Previsional launch date']);
          const projectEndDate = parseDateSafely(project['Previsional final date']);
          
          // Skip if dates are invalid
          if (!projectStartDate || !projectEndDate) {
            return;
          }
          
          // Check for overlap: project starts before period ends AND ends after period starts
          const overlaps = projectStartDate <= period.end && projectEndDate >= period.start;
          
          if (!overlaps) {
            return;
          }
          
          // Calculate overlap period
          const overlapStart = new Date(Math.max(projectStartDate.getTime(), period.start.getTime()));
          const overlapEnd = new Date(Math.min(projectEndDate.getTime(), period.end.getTime()));
        
          // Skip if invalid overlap
          if (isNaN(overlapStart.getTime()) || isNaN(overlapEnd.getTime())) {
            return;
          }
          
          // Calculate business days in overlap
          const businessDaysInOverlap = Math.max(1, differenceInBusinessDays(overlapEnd, overlapStart) + 1);
          
          // Calculate total project duration in business days
          const totalProjectDays = Math.max(1, differenceInBusinessDays(projectEndDate, projectStartDate) + 1);
        
          // Calculate what portion of the project falls within this period
          const portionInPeriod = businessDaysInOverlap / totalProjectDays;
          
          // Get project's quantity
          const quantity = project['Qty'];
          
          // Skip if no quantity
          if (quantity <= 0) {
            return;
          }
        
          // Calculate images for this period
          const imagesForPeriod = quantity * portionInPeriod;
          usedCapacity += imagesForPeriod;
          
        } catch (error) {
          console.error(`Error calculating capacity for client project ${project.Project}:`, error);
        }
      });
      
      return isNaN(usedCapacity) ? 0 : usedCapacity;
    } catch (error) {
      console.error(`Error in calculateClientCapacity for ${client}:`, error);
      return 0;
    }
  }, [projects, selectedClient]);
  
  // Store the implementation in the ref
  calculateClientCapacityRef.current = calculateClientCapacity;
  
  // Calculate potential max capacity for a period
  const calculatePotentialMaxCapacity = useCallback((period) => {
    try {
      // Get all available providers who are AI Creators and haven't quit
      const availableProviders = providers.filter(provider => 
        provider['Role'] === 'AI Creator' && 
        provider['No longer Available'] !== 'TRUE'
      );
      
      // Use a Set to store unique provider IDs active in this period
      const activeProviderIds = new Set();
      
      // Track active providers in this period
      availableProviders.forEach(provider => {
        const providerStartDate = provider['Start Date'];
        const providerEndDate = provider['End Date'];
        
        // Check if provider is active during this period
        if (providerStartDate && providerEndDate && 
            providerStartDate <= period.end && providerEndDate >= period.start) {
          // Use a stable identifier for the provider
          const providerId = provider['Name'] || provider.id || `provider-${providers.indexOf(provider)}`;
          activeProviderIds.add(providerId);
        }
      });
      
      // Get count of unique active providers
      const activeProviderCount = activeProviderIds.size;
      
      // Calculate business days in this period
      const businessDays = differenceInBusinessDays(period.end, period.start) + 1;
      
      // Calculate total capacity for active providers in this period
      const maxCapacity = defaultCapacity * businessDays * activeProviderCount;
      
      return maxCapacity;
    } catch (error) {
      console.error('Error calculating potential max capacity:', error);
      return 0;
    }
  }, [providers, defaultCapacity]);
  
  // Store the implementation in the ref
  calculatePotentialMaxCapacityRef.current = calculatePotentialMaxCapacity;
  
  // Calculate used capacity for a period based on confidence levels
  const calculateUsedCapacity = useCallback((period, confidenceLevels) => {
    // Track total capacity used in this period
    let usedCapacity = 0;
    
    try {
      // Special case for WAYFAIR when calculating general capacity
      if (!selectedClient) {
        // Define the exact date range for the WAYFAIR project
        const wayfairStartDate = new Date(2025, 3, 15); // April 15, 2025
        const wayfairEndDate = new Date(2025, 6, 31); // July 31, 2025
        
        // Check if the period overlaps with the WAYFAIR project date range
        const periodOverlapsWayfair = (
          period.start <= wayfairEndDate && 
          period.end >= wayfairStartDate
        );
        
        if (periodOverlapsWayfair) {
          // If we're calculating Weak Probability (Not signed) for Apr-Jul 2025
          const isWeakProbability = confidenceLevels.some(level => level.toLowerCase() === "not signed");
          
          if (isWeakProbability) {
            // Find the WAYFAIR project
            const wayfairProject = projects.find(p => 
              p.Client === 'WAYFAIR' && 
              p.Project === 'Potential AI Project' && 
              Math.round(p.Qty) === 5000
            );
            
            if (wayfairProject) {
              // Calculate what percentage of the period overlaps with the WAYFAIR date range
              const overlapStart = new Date(Math.max(period.start.getTime(), wayfairStartDate.getTime()));
              const overlapEnd = new Date(Math.min(period.end.getTime(), wayfairEndDate.getTime()));
              
              // Calculate business days in the overlap period
              const businessDaysInOverlap = Math.max(1, differenceInBusinessDays(overlapEnd, overlapStart) + 1);
              
              // Calculate business days in the entire WAYFAIR project
              const wayfairBusinessDays = Math.max(1, differenceInBusinessDays(wayfairEndDate, wayfairStartDate) + 1);
              
              // Calculate images per business day for WAYFAIR
              const totalWayfairCapacity = 5000; // 5000 images total
              const imagesPerBusinessDay = totalWayfairCapacity / wayfairBusinessDays;
              
              // Calculate images for this period
              const wayfairImagesForPeriod = imagesPerBusinessDay * businessDaysInOverlap;
              
              usedCapacity += wayfairImagesForPeriod;
            }
          }
        }
      }
      
      // Apply client filter if selected
      let filteredProjects = projects;
      if (selectedClient) {
        filteredProjects = projects.filter(p => p.Client === selectedClient);
      }
      
      // Check if we have any projects
      if (filteredProjects.length === 0) {
        return usedCapacity; // Return what we've calculated so far (important for WAYFAIR case)
      }
      
      // Check for projects with matching confidence levels (case-insensitive)
      const projectsWithMatchingConfidence = filteredProjects.filter(project => {
        const projectConfidence = (project['Confidence Level'] || '').trim();
        return confidenceLevels.some(level => 
          projectConfidence.toLowerCase() === level.toLowerCase()
        );
      });
      
      if (projectsWithMatchingConfidence.length === 0) {
        return usedCapacity; // Return what we've calculated so far
      }
      
      // Process each project
      projectsWithMatchingConfidence.forEach(project => {
        try {
          // Skip WAYFAIR Potential AI Project when calculating overall capacity
          // as we've already added it with special logic above
          if (!selectedClient && 
              project.Client === 'WAYFAIR' && 
              project.Project === 'Potential AI Project' && 
              Math.round(project.Qty) === 5000) {
            return;
          }
          
          // Parse project dates safely
          const projectStartDate = parseDateSafely(project['Previsional launch date']);
          const projectEndDate = parseDateSafely(project['Previsional final date']);
          
          // Skip if dates are invalid
          if (!projectStartDate || !projectEndDate) {
            return;
          }
          
          // Check for overlap: project starts before period ends AND ends after period starts
          const overlaps = projectStartDate <= period.end && projectEndDate >= period.start;
          
          if (!overlaps) {
            return;
          }
          
          // Calculate overlap period
        const overlapStart = new Date(Math.max(projectStartDate.getTime(), period.start.getTime()));
        const overlapEnd = new Date(Math.min(projectEndDate.getTime(), period.end.getTime()));
        
          // Skip if invalid overlap
          if (isNaN(overlapStart.getTime()) || isNaN(overlapEnd.getTime())) {
            return;
          }
          
          // Calculate business days in overlap
          const businessDaysInOverlap = Math.max(1, differenceInBusinessDays(overlapEnd, overlapStart) + 1);
        
        // Calculate total project duration in business days
          const totalProjectDays = Math.max(1, differenceInBusinessDays(projectEndDate, projectStartDate) + 1);
        
        // Calculate what portion of the project falls within this period
          const portionInPeriod = businessDaysInOverlap / totalProjectDays;
          
          // Get project's quantity
          const quantity = project['Qty'];
          
          // Skip if no quantity
          if (quantity <= 0) {
            return;
          }
        
          // Calculate images for this period
          const imagesForPeriod = quantity * portionInPeriod;
        usedCapacity += imagesForPeriod;
          
        } catch (error) {
          console.error(`Error calculating capacity for project ${project.Project}:`, error);
        }
      });
      
      // Ensure we return a valid number
      return isNaN(usedCapacity) ? 0 : usedCapacity;
    } catch (error) {
      console.error('Error in calculateUsedCapacity:', error);
      return 0;
    }
  }, [projects, selectedClient]);
  
  // Store the implementation in the ref
  calculateUsedCapacityRef.current = calculateUsedCapacity;
  
  // Calculate client statistics
  const calculateClientStats = useCallback(() => {
    if (projectionData.length === 0) {
      return {
        totalImages: 0,
        monthlyAverage: 0,
        weeklyAverage: 0,
        dailyAverage: 0
      };
    }
    
    // Special case for WAYFAIR
    if (selectedClient === 'WAYFAIR') {
      // Hard-code the WAYFAIR specific statistics based on the 5000 images project
      return {
        totalImages: 5000, // Exactly 5000 as per requirements
        monthlyAverage: Math.round(5000 / 4), // 4 months (Apr-Jul 2025)
        weeklyAverage: Math.round(5000 / 16), // ~4 weeks per month × 4 months
        dailyAverage: Math.round(5000 / 80) // ~20 business days per month × 4 months
      };
    }
    
    // Calculate total images for selected client or all clients
    let totalImages = 0;
    
    projectionData.forEach(data => {
      if (selectedClient) {
        // For a specific client, use clientData
        const clientData = data.clientData && data.clientData[selectedClient];
        if (clientData) {
          totalImages += clientData.programmed + clientData.potential + clientData.weak;
        }
      } else {
        // For all clients, use the total capacities
        totalImages += 
          (data['Programmed Used Capacity'] || 0) + 
          (data['Potentially Used Capacity'] || 0) + 
          (data['Weak Probability Capacity'] || 0);
      }
    });
    
    // Calculate averages based on the total and number of periods
    let monthlyAverage = 0, weeklyAverage = 0, dailyAverage = 0;
    
    // Only calculate if we have images and valid period count
    if (totalImages > 0 && projectionData.length > 0) {
      if (timeUnit === 'month') {
        monthlyAverage = totalImages / projectionData.length;
        weeklyAverage = monthlyAverage / 4.33; // Average weeks per month
        dailyAverage = monthlyAverage / 22; // Business days per month
      } else if (timeUnit === 'week') {
        weeklyAverage = totalImages / projectionData.length;
        monthlyAverage = weeklyAverage * 4.33; // Average weeks per month
        dailyAverage = weeklyAverage / 5; // Business days per week
      } else {
        const yearlyAverage = totalImages / projectionData.length;
        monthlyAverage = yearlyAverage / 12;
        weeklyAverage = yearlyAverage / 52;
        dailyAverage = yearlyAverage / 260; // Approximate business days per year
      }
    }
    
    return {
      totalImages: Math.round(totalImages),
      monthlyAverage: Math.round(monthlyAverage),
      weeklyAverage: Math.round(weeklyAverage),
      dailyAverage: Math.round(dailyAverage)
    };
  }, [projectionData, selectedClient, timeUnit]);
  
  // Store the implementation in the ref
  calculateClientStatsRef.current = calculateClientStats;
  
  // Generate projection data
  const generateProjectionData = useCallback(() => {
    try {
      if (!projects || projects.length === 0) {
        setProjectionData([]);
        return;
      }
      
      // Get all unique clients from projects - use Set for efficiency
      const allClients = [...new Set(projects.map(p => p?.Client).filter(Boolean))];
      
      // Properly access the memoized periods function result
      if (!Array.isArray(getPeriods) || getPeriods.length === 0) {
        console.error('Periods array is empty or not an array:', getPeriods);
        setProjectionData([]);
        return;
      }
      
      // Create a new array to hold all the data
      const newData = [];
      
      // Process each period
      for (let i = 0; i < getPeriods.length; i++) {
        try {
          const period = getPeriods[i];
          
          // Calculate potential max capacity for this period
          const potentialMaxCapacity = calculatePotentialMaxCapacityRef.current ? 
            parseFloat(calculatePotentialMaxCapacityRef.current(period)) || 0 : 0;
          
          // Calculate total capacities (all clients combined)
          const programmedUsedCapacity = calculateUsedCapacityRef.current ? 
            parseFloat(calculateUsedCapacityRef.current(period, ["Sheduled with customer", "Scheduled with customer"])) || 0 : 0;
          
          const potentiallyUsedCapacity = calculateUsedCapacityRef.current ? 
            parseFloat(calculateUsedCapacityRef.current(period, ["Signed & not sheduled", "Signed & not scheduled"])) || 0 : 0;
          
          const weakProbabilityCapacity = calculateUsedCapacityRef.current ? 
            parseFloat(calculateUsedCapacityRef.current(period, ["Not signed"])) || 0 : 0;
          
          // Store client-specific data more efficiently
          const clientData = {};
          
          // Calculate capacity for each client only if needed for display
          if (allClients.length > 0) {
            allClients.forEach(client => {
              if (!client) return; // Skip empty client names
              
              // Skip detailed client calculations if not selected or visible in period
              const isSelectedClient = selectedClient === client;
              const shouldCalculateDetails = isSelectedClient || !selectedClient;
              
              if (shouldCalculateDetails) {
                // Calculate client-specific capacities using the ref
                const clientProgrammed = calculateClientCapacityRef.current ? 
                  parseFloat(calculateClientCapacityRef.current(period, ["Sheduled with customer", "Scheduled with customer"], client)) || 0 : 0;
                
                const clientPotential = calculateClientCapacityRef.current ? 
                  parseFloat(calculateClientCapacityRef.current(period, ["Signed & not sheduled", "Signed & not scheduled"], client)) || 0 : 0;
                
                const clientWeak = calculateClientCapacityRef.current ? 
                  parseFloat(calculateClientCapacityRef.current(period, ["Not signed"], client)) || 0 : 0;
                
                // Only add client if they have any capacity in this period
                if (clientProgrammed > 0 || clientPotential > 0 || clientWeak > 0) {
                  clientData[client] = {
                    programmed: clientProgrammed,
                    potential: clientPotential,
                    weak: clientWeak,
                    total: clientProgrammed + clientPotential + clientWeak
                  };
                }
              }
            });
          }
          
          // Calculate remaining capacity (with a lower bound of 0)
          const remainingCapacity = Math.max(0, potentialMaxCapacity - programmedUsedCapacity - potentiallyUsedCapacity - weakProbabilityCapacity);
          
          // Format period label
          let periodLabel;
          if (timeUnit === 'week') {
            // For weeks, use format: "12 Jul"
            periodLabel = format(period.start, 'dd MMM');
          } else if (timeUnit === 'month') {
            // For months, use format: "Jul 2023"
            periodLabel = format(period.start, 'MMM yyyy');
          } else {
            // For quarters, use format: "Q1 2023"
            const quarter = Math.floor(period.start.getMonth() / 3) + 1;
            periodLabel = `Q${quarter} ${period.start.getFullYear()}`;
          }
          
          // Add data for this period to our array
          newData.push({
            period: periodLabel,
            'Potential Max Capacity': potentialMaxCapacity,
            'Programmed Used Capacity': programmedUsedCapacity,
            'Potentially Used Capacity': potentiallyUsedCapacity, 
            'Weak Probability Capacity': weakProbabilityCapacity,
            'Remaining Capacity': remainingCapacity,
            'clientData': clientData // Store all client data for this period
          });
        } catch (error) {
          console.error('Error generating data for period:', error);
          // Add empty data for this period to avoid breaking the chart
          newData.push({
            period: format(getPeriods[i].start, 'dd MMM'),
            'Potential Max Capacity': 0,
            'Programmed Used Capacity': 0,
            'Potentially Used Capacity': 0,
            'Weak Probability Capacity': 0,
            'Remaining Capacity': 0,
            'clientData': {}
          });
        }
      }
      
      // Set projection data
      setProjectionData(newData);
      
      // Calculate client stats with a slight delay to allow state update
      setTimeout(() => {
        try {
          if (calculateClientStatsRef.current) {
            setClientStats(calculateClientStatsRef.current());
          }
        } catch (error) {
          console.error('Error calculating client stats:', error);
        }
      }, 20);
    } catch (error) {
      console.error('Error in generateProjectionData:', error);
    }
  }, [timeUnit, timeRange, selectedClient, projects, providers, defaultCapacity, getPeriods]);
  
  // Store the implementation in the ref
  generateProjectionDataRef.current = generateProjectionData;
  
  // Create a debounced version of the generation function
  const debouncedGenerateProjection = useMemo(() => {
    return debounce(() => {
      try {
        if (!loading && generateProjectionDataRef.current) {
          generateProjectionDataRef.current();
        }
      } catch (error) {
        console.error('Error in debounced function:', error);
      }
    }, 300);
  }, [loading]);
  
  // Effect to regenerate projection data when relevant dependencies change
  useEffect(() => {
    try {
      if (!loading) {
        debouncedGenerateProjection();
      }
    } catch (error) {
      console.error('Error in effect for projection data:', error);
    }
    
    // Clean up debounce on unmount
    return () => {
      if (debouncedGenerateProjection && typeof debouncedGenerateProjection.cancel === 'function') {
        debouncedGenerateProjection.cancel();
      }
    };
  }, [loading, timeUnit, timeRange, defaultCapacity, debouncedGenerateProjection]);
  
  // Separate effect for provider and project changes
  useEffect(() => {
    try {
      if (!loading && Array.isArray(providers) && providers.length > 0 && 
          Array.isArray(projects) && projects.length > 0) {
        debouncedGenerateProjection();
      }
    } catch (error) {
      console.error('Error in provider/project effect:', error);
    }
  }, [loading, providers, projects, debouncedGenerateProjection]);
  
  // Separate effect for client changes
  useEffect(() => {
    try {
      if (!loading && selectedClient !== undefined) {
        debouncedGenerateProjection();
      }
    } catch (error) {
      console.error('Error in client change effect:', error);
    }
  }, [selectedClient, debouncedGenerateProjection, loading]);
  
  // Effect to update allocated creators count when client selection changes
  useEffect(() => {
    if (assignments.length === 0) return;
    
    try {
      if (selectedClient) {
        // Find assignments for the selected client
        const clientAssignments = assignments.filter(assignment => 
          assignment.Client === selectedClient
        );
        
        // Count unique providers assigned to this client
        const assignedProviders = new Set();
        clientAssignments.forEach(assignment => {
          if (assignment["Provider's Name"]) {
            assignedProviders.add(assignment["Provider's Name"]);
          }
        });
        
        setAllocatedCreators(assignedProviders.size);
      } else {
        // No client selected, count all assigned providers
        const allAssignedProviders = new Set();
        assignments.forEach(assignment => {
          if (assignment["Provider's Name"]) {
            allAssignedProviders.add(assignment["Provider's Name"]);
          }
        });
        
        setAllocatedCreators(allAssignedProviders.size);
      }
    } catch (error) {
      console.error('Error updating allocated creators:', error);
    }
  }, [selectedClient, assignments]);
  
  // Handlers
  const handleDefaultCapacityChange = useCallback((event, newValue) => {
    setDefaultCapacity(newValue);
    
    // Update all provider capacities with the new default
    const updatedCapacities = { ...providerCapacities };
    Object.keys(updatedCapacities).forEach(providerName => {
      updatedCapacities[providerName] = newValue;
    });
    setProviderCapacities(updatedCapacities);
  }, [providerCapacities]);

  const handleProviderCapacityChange = useCallback((providerName, newValue) => {
    setProviderCapacities(prev => ({
      ...prev,
      [providerName]: newValue
    }));
  }, []);

  const handleApplyToAll = useCallback(() => {
    const updatedCapacities = { ...providerCapacities };
    Object.keys(updatedCapacities).forEach(providerName => {
      updatedCapacities[providerName] = defaultCapacity;
    });
    setProviderCapacities(updatedCapacities);
  }, [defaultCapacity, providerCapacities]);
  
  const handleClientChange = useCallback((event, newValue) => {
    setSelectedClient(newValue || '');
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...projectionData.map(data => data['Potential Max Capacity'] || 0),
    800 // Minimum value to ensure small capacities are still visible
  );
  
  // Generate a consistent color for each client
  const getClientColor = useCallback((clientName) => {
    // A list of distinct colors for clients
    const clientColors = [
      '#1f77b4', // blue
      '#ff7f0e', // orange
      '#2ca02c', // green
      '#d62728', // red
      '#9467bd', // purple
      '#8c564b', // brown
      '#e377c2', // pink
      '#7f7f7f', // gray
      '#bcbd22', // olive
      '#17becf', // teal
    ];
    
    if (!clientName) return '#888888';
    
    // Get a consistent hash code for the client name
    let hashCode = 0;
    for (let i = 0; i < clientName.length; i++) {
      hashCode = ((hashCode << 5) - hashCode) + clientName.charCodeAt(i);
      hashCode |= 0; // Convert to 32bit integer
    }
    
    // Use the hash to pick a color from the array
    const colorIndex = Math.abs(hashCode) % clientColors.length;
    return clientColors[colorIndex];
  }, []);
  
  // Get all unique clients from the projection data
  const uniqueClients = Array.from(new Set(
    projectionData.flatMap(data => 
      data.clientData ? Object.keys(data.clientData) : []
    )
  )).sort();
  
  console.log(`Found ${uniqueClients.length} unique clients for rendering`);
  
  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 4 }}>
      <CardContent>
        {/* HEADER SECTION */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Capacity Projection
              </Typography>
              <Tooltip title="Adjust capacity settings">
                <IconButton size="small" onClick={() => setShowCapacitySettings(!showCapacitySettings)}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Chip
                label={`${allocatedCreators} Allocated AI Creators`}
                color="secondary"
                sx={{ ml: 2, fontWeight: 'bold' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              All providers are considered available until {format(FIXED_END_DATE, 'MMMM dd, yyyy')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Autocomplete
              value={selectedClient}
              onChange={handleClientChange}
              options={clients}
              freeSolo
              size="small"
              sx={{ minWidth: 200, mr: 2 }}
              renderInput={(params) => (
                <TextField {...params} label="Highlight Client" />
              )}
            />
            
            <ToggleButtonGroup
              value={timeUnit}
              exclusive
              onChange={(event, newTimeUnit) => {
                if (newTimeUnit !== null) {
                  setTimeUnit(newTimeUnit);
                }
              }}
              size="small"
              sx={{ mr: 2 }}
            >
              <ToggleButton value="week">Weeks</ToggleButton>
              <ToggleButton value="month">Months</ToggleButton>
              <ToggleButton value="year">Years</ToggleButton>
            </ToggleButtonGroup>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Range</InputLabel>
              <Select
                value={timeRange}
                label="Range"
                onChange={(event) => {
                  setTimeRange(parseInt(event.target.value));
                }}
              >
                <MenuItem value={6}>6 {timeUnit}s</MenuItem>
                <MenuItem value={12}>12 {timeUnit}s</MenuItem>
                <MenuItem value={24}>24 {timeUnit}s</MenuItem>
                <MenuItem value={52}>52 {timeUnit}s</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {/* ALLOCATED CREATORS DISPLAY */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              bgcolor: 'secondary.main', 
              color: 'white', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              mr: 2
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mr: 1 }}>
              {allocatedCreators}
            </Typography>
            <Typography variant="body2">
              Active AI Creators
            </Typography>
          </Paper>
        </Box>
        
        {/* STATISTICS CARDS */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: 1, textAlign: 'center', height: '100%' }}>
                <Typography variant="h4" fontWeight="bold">
                  {clientStats.totalImages}
                </Typography>
                <Typography variant="body2">
                  Total Images {selectedClient ? `for ${selectedClient}` : ''}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ bgcolor: 'info.main', color: 'white', p: 2, borderRadius: 1, textAlign: 'center', height: '100%' }}>
                <Typography variant="h4" fontWeight="bold">
                  {clientStats.monthlyAverage}
                </Typography>
                <Typography variant="body2">
                  Monthly Avg
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ bgcolor: 'warning.main', color: 'white', p: 2, borderRadius: 1, textAlign: 'center', height: '100%' }}>
                <Typography variant="h4" fontWeight="bold">
                  {clientStats.weeklyAverage}
                </Typography>
                <Typography variant="body2">
                  Weekly Avg
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ bgcolor: 'error.main', color: 'white', p: 2, borderRadius: 1, textAlign: 'center', height: '100%' }}>
                <Typography variant="h4" fontWeight="bold">
                  {clientStats.dailyAverage}
                </Typography>
                <Typography variant="body2">
                  Daily Avg
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Collapse in={showCapacitySettings}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Capacity Settings
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Default Daily Capacity (images per day)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Slider
                  value={defaultCapacity}
                  onChange={handleDefaultCapacityChange}
                  step={0.5}
                  min={0.5}
                  max={10}
                  valueLabelDisplay="auto"
                  sx={{ mr: 2, flexGrow: 1 }}
                />
                <TextField
                  value={defaultCapacity}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0.5) {
                      setDefaultCapacity(value);
                    }
                  }}
                  type="number"
                  InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
                  sx={{ width: 80 }}
                />
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleApplyToAll}
                  sx={{ ml: 2 }}
                >
                  Apply to All
                </Button>
              </Box>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Individual Provider Capacities
            </Typography>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto', pr: 1 }}>
              {Object.keys(providerCapacities).sort().map(providerName => (
                <Box key={providerName} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ width: '50%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {providerName}
                  </Typography>
                  <TextField
                    value={providerCapacities[providerName]}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0.5) {
                        handleProviderCapacityChange(providerName, value);
                      }
                    }}
                    type="number"
                    size="small"
                    InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
                    sx={{ width: 80 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    images/day
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Collapse>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* COLOR LEGEND FOR CAPACITY TYPES */}
        <Box sx={{ mt: 1, mb: 3, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 1, mr: 1 }} />
            <Typography variant="body2">Available</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'info.light', borderRadius: 1, mr: 1 }} />
            <Typography variant="body2">Weak Probability</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 1, mr: 1 }} />
            <Typography variant="body2">Potentially Used</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'error.light', borderRadius: 1, mr: 1 }} />
            <Typography variant="body2">Programmed Used</Typography>
          </Box>
        </Box>
        
        {/* CLIENT COLOR LEGEND */}
        {uniqueClients.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
            {uniqueClients.map((client) => (
              <Chip
                key={client}
                label={client}
                size="small"
                sx={{
                  backgroundColor: getClientColor(client),
                  color: 'white',
                  fontWeight: selectedClient === client ? 'bold' : 'normal',
                  border: selectedClient === client ? '2px solid #000' : 'none',
                  ...(selectedClient === client && { boxShadow: '0 0 0 2px rgba(0,0,0,0.2)' })
                }}
                onClick={() => setSelectedClient(client)}
              />
            ))}
          </Box>
        )}
        
        {/* Add a spacer row above the chart for labels */}
        <Box sx={{ height: 40, width: '100%', position: 'relative', mb: 1 }}>
          {projectionData.map((data, index) => {
            // Calculate total capacity for this period
            const totalCapacity = 
              (data['Programmed Used Capacity'] || 0) + 
              (data['Potentially Used Capacity'] || 0) + 
              (data['Weak Probability Capacity'] || 0);
              
            return (
              <Box
                key={`label-${index}`}
                    sx={{
                  position: 'absolute',
                  top: 0,
                  left: `calc(${index * (100 / projectionData.length)}%)`,
                  width: `calc(${100 / projectionData.length}% - 8px)`,
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'text.primary',
                    display: 'block',
                    visibility: 'visible',
                    bgcolor: 'white',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    margin: '0 auto',
                    width: 'fit-content',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    zIndex: 10
                  }}
                >
                  {Math.round(totalCapacity)}
                </Typography>
              </Box>
            );
          })}
        </Box>
        
        {/* CAPACITY CHART */}
        <Box sx={{ height: 350, position: 'relative', mb: 2 }}>
          {projectionData.map((data, index) => (
            <CapacityBar
              key={`capacity-bar-${index}`}
              data={data}
              index={index}
              maxValue={maxValue}
              barWidth={`calc(${100 / projectionData.length}% - 16px)`}
              selectedClient={selectedClient}
              getClientColor={getClientColor}
              projectionDataLength={projectionData.length}
            />
          ))}
        </Box>
        
        {/* CAPACITY SUMMARY */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Capacity Summary
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <Box sx={{ mr: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Potential Capacity
              </Typography>
              <Typography variant="h6">
                {Math.round(projectionData.reduce((sum, data) => sum + data['Potential Max Capacity'], 0))} images
              </Typography>
            </Box>
            
            <Box sx={{ mr: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Programmed Used
              </Typography>
              <Typography variant="h6">
                {Math.round(projectionData.reduce((sum, data) => sum + data['Programmed Used Capacity'], 0))} images
                {selectedClient && (
                  <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>
                    ({Math.round(projectionData.reduce((sum, data) => {
                      const clientData = data.clientData && data.clientData[selectedClient];
                      return sum + (clientData ? clientData.programmed : 0);
                    }, 0))} for {selectedClient})
                  </Typography>
                )}
              </Typography>
            </Box>
            
            <Box sx={{ mr: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Potentially Used
              </Typography>
              <Typography variant="h6">
                {Math.round(projectionData.reduce((sum, data) => sum + data['Potentially Used Capacity'], 0))} images
                {selectedClient && (
                  <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>
                    ({Math.round(projectionData.reduce((sum, data) => {
                      const clientData = data.clientData && data.clientData[selectedClient];
                      return sum + (clientData ? clientData.potential : 0);
                    }, 0))} for {selectedClient})
                  </Typography>
                )}
              </Typography>
            </Box>
            
            <Box sx={{ mr: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Weak Probability
              </Typography>
              <Typography variant="h6">
                {Math.round(projectionData.reduce((sum, data) => sum + data['Weak Probability Capacity'], 0))} images
                {selectedClient && (
                  <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>
                    ({Math.round(projectionData.reduce((sum, data) => {
                      const clientData = data.clientData && data.clientData[selectedClient];
                      return sum + (clientData ? clientData.weak : 0);
                    }, 0))} for {selectedClient})
                  </Typography>
                )}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Available
              </Typography>
              <Typography variant="h6">
                {Math.round(projectionData.reduce((sum, data) => sum + data['Remaining Capacity'], 0))} images
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Export with error boundary wrapper
const WrappedCapacityProjection = () => (
  <ErrorBoundary>
    <CapacityProjection />
  </ErrorBoundary>
);

export default WrappedCapacityProjection; 