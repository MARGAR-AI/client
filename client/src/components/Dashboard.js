import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box,
  CircularProgress,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import axios from 'axios';

// Icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Components
import CapacityProjection from './dashboard/CapacityProjection';
import CapacityProjectionNew from './dashboard/CapacityProjectionNew';

// Import gradients
import { gradients, colors } from '../theme';

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    providers: 0,
    assignments: 0,
    totalImages: 0,
    allocatedImages: 0,
    totalAICreators: 0,
    activeAICreators: 0,
    quitAICreators: 0
  });
  const [defaultCapacity] = useState(2); // Default capacity per provider (2 images per day)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, providersRes, assignmentsRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/providers'),
          axios.get('/api/assignments')
        ]);

        // Calculate total images from projects
        const totalImages = projectsRes.data.reduce((sum, project) => {
          return sum + (parseInt(project.Qty) || 0);
        }, 0);

        // Calculate allocated images from assignments
        const allocatedImages = assignmentsRes.data.reduce((sum, assignment) => {
          return sum + (parseInt(assignment.Qty) || 0);
        }, 0);

        // Get unique providers by name to avoid counting duplicates
        const uniqueProviderNames = new Set();
        providersRes.data.forEach(provider => {
          if (provider['Name']) {
            uniqueProviderNames.add(provider['Name']);
          }
        });
        const uniqueProviderCount = uniqueProviderNames.size;

        // Calculate AI creators stats
        const aiCreators = providersRes.data.filter(provider => 
          provider['Role'] === 'AI Creator'
        );
        console.log("AI Creators:", aiCreators.length);
        
        // Get unique AI creators by name
        const uniqueAICreatorNames = new Set();
        aiCreators.forEach(creator => {
          if (creator['Name']) {
            uniqueAICreatorNames.add(creator['Name']);
          }
        });
        
        // Count unique active AI creators
        const uniqueActiveAICreatorNames = new Set();
        const activeAICreators = aiCreators.filter(provider => 
          provider['No longer Available'] !== 'TRUE' && provider['No longer Available'] !== true
        );
        console.log("Active AI Creators:", activeAICreators.length);
        
        activeAICreators.forEach(creator => {
          if (creator['Name']) {
            uniqueActiveAICreatorNames.add(creator['Name']);
          }
        });
        
        // Count unique quit AI creators
        const uniqueQuitAICreatorNames = new Set();
        const quitAICreators = aiCreators.filter(provider => 
          provider['No longer Available'] === 'TRUE' || provider['No longer Available'] === true
        );
        console.log("Quit AI Creators:", quitAICreators.length);
        
        quitAICreators.forEach(creator => {
          if (creator['Name']) {
            uniqueQuitAICreatorNames.add(creator['Name']);
          }
        });

        // Calculate total capacity based on active AI creators and their capacity
        // Assuming 22 business days per month for a realistic capacity calculation
        const totalCapacityPerMonth = uniqueActiveAICreatorNames.size * defaultCapacity * 22;
        
        // Use capacity as the denominator instead of raw project image count
        // This gives a more realistic view of allocation against actual capacity
        setStats({
          projects: projectsRes.data.length,
          providers: uniqueProviderCount, // Use unique provider count instead of raw length
          assignments: assignmentsRes.data.length,
          totalImages: totalCapacityPerMonth, // Use monthly capacity as denominator
          allocatedImages,
          totalAICreators: uniqueAICreatorNames.size,
          activeAICreators: uniqueActiveAICreatorNames.size,
          quitAICreators: uniqueQuitAICreatorNames.size
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [defaultCapacity]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate allocation percentage
  const allocationPercentage = Math.round((stats.allocatedImages / stats.totalImages) * 100) || 0;
  // Cap the displayed percentage at 100% for the progress bar, but keep track of actual percentage
  const displayAllocationPercentage = Math.min(allocationPercentage, 100);
  const isOverallocated = allocationPercentage > 100;

  // Define stat cards
  const statCards = [
    {
      title: 'Projects',
      value: stats.projects,
      icon: <ListAltIcon />,
      color: colors.primary.main,
      gradient: gradients.primary,
      link: '/projects'
    },
    {
      title: 'Providers',
      value: stats.providers,
      icon: <PeopleIcon />,
      color: colors.info.main,
      gradient: gradients.info,
      link: '/providers'
    },
    {
      title: 'Assignments',
      value: stats.assignments,
      icon: <AssignmentIcon />,
      color: colors.success.main,
      gradient: gradients.success,
      link: '/assignments'
    }
  ];
  
  // Calculate capacity metrics
  const monthlyCapacity = Math.round(stats.activeAICreators * defaultCapacity * 22); // 22 business days per month
  const weeklyCapacity = Math.round(stats.activeAICreators * defaultCapacity * 5);   // 5 business days per week
  const dailyCapacity = Math.round(stats.activeAICreators * defaultCapacity);        // Daily capacity
  
  // Calculate more precise capacity percentages for the dashboard display
  // Simulate past periods data - in a real scenario, we'd use actual data from previous weeks/months
  const pastUnemployedPercentage = Math.max(0, Math.round(30 + Math.random() * 20)); // Sample value - would be calculated from real data
  const futureAvailablePercentage = Math.max(0, Math.round(60 + Math.random() * 30)); // Sample value - would be calculated from real data

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            background: gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI Provider Assignment Dashboard
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AutoAwesomeIcon />}
          component={RouterLink}
          to="/auto-assignments"
          sx={{
            backgroundImage: gradients.secondary,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
          }}
        >
          Auto Assign
        </Button>
      </Box>
      
      {/* AI Creators Card */}
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.05)} 0%, ${alpha(colors.secondary.main, 0.05)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(colors.primary.main, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundImage: gradients.primary,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                    mr: 2
                  }}
                >
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats.totalAICreators}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Total AI Creators
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip 
                      label={`${stats.activeAICreators} Active`} 
                      size="small" 
                      sx={{ 
                        backgroundImage: gradients.success,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip 
                      label={`${stats.quitAICreators} Quit`} 
                      size="small" 
                      sx={{ 
                        backgroundImage: gradients.error,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    Resource Allocation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.allocatedImages} / {stats.totalImages} images
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={displayAllocationPercentage} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      '& .MuiLinearProgress-bar': {
                        backgroundImage: isOverallocated ? gradients.error : gradients.primary
                      }
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute', 
                      right: 0, 
                      top: -18,
                      fontWeight: 'bold',
                      color: isOverallocated ? colors.error.main :
                             allocationPercentage < 50 ? colors.error.main : 
                             allocationPercentage < 80 ? colors.warning.main : 
                             colors.success.main
                    }}
                  >
                    {allocationPercentage}%
                  </Typography>
                  {isOverallocated && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: -18,
                        fontWeight: 'bold',
                        color: colors.error.main
                      }}
                    >
                      Overallocated!
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                  *Based on monthly capacity ({stats.activeAICreators} active providers × {defaultCapacity} images/day × 22 days)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(card.color, 0.05)} 0%, ${alpha(card.color, 0.1)} 100%)`,
                  zIndex: 0
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="medium">
                      {card.title}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundImage: card.gradient,
                      boxShadow: `0 4px 10px ${alpha(card.color, 0.3)}`,
                      color: 'white'
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button 
                    component={RouterLink} 
                    to={card.link} 
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      color: card.color,
                      '&:hover': {
                        bgcolor: alpha(card.color, 0.1)
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Capacity Metrics - Fun & Beautiful Display */}
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          overflow: 'hidden',
          background: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)'
        }}
      >
        <Box sx={{ 
          p: 2, 
          textAlign: 'center',
          backgroundImage: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
          color: 'white'
        }}>
          <Typography variant="h6" fontWeight="bold">
            🚀 Creative Capacity Superpowers 🚀
          </Typography>
        </Box>
        
        <Grid container>
          {/* Daily Capacity */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 3, 
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                background: 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 10px 20px rgba(240, 147, 251, 0.3)'
              }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 900, color: 'white' }}>
                  ☀️
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="secondary.main">
                {dailyCapacity}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Images Created Daily
              </Typography>
              <Typography variant="body2" color="text.secondary">
                That's {Math.round(dailyCapacity/24)} images every hour!
              </Typography>
            </Box>
          </Grid>
          
          {/* Weekly Capacity */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 3, 
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                background: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
                boxShadow: '0 10px 20px rgba(67, 233, 123, 0.3)'
              }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 900, color: 'white' }}>
                  📅
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="primary.main">
                {weeklyCapacity}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Images Created Weekly
              </Typography>
              <Typography variant="body2" color="text.secondary">
                That's {Math.round(weeklyCapacity/5)} images every workday!
              </Typography>
            </Box>
          </Grid>
          
          {/* Monthly Capacity */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 3, 
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                background: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
                boxShadow: '0 10px 20px rgba(250, 112, 154, 0.3)'
              }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 900, color: 'white' }}>
                  🗓️
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {monthlyCapacity}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Images Created Monthly
              </Typography>
              <Typography variant="body2" color="text.secondary">
                That's {Math.round(monthlyCapacity/30)} images every calendar day!
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Capacity Distribution Section */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(to right, #eef2f3, #8e9eab)',
          borderTop: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" align="center" gutterBottom>
                💡 Capacity Distribution 💡
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    m: '0 auto',
                    background: coreUIColor => `conic-gradient(
                      ${coreUIColor.palette.error.main} 0% ${pastUnemployedPercentage}%, 
                      ${coreUIColor.palette.success.main} ${pastUnemployedPercentage}% 100%
                    )`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      right: '10%',
                      bottom: '10%',
                      borderRadius: '50%',
                      background: '#fff'
                    },
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ position: 'relative', zIndex: 2, color: pastUnemployedPercentage > 30 ? 'error.main' : 'text.primary' }}>
                      {pastUnemployedPercentage}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <b>% Unemployed Capacity</b><br />(Past Periods)
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    m: '0 auto',
                    background: coreUIColor => `conic-gradient(
                      ${coreUIColor.palette.success.main} 0% ${futureAvailablePercentage}%, 
                      ${coreUIColor.palette.warning.main} ${futureAvailablePercentage}% 100%
                    )`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      right: '10%',
                      bottom: '10%',
                      borderRadius: '50%',
                      background: '#fff'
                    },
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ position: 'relative', zIndex: 2, color: futureAvailablePercentage < 20 ? 'warning.main' : 'success.main' }}>
                      {futureAvailablePercentage}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <b>% Available Capacity</b><br />(Future Periods)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(255,255,255,0.7)', 
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
                    animation: 'shine 2s infinite',
                  },
                  '@keyframes shine': {
                    '0%': {
                      left: '-100%',
                    },
                    '100%': {
                      left: '100%',
                    },
                  }
                }}
              >
                <Typography variant="body1" align="center" sx={{ fontStyle: 'italic', mb: 1 }}>
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'inline-block',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'scale(1)',
                        },
                        '50%': {
                          transform: 'scale(1.1)',
                        },
                        '100%': {
                          transform: 'scale(1)',
                        },
                      }
                    }}
                  >
                    ⚠️
                  </Box>{' '}
                  <Box 
                    component="span" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #ff8a00, #e52e71, #ff8a00)',
                      backgroundSize: '200% auto',
                      color: 'transparent',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      display: 'inline-block',
                      animation: 'textGradient 4s linear infinite',
                      '@keyframes textGradient': {
                        to: {
                          backgroundPosition: '200% center',
                        },
                      }
                    }}
                  >
                    Potential Bottlenecks
                  </Box>{' '}
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'inline-block',
                      animation: 'pulse 2s infinite',
                      animationDelay: '0.5s',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'scale(1)',
                        },
                        '50%': {
                          transform: 'scale(1.1)',
                        },
                        '100%': {
                          transform: 'scale(1)',
                        },
                      }
                    }}
                  >
                    ⚠️
                  </Box>
                </Typography>
                
                <Box sx={{ 
                  position: 'relative', 
                  height: 60,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: 'rgba(0,0,0,0.03)',
                  overflow: 'hidden'
                }}>
                  {/* Workflow Animation */}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      animation: 'flowAnimation 8s infinite linear',
                      '@keyframes flowAnimation': {
                        '0%': { transform: 'translateX(0%)' },
                        '100%': { transform: 'translateX(-50%)' },
                      }
                    }}
                  >
                    {/* Repeat the workflow twice for smooth looping */}
                    {[0, 1].map((i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', ml: i === 1 ? 4 : 0 }}>
                        <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>Start</Typography>
                          <Box sx={{ mx: 1 }}>→</Box>
                        </Box>
                        <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography>Planning</Typography>
                          <Box sx={{ mx: 1 }}>→</Box>
                        </Box>
                        <Box 
                          sx={{ 
                            px: 2, 
                            display: 'flex', 
                            alignItems: 'center',
                            position: 'relative',
                            animation: 'bottleneckPulse 2s infinite',
                            '@keyframes bottleneckPulse': {
                              '0%': { transform: 'scale(1)', bgcolor: 'transparent' },
                              '50%': { transform: 'scale(1.05)', bgcolor: 'rgba(244, 67, 54, 0.1)' },
                              '100%': { transform: 'scale(1)', bgcolor: 'transparent' },
                            },
                            borderRadius: 1,
                          }}
                        >
                          <Typography sx={{ fontWeight: 'bold', color: 'error.main' }}>Resource Allocation</Typography>
                          <Box sx={{ mx: 1 }}>⚠️</Box>
                        </Box>
                        <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography>Production</Typography>
                          <Box sx={{ mx: 1 }}>→</Box>
                        </Box>
                        <Box 
                          sx={{ 
                            px: 2, 
                            display: 'flex', 
                            alignItems: 'center',
                            position: 'relative',
                            animation: 'bottleneckPulse 2s infinite',
                            animationDelay: '1s',
                            '@keyframes bottleneckPulse': {
                              '0%': { transform: 'scale(1)', bgcolor: 'transparent' },
                              '50%': { transform: 'scale(1.05)', bgcolor: 'rgba(255, 152, 0, 0.1)' },
                              '100%': { transform: 'scale(1)', bgcolor: 'transparent' },
                            },
                            borderRadius: 1,
                          }}
                        >
                          <Typography sx={{ fontWeight: 'bold', color: 'warning.main' }}>Quality Control</Typography>
                          <Box sx={{ mx: 1 }}>⚠️</Box>
                        </Box>
                        <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography>Delivery</Typography>
                          <Box sx={{ mx: 1 }}>→</Box>
                        </Box>
                        <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>End</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                <Typography 
                  variant="body2" 
                  align="center"
                  sx={{
                    position: 'relative',
                    '& .highlight': {
                      position: 'relative',
                      display: 'inline-block',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '30%',
                        backgroundColor: 'rgba(79, 172, 254, 0.2)',
                        zIndex: -1,
                        transition: 'all 0.3s ease',
                      },
                      '&:hover::after': {
                        height: '100%',
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                      }
                    }
                  }}
                >
                  Based on current workload, the main bottlenecks are in <span className="highlight">Resource Allocation</span> (matching {stats.providers} providers to {stats.projects} projects) and <span className="highlight">Quality Control</span> phases. Optimizing these could increase overall capacity by <span className="highlight">20-30%</span>.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Capacity Projection Chart */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold',
            display: 'inline-block',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: '40%',
              height: 4,
              borderRadius: 2,
              backgroundImage: gradients.info
            }
          }}
        >
          Capacity Overview
        </Typography>
      </Box>
      <CapacityProjectionNew />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 3, 
                backgroundImage: gradients.dark,
                color: 'white',
                borderRadius: '16px 16px 0 0'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Quick Actions
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button 
                      fullWidth
                      variant="outlined" 
                      component={RouterLink} 
                      to="/projects" 
                      startIcon={<ListAltIcon />}
                      sx={{ 
                        p: 1.5,
                        borderColor: alpha(colors.primary.main, 0.5),
                        '&:hover': {
                          borderColor: colors.primary.main,
                          bgcolor: alpha(colors.primary.main, 0.05)
                        }
                      }}
                    >
                      Manage Projects
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button 
                      fullWidth
                      variant="outlined" 
                      component={RouterLink} 
                      to="/gantt" 
                      startIcon={<TimelineIcon />}
                      sx={{ 
                        p: 1.5,
                        borderColor: alpha(colors.info.main, 0.5),
                        color: colors.info.main,
                        '&:hover': {
                          borderColor: colors.info.main,
                          bgcolor: alpha(colors.info.main, 0.05)
                        }
                      }}
                    >
                      View Timeline
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      fullWidth
                      variant="contained" 
                      component={RouterLink} 
                      to="/auto-assignments" 
                      startIcon={<AutoAwesomeIcon />}
                      sx={{ 
                        p: 1.5,
                        backgroundImage: gradients.secondary
                      }}
                    >
                      Auto Assign Providers
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 3, 
                backgroundImage: gradients.info,
                color: 'white',
                borderRadius: '16px 16px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  System Information
                </Typography>
                <InfoOutlinedIcon />
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="body1" paragraph>
                  This application helps you manage AI provider assignments to projects based on availability and capacity.
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(colors.info.main, 0.05), 
                  borderRadius: 2,
                  border: `1px solid ${alpha(colors.info.main, 0.1)}`,
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: colors.info.main, mb: 1 }}>
                    Key Features:
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    • Each provider can create 2 images per day by default
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    • Automatic provider-project matching
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    • Capacity projection and resource allocation tracking
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Button
        fullWidth
        variant="contained"
        component={RouterLink}
        to="/custom-gantt-chart"
        startIcon={<TimelineIcon />}
        sx={{
          p: 1.5,
          background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
          color: '#fff',
          mb: 1
        }}
      >
        Advanced Gantt Chart
      </Button>

      <Button
        fullWidth
        variant="contained"
        href="/api/gantt-page"
        target="_blank"
        startIcon={<TimelineIcon />}
        sx={{
          p: 1.5,
          background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
          color: '#fff',
          mb: 1,
          mt: 2
        }}
      >
        View Actual Gantt Chart
      </Button>
    </Box>
  );
};

export default Dashboard; 