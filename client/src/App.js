import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

// Import our custom theme
import theme from './theme';

// Components
import Navbar from './components/layout/Navbar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/projects/ProjectList';
import ProjectDetail from './components/projects/ProjectDetail';
import CreateProject from './components/projects/CreateProject';
import EditProject from './components/projects/EditProject';
import ProviderManagement from './components/providers/ProviderManagement';
import AssignmentList from './components/assignments/AssignmentList';
import AutoAssignments from './components/assignments/AutoAssignments';
import ProjectGantt from './components/projects/ProjectGantt';
import NewGantt from './components/projects/NewGantt';
import CapacityProjectionNew from './components/dashboard/CapacityProjectionNew';
import { clearExpiredStorage } from './utils/dataStorage';

// Global styles
const globalStyles = {
  backgroundContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F8F9FE 0%, #EDF1FD 100%)',
    backgroundAttachment: 'fixed',
    paddingBottom: '2rem',
  },
  contentContainer: {
    marginTop: '2rem',
    position: 'relative',
    zIndex: 1,
  },
};

// Memory monitor component to help diagnose memory issues
const MemoryMonitor = () => {
  useEffect(() => {
    // Only run in development environment
    if (process.env.NODE_ENV !== 'development') return;
    
    // Report memory usage every 30 seconds
    const interval = setInterval(() => {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        console.log('Memory usage:', {
          total: Math.round(memory.totalJSHeapSize / (1024 * 1024)) + ' MB',
          used: Math.round(memory.usedJSHeapSize / (1024 * 1024)) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)) + ' MB',
          percentUsed: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) + '%'
        });
      }
      
      // Also clear expired localStorage items
      clearExpiredStorage();
    }, 30000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, []);
  
  return null; // This component doesn't render anything
};

// Memory optimization on route changes
const RouteChangeHandler = ({ children }) => {
  useEffect(() => {
    // Force garbage collection (as much as possible in JS)
    try {
      if (window.gc) {
        window.gc();
      }
    } catch (e) {
      console.log('GC not available');
    }
    
    // Clear some memory
    if (window.performance && window.performance.memory && 
        window.performance.memory.usedJSHeapSize > 200 * 1024 * 1024) { // If using more than 200MB
      console.log('Memory cleanup initiated');
      
      // Clear some caches that might be stored on the window object
      if (window._clientColorCache) {
        window._clientColorCache.clear();
      }
      
      // Clear image cache if it exists
      if (window._imageCache) {
        window._imageCache = {};
      }
      
      // Clear other potential memory leaks
      setTimeout(() => {
        // Try to force garbage collection again
        if (window.gc) window.gc();
      }, 100);
    }
  }, []);

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={globalStyles.backgroundContainer}>
        <Router>
          <MemoryMonitor />
          <Navbar />
          <Container maxWidth="lg" sx={globalStyles.contentContainer}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <RouteChangeHandler>
                    <Dashboard />
                  </RouteChangeHandler>
                } 
              />
              {/* Dedicated route for capacity-new */}
              <Route 
                path="/dashboard/capacity-new" 
                element={
                  <RouteChangeHandler>
                    <CapacityProjectionNew />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <RouteChangeHandler>
                    <ProjectList />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/projects/create" 
                element={
                  <RouteChangeHandler>
                    <CreateProject />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/projects/edit/:id" 
                element={
                  <RouteChangeHandler>
                    <EditProject />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/projects/:id" 
                element={
                  <RouteChangeHandler>
                    <ProjectDetail />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/providers" 
                element={
                  <RouteChangeHandler>
                    <ProviderManagement />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/assignments" 
                element={
                  <RouteChangeHandler>
                    <AssignmentList />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/auto-assignments" 
                element={
                  <RouteChangeHandler>
                    <AutoAssignments />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/gantt" 
                element={
                  <RouteChangeHandler>
                    <ProjectGantt />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/new-gantt" 
                element={
                  <RouteChangeHandler>
                    <NewGantt />
                  </RouteChangeHandler>
                } 
              />
              <Route 
                path="/custom-gantt-chart" 
                element={
                  <RouteChangeHandler>
                    <NewGantt />
                  </RouteChangeHandler>
                } 
              />
            </Routes>
          </Container>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
