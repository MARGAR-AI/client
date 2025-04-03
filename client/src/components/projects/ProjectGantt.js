import React from 'react';
import GanttChart from './GanttChart';

// This component will redirect to our API-based Gantt chart 
// to completely bypass whatever is overriding our components
const ProjectGantt = () => {
  return <GanttChart />;
};

export default ProjectGantt; 