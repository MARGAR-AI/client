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
  Checkbox,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import { format, isWithinInterval, differenceInBusinessDays, addBusinessDays, subBusinessDays } from 'date-fns';

const AutoAssignments = () => {
  const [projects, setProjects] = useState([]);
  const [providers, setProviders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestedAssignments, setSuggestedAssignments] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Capacity configuration
  const [defaultCapacity, setDefaultCapacity] = useState(2);
  const [setupBuffer, setSetupBuffer] = useState(10);
  const [targetCapacityPercent, setTargetCapacityPercent] = useState(90);
  const [minAssignmentSize, setMinAssignmentSize] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [providerCapacities, setProviderCapacities] = useState({});
  const [providerSearch, setProviderSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, providersRes, assignmentsRes, workloadRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/availability'),
          axios.get('/api/assignments'),
          axios.get('/api/workload')
        ]);

        setProjects(projectsRes.data);
        
        // Filter out providers with empty names
        const emptyNameProviders = providersRes.data.filter(provider => 
          !provider['Name'] || provider['Name'].trim() === ''
        );
        
        if (emptyNameProviders.length > 0) {
          console.log(`Filtered out ${emptyNameProviders.length} providers with empty names`);
        }
        
        const validProviders = providersRes.data.filter(provider => 
          provider['Name'] && provider['Name'].trim() !== ''
        );
        setProviders(validProviders);
        
        setAssignments(assignmentsRes.data);
        setWorkloadData(workloadRes.data);
        
        // Initialize provider capacities
        const initialCapacities = {};
        
        // Hard-coded list of providers with capacity = 1 (from CSV)
        const capacityOneProviders = [
          "Muhammad Moeez Ahmed",
          "Andrian Melin",
          "Qurban hussain",
          "Shah Danish",
          "Muthu T",
          "Fabio da Silva Teles",
          "Olenchenko Leonid",
          "Maru Bisrat Teshome",
          "Abu Hanif",
          "Andrea Castro",
          "Mounir Ghazi",
          "Rajesh Iyyanar",
          "Mondol Joy",
          "Elnagar Hamdy Elsaid Hassan",
          "Abu Hanif",
          "Mondol Joy"
        ];
        
        validProviders.forEach(provider => {
          if (provider['Name']) {
            // Check if this provider is in the capacity = 1 list
            if (capacityOneProviders.includes(provider['Name'])) {
              initialCapacities[provider['Name']] = 1;
              console.log(`Set capacity=1 for ${provider['Name']}`);
            } else {
              initialCapacities[provider['Name']] = 2;
            }
          }
        });
        
        setProviderCapacities(initialCapacities);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data for auto assignments:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [defaultCapacity]);

  useEffect(() => {
    if (!loading) {
      generateSuggestedAssignments();
    }
  }, [loading, defaultCapacity, setupBuffer, targetCapacityPercent, minAssignmentSize, providerCapacities]);

  // Helper function to clean numeric values from CSV, handling various formats
  const parseQuantity = (value) => {
    if (!value) return 0;
    
    // Convert value to string if it's not already
    const strValue = String(value);
    
    // Remove commas, spaces, and other non-numeric characters except decimal points
    const cleanValue = strValue.replace(/[^\d.]/g, '');
    
    return parseInt(cleanValue) || 0;
  };

  const generateSuggestedAssignments = () => {
    const suggestions = [];
    const existingAssignmentMap = {};
    // Track suggested assignments within the current batch
    const suggestedInCurrentBatch = {};
    // Track running total of suggested capacity for each provider
    const providerSuggestedCapacity = {};
    // Track running total of suggested allocations for each project
    const projectSuggestedAllocation = {};
    
    console.log(`Generating suggestions with ${providers.length} providers and ${projects.length} projects`);
    console.log(`Using target capacity: ${targetCapacityPercent}% and minimum assignment size: ${minAssignmentSize}`);
    
    // Create a map of existing assignments
    assignments.forEach(assignment => {
      const key = `${assignment['Provider\'s Name']}-${assignment['Project ID']}-${assignment['Project Name']}`;
      existingAssignmentMap[key] = true;
    });

    // Pre-calculate total allocations for each project to avoid over-allocation
    const projectTotalAllocations = {};
    projects.forEach(project => {
      const projectId = project['Project ID'];
      const projectName = project['Project Name'];
      const compositeKey = `${projectId}-${projectName}`;
      
      // Filter assignments for this specific project (both ID and name must match)
      const projectAssignments = assignments.filter(a => 
        a['Project ID'] === projectId && a['Project Name'] === projectName
      );
      
      const totalAssigned = projectAssignments.reduce((sum, a) => sum + parseQuantity(a['Qty']), 0);
      const totalRequired = parseQuantity(project['Qty']);
      
      projectTotalAllocations[compositeKey] = {
        totalRequired,
        totalAssigned,
        remainingNeeded: Math.max(0, totalRequired - totalAssigned)
      };
    });
    
    // Log project allocations for debugging
    console.log('Project total allocations:', projectTotalAllocations);
    
    // Filter for active projects that need resources
    const activeProjects = projects.filter(project => {
      const projectStartDate = new Date(project['Previsional launch date']);
      const projectEndDate = new Date(project['Previsional final date']);
      const now = new Date();
      
      // Check if project is current or upcoming
      if (projectEndDate < now) return false;
      
      const projectId = project['Project ID'];
      const projectName = project['Project Name'];
      const compositeKey = `${projectId}-${projectName}`;
      
      // Only include projects that need more resources
      return projectTotalAllocations[compositeKey] && 
             projectTotalAllocations[compositeKey].remainingNeeded > 0;
    });
    
    // Sort projects by launch date (prioritize imminent projects)
    activeProjects.sort((a, b) => {
      const dateA = new Date(a['Previsional launch date']);
      const dateB = new Date(b['Previsional launch date']);
      return dateA - dateB;
    });
    
    // For each project, find suitable providers
    activeProjects.forEach(project => {
      const projectId = project['Project ID'];
      const projectName = project['Project Name'];
      const compositeKey = `${projectId}-${projectName}`;
      
      const projectStartDate = new Date(project['Previsional launch date']);
      const projectEndDate = new Date(project['Previsional final date']);
      
      // Calculate business days between start and end dates
      const totalBusinessDays = differenceInBusinessDays(projectEndDate, projectStartDate) + 1;
      
      // Apply buffer to reduce available days (for setup and delivery security)
      const effectiveBusinessDays = Math.floor(totalBusinessDays * (1 - (setupBuffer / 100)));
      
      // Get the pre-calculated remaining images needed
      const { totalRequired, totalAssigned, remainingNeeded } = projectTotalAllocations[compositeKey];
      
      if (remainingNeeded <= 0) return;
      
      console.log(`Processing project ${projectName} with ${remainingNeeded} images remaining out of ${totalRequired} total`);
      
      // Initialize project allocation tracking
      projectSuggestedAllocation[compositeKey] = {
        totalRequired,
        alreadyAssigned: totalAssigned,
        suggested: 0
      };
      
      // Find available providers for this project period
      const availableProviders = providers.filter(provider => {
        // Skip providers with empty names
        if (!provider['Name'] || provider['Name'].trim() === '') return false;
        
        if (!provider['Start Date'] || !provider['End Date']) return false;
        
        const providerStartDate = new Date(provider['Start Date']);
        const providerEndDate = new Date(provider['End Date']);
        
        // Check if provider is available during project period
        return (
          isWithinInterval(projectStartDate, { start: providerStartDate, end: providerEndDate }) ||
          isWithinInterval(projectEndDate, { start: providerStartDate, end: providerEndDate }) ||
          (providerStartDate <= projectStartDate && providerEndDate >= projectEndDate)
        ) && 
        provider['Available In Future'] === 'TRUE' &&
        provider['No longer Available'] !== 'TRUE';
      });
      
      console.log(`Project ${projectName}: Found ${availableProviders.length} available providers out of ${providers.length} total`);
      
      // Sort providers by experience (more experienced first)
      const sortedProviders = availableProviders.sort((a, b) => {
        const expA = getProviderExperience(a['Name']);
        const expB = getProviderExperience(b['Name']);
        
        // Sort by images delivered (descending) and then by avg edits (ascending)
        if (expA.images !== expB.images) return expB.images - expA.images;
        return expA.edits - expB.edits;
      });
      
      // First pass: calculate each provider's total capacity and current loading ratio
      const providerData = sortedProviders.map(provider => {
        const providerName = provider['Name'];
        
        // Get provider's daily capacity (from settings or default)
        const dailyCapacity = providerCapacities[providerName] || defaultCapacity;
        
        // Calculate overlap between provider availability and project duration
        const providerStartDate = new Date(provider['Start Date']);
        const providerEndDate = new Date(provider['End Date']);
        
        // Find the overlapping period
        const overlapStart = new Date(Math.max(providerStartDate.getTime(), projectStartDate.getTime()));
        const overlapEnd = new Date(Math.min(providerEndDate.getTime(), projectEndDate.getTime()));
        
        // Calculate business days in the overlap period
        const overlapBusinessDays = differenceInBusinessDays(overlapEnd, overlapStart) + 1;
        
        // Apply buffer to reduce available days
        const effectiveOverlapDays = Math.floor(overlapBusinessDays * (1 - (setupBuffer / 100)));
        
        // Calculate provider's total capacity for this project
        const providerTotalCapacity = effectiveOverlapDays * dailyCapacity;
        
        // Check current workload of this provider
        const providerCurrentAssignments = assignments.filter(a => {
          if (!a['Provider\'s Name'] || !providerName) return false;
          
          // Try exact match first
          if (a['Provider\'s Name'] === providerName) return true;
          
          // Try case-insensitive match
          if (a['Provider\'s Name'].toLowerCase() === providerName.toLowerCase()) return true;
          
          // Try partial match as last resort
          return a['Provider\'s Name'].toLowerCase().includes(providerName.toLowerCase()) || 
                 providerName.toLowerCase().includes(a['Provider\'s Name'].toLowerCase());
        });
        
        const currentWorkload = providerCurrentAssignments.reduce((sum, a) => sum + (parseInt(a.Qty) || 0), 0);
        
        // Calculate available capacity considering current workload
        // We assume the workload is evenly distributed across the provider's availability period
        const providerAvailabilityDays = differenceInBusinessDays(
          new Date(provider['End Date']), 
          new Date(provider['Start Date'])
        ) + 1;
        
        // Calculate what portion of the provider's total workload falls within this project period
        const workloadRatio = effectiveOverlapDays / providerAvailabilityDays;
        const estimatedWorkloadForPeriod = currentWorkload * workloadRatio;
        
        // Initialize provider's suggested capacity if not already tracking
        if (!providerSuggestedCapacity[providerName]) {
          providerSuggestedCapacity[providerName] = 0;
        }
        
        // Calculate current load ratio (percentage of capacity already used)
        const currentLoadRatio = estimatedWorkloadForPeriod / providerTotalCapacity;
        const suggestedLoadRatio = providerSuggestedCapacity[providerName] / providerTotalCapacity;
        const totalLoadRatio = currentLoadRatio + suggestedLoadRatio;
        
        // Calculate available capacity and how much more we can assign based on target capacity
        const availableCapacity = Math.max(0, providerTotalCapacity - estimatedWorkloadForPeriod - providerSuggestedCapacity[providerName]);
        const targetCapacity = (providerTotalCapacity * targetCapacityPercent / 100) - 
                               estimatedWorkloadForPeriod - 
                               providerSuggestedCapacity[providerName];
        
        // Calculate capacity we can use based on target capacity percentage
        const usableCapacity = Math.max(0, Math.min(availableCapacity, targetCapacity));
        
        return {
          provider,
          providerName,
          dailyCapacity,
          effectiveOverlapDays,
          providerTotalCapacity,
          currentWorkload: estimatedWorkloadForPeriod,
          suggestedWorkload: providerSuggestedCapacity[providerName],
          totalLoadRatio,
          availableCapacity,
          usableCapacity,
          overlapStart,
          overlapEnd
        };
      });
      
      // Sort providers by current load ratio (ascending) to prioritize less loaded providers
      providerData.sort((a, b) => a.totalLoadRatio - b.totalLoadRatio);
      
      // Assign providers until we've covered the remaining needed images or run out of capacity
      let remainingToAssign = remainingNeeded;
      
      for (let i = 0; i < providerData.length && remainingToAssign > 0; i++) {
        const {
          provider,
          providerName,
          dailyCapacity,
          effectiveOverlapDays,
          providerTotalCapacity,
          availableCapacity,
          usableCapacity,
          overlapStart,
          overlapEnd
        } = providerData[i];
        
        // Skip if this provider has no usable capacity
        if (usableCapacity <= 0) continue;
        
        // Check if taking on more would exceed project requirement
        const projectAllocation = projectSuggestedAllocation[compositeKey];
        const totalCurrentlyAllocated = projectAllocation.alreadyAssigned + projectAllocation.suggested;
        
        // Skip if we've already fully allocated this project
        if (totalCurrentlyAllocated >= projectAllocation.totalRequired) break;
        
        const key = `${providerName}-${projectId}-${projectName}`;
        
        // Skip if this provider is already assigned to this project
        if (existingAssignmentMap[key]) continue;
        
        // Skip if this provider has already been suggested for this project in this batch
        if (suggestedInCurrentBatch[key]) continue;
        
        // For large projects, make sure we assign meaningful chunks of work
        // Calculate a reasonable assignment size based on project size
        const projectSize = projectAllocation.totalRequired;
        const baseAssignmentSize = Math.max(minAssignmentSize, Math.ceil(projectSize * 0.05)); // At least 5% of project or minimum size
        
        // Determine how many images to assign to this provider
        const maxAllowableAssignment = projectAllocation.totalRequired - totalCurrentlyAllocated;
        
        // Use the base assignment size, but don't exceed capacity or remaining needs
        const toAssign = Math.min(
          Math.max(baseAssignmentSize, remainingToAssign * 0.2), // Try to assign at least 20% of remaining work
          Math.floor(usableCapacity),
          maxAllowableAssignment,
          remainingToAssign
        );
        
        if (toAssign > 0) {
          // Create a suggested assignment
          const suggestedAssignment = createSuggestedAssignment(
            providerName, 
            project, 
            toAssign, 
            overlapStart, 
            overlapEnd, 
            totalRequired, 
            dailyCapacity, 
            effectiveOverlapDays, 
            providerTotalCapacity, 
            availableCapacity, 
            providerSuggestedCapacity[providerName]
          );
          
          // Add to suggested assignments
          suggestions.push(suggestedAssignment);
          
          // Mark this provider as suggested for this project in the current batch
          suggestedInCurrentBatch[key] = true;
          
          // Track how much capacity we've suggested for this provider across all projects
          providerSuggestedCapacity[providerName] += toAssign;
          
          // Update project allocation tracking
          projectSuggestedAllocation[compositeKey].suggested += toAssign;
          
          // Update remaining images to assign
          remainingToAssign -= toAssign;
          
          console.log(`Assigned ${toAssign} images to ${providerName} for project ${projectName}, ${remainingToAssign} remaining`);
        }
      }
    });
    
    // For debugging
    console.log('Project allocation after suggestions:', projectSuggestedAllocation);
    
    setSuggestedAssignments(suggestions);
    
    // Initialize selected assignments
    const initialSelected = {};
    suggestions.forEach(suggestion => {
      initialSelected[suggestion['Assigment ID']] = true;
    });
    setSelectedAssignments(initialSelected);
  };
  
  // Helper function to create a suggested assignment
  const createSuggestedAssignment = (
    providerName, 
    project, 
    qty, 
    startDate, 
    endDate, 
    totalRequired, 
    dailyCapacity, 
    effectiveOverlapDays, 
    totalCapacity, 
    availableCapacity, 
    alreadySuggested
  ) => {
    return {
      'Assigment ID': `suggested-${providerName}-${project['Project ID']}-${Date.now()}`,
      'Provider\'s Name': providerName,
      'Client': project['Client'],
      'Project ID': project['Project ID'],
      'Project Name': project['Project Name'],
      'Batch': project['Batch'],
      'Previsional launch date': format(startDate, 'dd/MM/yyyy'),
      'Previsional delivery date': format(endDate, 'dd/MM/yyyy'),
      'Service': project['Service'],
      'Qty': qty,
      '% of project': ((qty / totalRequired) * 100).toFixed(2),
      'experience': getProviderExperience(providerName),
      'capacity': {
        dailyCapacity,
        businessDays: effectiveOverlapDays,
        totalCapacity,
        availableCapacity,
        alreadySuggested
      }
    };
  };

  const getProviderExperience = (providerName) => {
    if (!providerName || providerName.trim() === '') {
      return { images: 0, edits: 0 };
    }
    
    // Try exact match first
    let providerData = workloadData.find(w => 
      w.ImageCreatorUserName === providerName
    );
    
    // If no exact match, try case-insensitive match
    if (!providerData) {
      providerData = workloadData.find(w => 
        w.ImageCreatorUserName.toLowerCase() === providerName.toLowerCase()
      );
    }
    
    // If still no match, try partial match
    if (!providerData) {
      providerData = workloadData.find(w => 
        w.ImageCreatorUserName.toLowerCase().includes(providerName.toLowerCase()) || 
        providerName.toLowerCase().includes(w.ImageCreatorUserName.toLowerCase())
      );
    }
    
    if (!providerData) return { images: 0, edits: 0 };
    
    return {
      images: parseInt(providerData.TotalImagesDelivered) || 0,
      edits: parseFloat(providerData.AvgEdits) || 0
    };
  };

  const handleToggleAll = () => {
    const allSelected = Object.values(selectedAssignments).every(Boolean);
    
    const newSelected = {};
    suggestedAssignments.forEach(suggestion => {
      newSelected[suggestion['Assigment ID']] = !allSelected;
    });
    
    setSelectedAssignments(newSelected);
  };

  const handleToggleAssignment = (assignmentId) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [assignmentId]: !prev[assignmentId]
    }));
  };

  const handleAcceptSelected = async () => {
    try {
      const selectedSuggestions = suggestedAssignments.filter(
        suggestion => selectedAssignments[suggestion['Assigment ID']]
      );
      
      if (selectedSuggestions.length === 0) {
        setSnackbarMessage('No assignments selected');
        setSnackbarOpen(true);
        return;
      }
      
      // Validate total allocation per project before accepting
      const projectAllocations = {};
      
      // First, calculate current allocations from existing assignments
      assignments.forEach(assignment => {
        const projectId = assignment['Project ID'];
        const projectName = assignment['Project Name'];
        if (!projectId || !projectName) return;
        
        const compositeKey = `${projectId}-${projectName}`;
        
        if (!projectAllocations[compositeKey]) {
          // Find the project to get required images
          const project = projects.find(p => p['Project ID'] === projectId && p['Project Name'] === projectName);
          const totalRequired = project ? parseQuantity(project['Qty']) : 0;
          
          projectAllocations[compositeKey] = {
            projectId,
            projectName,
            totalRequired,
            assigned: 0
          };
        }
        
        projectAllocations[compositeKey].assigned += parseQuantity(assignment['Qty']);
      });
      
      // Now check if adding the selected suggestions would over-allocate any project
      const overAllocatedProjects = [];
      
      selectedSuggestions.forEach(suggestion => {
        const projectId = suggestion['Project ID'];
        const projectName = suggestion['Project Name'];
        if (!projectId || !projectName) return;
        
        const compositeKey = `${projectId}-${projectName}`;
        
        if (!projectAllocations[compositeKey]) {
          // Find the project to get required images
          const project = projects.find(p => p['Project ID'] === projectId && p['Project Name'] === projectName);
          const totalRequired = project ? parseQuantity(project['Qty']) : 0;
          
          projectAllocations[compositeKey] = {
            projectId,
            projectName,
            totalRequired,
            assigned: 0
          };
        }
        
        projectAllocations[compositeKey].assigned += parseQuantity(suggestion['Qty']);
        
        // Check if this would over-allocate the project
        if (projectAllocations[compositeKey].assigned > projectAllocations[compositeKey].totalRequired) {
          overAllocatedProjects.push({
            projectId,
            projectName,
            required: projectAllocations[compositeKey].totalRequired,
            wouldBeAssigned: projectAllocations[compositeKey].assigned
          });
        }
      });
      
      // If any projects would be over-allocated, show a warning and don't proceed
      if (overAllocatedProjects.length > 0) {
        const projectsList = overAllocatedProjects.map(p => 
          `${p.projectName} (${p.wouldBeAssigned}/${p.required} images, ${Math.round((p.wouldBeAssigned / p.required) * 100)}%)`
        ).join(', ');
        
        setSnackbarMessage(`Cannot accept: would over-allocate projects: ${projectsList}`);
        setSnackbarOpen(true);
        return;
      }
      
      // Format suggestions for saving
      const newAssignments = selectedSuggestions.map(suggestion => {
        const { experience, capacity, ...assignmentData } = suggestion;
        // Generate a real assignment ID
        assignmentData['Assigment ID'] = assignmentData['Assigment ID'].replace('suggested-', '');
        return assignmentData;
      });
      
      // Add to existing assignments
      const updatedAssignments = [...assignments, ...newAssignments];
      
      // Save to server
      await axios.post('/api/assignments', updatedAssignments);
      
      // Update local state
      setAssignments(updatedAssignments);
      
      // Remove accepted suggestions
      const remainingSuggestions = suggestedAssignments.filter(
        suggestion => !selectedAssignments[suggestion['Assigment ID']]
      );
      setSuggestedAssignments(remainingSuggestions);
      
      // Update selected assignments
      const newSelected = {};
      remainingSuggestions.forEach(suggestion => {
        newSelected[suggestion['Assigment ID']] = true;
      });
      setSelectedAssignments(newSelected);
      
      setSnackbarMessage(`${newAssignments.length} assignments accepted successfully`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error accepting assignments:', error);
      setSnackbarMessage('Failed to accept assignments');
      setSnackbarOpen(true);
    }
  };

  const handleAcceptOne = async (assignment) => {
    try {
      // Validate that accepting this assignment won't over-allocate the project
      const projectId = assignment['Project ID'];
      const projectName = assignment['Project Name'];
      
      if (projectId && projectName) {
        const compositeKey = `${projectId}-${projectName}`;
        
        // Find the matching project using both ID and name
        const project = projects.find(p => 
          p['Project ID'] === projectId && 
          p['Project Name'] === projectName
        );
        
        if (project) {
          const totalRequired = parseQuantity(project['Qty']);
          
          // Calculate current allocation from existing assignments that match both ID and name
          const projectAssignments = assignments.filter(a => 
            a['Project ID'] === projectId && 
            a['Project Name'] === projectName
          );
          
          const currentAllocation = projectAssignments.reduce((sum, a) => sum + parseQuantity(a['Qty']), 0);
          
          // Calculate what would be the allocation after accepting this assignment
          const assignmentQty = parseQuantity(assignment['Qty']);
          const newAllocation = currentAllocation + assignmentQty;
          
          // Check if this would over-allocate the project
          if (newAllocation > totalRequired) {
            setSnackbarMessage(`Cannot accept: would over-allocate project ${projectName} (${newAllocation}/${totalRequired} images, ${Math.round((newAllocation / totalRequired) * 100)}%)`);
            setSnackbarOpen(true);
            return;
          }
        }
      }
      
      // Format for saving
      const { experience, capacity, ...assignmentData } = assignment;
      // Generate a real assignment ID
      assignmentData['Assigment ID'] = assignmentData['Assigment ID'].replace('suggested-', '');
      
      // Add to existing assignments
      const updatedAssignments = [...assignments, assignmentData];
      
      // Save to server
      await axios.post('/api/assignments', updatedAssignments);
      
      // Update local state
      setAssignments(updatedAssignments);
      
      // Remove accepted suggestion
      const remainingSuggestions = suggestedAssignments.filter(
        suggestion => suggestion['Assigment ID'] !== assignment['Assigment ID']
      );
      setSuggestedAssignments(remainingSuggestions);
      
      // Update selected assignments
      const newSelected = { ...selectedAssignments };
      delete newSelected[assignment['Assigment ID']];
      setSelectedAssignments(newSelected);
      
      setSnackbarMessage('Assignment accepted successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error accepting assignment:', error);
      setSnackbarMessage('Failed to accept assignment');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Automatic Assignment Suggestions
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<SettingsIcon />}
          onClick={() => setShowSettings(!showSettings)}
          sx={{ borderRadius: 8 }}
        >
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </Button>
      </Box>
      
      {showSettings && (
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Capacity Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Default Daily Capacity (images per day)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Slider
                      value={defaultCapacity}
                      onChange={(e, newValue) => setDefaultCapacity(newValue)}
                      step={0.5}
                      min={0.5}
                      max={10}
                      valueLabelDisplay="auto"
                      sx={{ mr: 2, flexGrow: 1 }}
                    />
                    <TextField
                      value={defaultCapacity}
                      onChange={(e) => setDefaultCapacity(parseFloat(e.target.value) || 0.5)}
                      type="number"
                      InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Target Provider Capacity (%)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Slider
                      value={targetCapacityPercent}
                      onChange={(e, newValue) => setTargetCapacityPercent(newValue)}
                      step={5}
                      min={50}
                      max={100}
                      marks={[
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 90, label: '90%' },
                        { value: 100, label: '100%' }
                      ]}
                      valueLabelDisplay="auto"
                      sx={{ mr: 2, flexGrow: 1 }}
                    />
                    <TextField
                      value={targetCapacityPercent}
                      onChange={(e) => setTargetCapacityPercent(parseInt(e.target.value) || 50)}
                      type="number"
                      InputProps={{ inputProps: { min: 50, max: 100, step: 5 } }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Preferred capacity utilization. Lower values will distribute work across more providers.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Minimum Assignment Size
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Slider
                      value={minAssignmentSize}
                      onChange={(e, newValue) => setMinAssignmentSize(newValue)}
                      step={10}
                      min={10}
                      max={200}
                      marks={[
                        { value: 20, label: '20' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' },
                        { value: 200, label: '200' }
                      ]}
                      valueLabelDisplay="auto"
                      sx={{ mr: 2, flexGrow: 1 }}
                    />
                    <TextField
                      value={minAssignmentSize}
                      onChange={(e) => setMinAssignmentSize(parseInt(e.target.value) || 20)}
                      type="number"
                      InputProps={{ inputProps: { min: 10, step: 10 } }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Minimum images to assign to a provider. Higher values create larger work batches.
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Setup & Delivery Buffer (%)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Slider
                      value={setupBuffer}
                      onChange={(e, newValue) => setSetupBuffer(newValue)}
                      step={1}
                      min={0}
                      max={30}
                      valueLabelDisplay="auto"
                      sx={{ mr: 2, flexGrow: 1 }}
                    />
                    <TextField
                      value={setupBuffer}
                      onChange={(e) => setSetupBuffer(parseInt(e.target.value) || 0)}
                      type="number"
                      InputProps={{ inputProps: { min: 0, max: 30 } }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Buffer reduces available time to account for setup and delivery security
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Individual Provider Capacities
                </Typography>
                
                <TextField
                  placeholder="Search providers..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                        🔍
                      </Box>
                    ),
                  }}
                  onChange={(e) => setProviderSearch(e.target.value)}
                />
                
                <Box sx={{ 
                  maxHeight: 500, 
                  overflow: 'auto', 
                  pr: 1, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  p: 1
                }}>
                  {Object.keys(providerCapacities)
                    .sort()
                    .filter(providerName => 
                      !providerSearch || 
                      providerName.toLowerCase().includes(providerSearch.toLowerCase())
                    )
                    .map(providerName => (
                    <Box 
                      key={providerName} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        py: 0.5,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <Typography variant="body2" sx={{ width: '50%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {providerName}
                      </Typography>
                      <TextField
                        value={providerCapacities[providerName]}
                        onChange={(e) => {
                          const newCapacities = { ...providerCapacities };
                          newCapacities[providerName] = parseFloat(e.target.value) || 0.5;
                          setProviderCapacities(newCapacities);
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
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={generateSuggestedAssignments}
                sx={{ borderRadius: 8 }}
              >
                Recalculate Suggestions
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            The system has automatically suggested assignments based on provider availability, experience, and project needs.
          </Typography>
          <Typography variant="body2">
            • Provider capacities: <strong>Specific AI Creators = 1 image/day, all others = 2 images/day</strong>
          </Typography>
          <Typography variant="body2">
            • Target provider capacity: <strong>{targetCapacityPercent}%</strong> (distributes work across more providers)
          </Typography>
          <Typography variant="body2">
            • Minimum assignment size: <strong>{minAssignmentSize} images</strong> per assignment
          </Typography>
          <Typography variant="body2">
            • Setup & delivery buffer: <strong>{setupBuffer}%</strong> of project duration reserved for setup and delivery security
          </Typography>
          <Typography variant="body2">
            • Assignments are prioritized by provider experience and quality (more images delivered, fewer edits required)
          </Typography>
        </Alert>
        
        {suggestedAssignments.length === 0 ? (
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No assignment suggestions available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {providers.length === 0 ? (
                  <>
                    No providers with valid names are available. Please check the provider data.
                  </>
                ) : (
                  <>
                    All projects are fully allocated or no providers are available for the required periods.
                  </>
                )}
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  component={RouterLink} 
                  to="/projects"
                  sx={{ borderRadius: 8, textTransform: 'none' }}
                >
                  View Projects
                </Button>
                <Button 
                  variant="outlined" 
                  component={RouterLink} 
                  to="/providers"
                  sx={{ borderRadius: 8, textTransform: 'none' }}
                >
                  View Providers
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Suggested Assignments ({suggestedAssignments.length})
                  </Typography>
                  <Tooltip title="These assignments are suggested based on provider availability, experience, and project needs">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Box>
                  <Button 
                    variant="outlined" 
                    startIcon={Object.values(selectedAssignments).every(Boolean) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    onClick={handleToggleAll}
                    sx={{ mr: 2, borderRadius: 8, textTransform: 'none' }}
                  >
                    {Object.values(selectedAssignments).every(Boolean) ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<CheckCircleIcon />}
                    onClick={handleAcceptSelected}
                    sx={{ 
                      borderRadius: 8, 
                      textTransform: 'none',
                      boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
                    }}
                  >
                    Accept Selected
                  </Button>
                </Box>
              </Box>
              
              <Divider />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={Object.values(selectedAssignments).every(Boolean) && suggestedAssignments.length > 0}
                          indeterminate={
                            Object.values(selectedAssignments).some(Boolean) && 
                            !Object.values(selectedAssignments).every(Boolean)
                          }
                          onChange={handleToggleAll}
                        />
                      </TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Experience</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Images</TableCell>
                      <TableCell>% of Project</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suggestedAssignments.map((suggestion) => (
                      <TableRow 
                        key={suggestion['Assigment ID']}
                        sx={{ 
                          bgcolor: selectedAssignments[suggestion['Assigment ID']] ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                          '&:hover': {
                            bgcolor: selectedAssignments[suggestion['Assigment ID']] ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox 
                            checked={!!selectedAssignments[suggestion['Assigment ID']]}
                            onChange={() => handleToggleAssignment(suggestion['Assigment ID'])}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {suggestion['Provider\'s Name']}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">
                              Images: {suggestion.experience.images}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Avg Edits: {suggestion.experience.edits.toFixed(2)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {suggestion['Project Name']}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {suggestion['Project ID']}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={suggestion['Client']} 
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)', 
                              color: 'primary.main',
                              fontWeight: 'medium'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            {suggestion['Previsional launch date']}
                          </Typography>
                          <Typography variant="caption" display="block">
                            to {suggestion['Previsional delivery date']}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({suggestion.capacity.businessDays} working days)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">
                              Daily: {suggestion.capacity.dailyCapacity} img/day
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total: {Math.round(suggestion.capacity.totalCapacity)} images
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Available: {Math.round(suggestion.capacity.availableCapacity)} images
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{suggestion['Qty']}</TableCell>
                        <TableCell>{suggestion['% of project']}%</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleAcceptOne(suggestion)}
                            sx={{ borderRadius: 8, textTransform: 'none' }}
                          >
                            Accept
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </div>
  );
};

export default AutoAssignments; 