import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CapacityProjectionNew from './CapacityProjectionNew';

const Dashboard = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <CapacityProjectionNew />
      
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Note
          </Typography>
          <Typography variant="body1">
            The new Capacity Projection component is also available at the "/dashboard/capacity-new" route
            and can be accessed from the navigation menu.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 