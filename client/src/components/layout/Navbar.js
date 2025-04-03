import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FolderIcon from '@mui/icons-material/Folder';

// Import gradients
import { gradients } from '../../theme';

const Navbar = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
    { name: 'Projects', path: '/projects', icon: <ListAltIcon fontSize="small" /> },
    { name: 'Providers', path: '/providers', icon: <PeopleIcon fontSize="small" /> },
    { name: 'Assignments', path: '/assignments', icon: <AssignmentIcon fontSize="small" /> },
    { name: 'Timeline', path: '/gantt', icon: <TimelineIcon fontSize="small" /> },
    { name: 'Project Gantt', path: '/new-gantt', icon: <TimelineIcon fontSize="small" /> },
  ];

  const autoAssignItem = {
    name: 'Auto Assign',
    path: '/auto-assignments',
    icon: <AutoAwesomeIcon fontSize="small" />,
    highlight: true
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: gradients.dark,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Toolbar>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          background: alpha(theme.palette.common.white, 0.1),
          borderRadius: 2,
          px: 1.5,
          py: 0.5,
          mr: 2
        }}>
          <AssignmentIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            AI Provider
          </Typography>
        </Box>

        {isMobile ? (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
              sx={{ 
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2)
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  borderRadius: 2,
                  minWidth: 180,
                  mt: 1
                }
              }}
            >
              {navItems.map((item) => (
                <MenuItem 
                  key={item.path} 
                  component={RouterLink} 
                  to={item.path}
                  onClick={handleClose}
                  selected={isActive(item.path)}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 1, color: theme.palette.primary.main }}>
                      {item.icon}
                    </Box>
                    {item.name}
                  </Box>
                </MenuItem>
              ))}
              <MenuItem 
                component={RouterLink} 
                to={autoAssignItem.path}
                onClick={handleClose}
                selected={isActive(autoAssignItem.path)}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  background: isActive(autoAssignItem.path) 
                    ? alpha(theme.palette.secondary.main, 0.1)
                    : alpha(theme.palette.secondary.main, 0.05),
                  '&:hover': {
                    background: alpha(theme.palette.secondary.main, 0.2),
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mr: 1, color: theme.palette.secondary.main }}>
                    {autoAssignItem.icon}
                  </Box>
                  {autoAssignItem.name}
                </Box>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{ 
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    ...(isActive(item.path) && {
                      bgcolor: alpha(theme.palette.common.white, 0.1),
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '50%',
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                        background: theme.palette.primary.main,
                      }
                    })
                  }}
                >
                  {item.name}
                </Button>
              ))}
              <Button 
                color="secondary"
                component={RouterLink} 
                to={autoAssignItem.path}
                startIcon={autoAssignItem.icon}
                variant="contained"
                sx={{ 
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundImage: gradients.secondary,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
                  }
                }}
              >
                {autoAssignItem.name}
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 