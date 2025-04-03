import React from 'react';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Sidebar = () => {
  return (
    <div>
      {/* Add a link to the new Capacity Projection component */}
      <ListItem button component={RouterLink} to="/dashboard/capacity-new">
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="New Capacity Projection" />
      </ListItem>
    </div>
  );
};

export default Sidebar; 