const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = async (req, res) => {
  try {
    // If there's no CSV file available, return mock data
    let projectsData = [];
    const csvPath = path.join(process.cwd(), 'vercel-data', 'Planning ressource allocation_ CONCEPTION - Ressource allocation Planning.csv');
    
    try {
      if (fs.existsSync(csvPath)) {
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        projectsData = parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        });
      } else {
        console.log('CSV file not found, using data/projects.csv as fallback');
        const fallbackPath = path.join(process.cwd(), 'data', 'projects.csv');
        if (fs.existsSync(fallbackPath)) {
          const fileContent = fs.readFileSync(fallbackPath, 'utf8');
          projectsData = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
          });
        }
      }
    } catch (error) {
      console.error('Error reading CSV file:', error);
    }

    // Generate timeline data
    const timelineData = calculateTimelineData(projectsData);

    // Serialize data for the page
    const serializedData = JSON.stringify({
      timeline: timelineData.timeline,
      projects: timelineData.projects
    });

    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    
    // Send the HTML with embedded data and script
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Advanced Gantt Chart</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Roboto', sans-serif;
          }
          
          body {
            background-color: #f5f7fa;
            color: #333;
            padding: 20px;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow: hidden;
          }
          
          .header {
            padding: 24px;
            background: linear-gradient(135deg, #3f51b5, #5c6bc0);
            color: white;
          }
          
          .gantt-container {
            padding: 16px;
            overflow-x: auto;
          }
          
          .timeline-header {
            display: flex;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 16px;
          }
          
          .project-column {
            width: 300px;
            flex-shrink: 0;
            padding: 8px 16px;
            font-weight: bold;
          }
          
          .timeline-grid {
            flex: 1;
            display: flex;
          }
          
          .month-column {
            flex: 1;
            text-align: center;
            padding: 8px;
            border-left: 1px solid #e0e0e0;
            background-color: #f9f9f9;
          }
          
          .month-column:nth-child(even) {
            background-color: #f5f5f5;
          }
          
          .project-row {
            display: flex;
            border-bottom: 1px solid #f0f0f0;
            min-height: 60px;
            position: relative;
            transition: background-color 0.2s;
          }
          
          .project-row:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
          
          .project-info {
            width: 300px;
            flex-shrink: 0;
            padding: 12px 16px;
          }
          
          .project-name {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .project-meta {
            font-size: 12px;
            color: #666;
          }
          
          .timeline-bar-container {
            flex: 1;
            position: relative;
          }
          
          .timeline-bar {
            position: absolute;
            height: 30px;
            border-radius: 4px;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 8px;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .timeline-bar:hover {
            transform: translateY(-50%) scale(1.02);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            z-index: 10;
          }
          
          .today-marker {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #4caf50;
            z-index: 5;
          }
          
          .today-label {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
          }
          
          .project-tooltip {
            display: none;
            position: absolute;
            background-color: white;
            border-radius: 4px;
            padding: 8px 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 100;
            max-width: 300px;
            pointer-events: none;
          }
          
          .project-tooltip.visible {
            display: block;
          }
          
          .tooltip-title {
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .tooltip-row {
            font-size: 12px;
            margin-bottom: 2px;
          }
          
          .status-not-started { background-color: #ff9800; }
          .status-in-progress { background-color: #2196f3; }
          .status-completed { background-color: #4caf50; }
          .status-default { background-color: #9e9e9e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Advanced Project Timeline</h1>
          </div>
          <div class="gantt-container" id="gantt-container">
            <!-- Content will be dynamically inserted by JavaScript -->
          </div>
        </div>
        
        <div id="tooltip" class="project-tooltip">
          <div class="tooltip-title" id="tooltip-title"></div>
          <div class="tooltip-row" id="tooltip-client"></div>
          <div class="tooltip-row" id="tooltip-images"></div>
          <div class="tooltip-row" id="tooltip-status"></div>
          <div class="tooltip-row" id="tooltip-dates"></div>
        </div>
        
        <script>
          // Timeline data from server
          const data = ${serializedData};
          
          // Initialize on page load
          document.addEventListener('DOMContentLoaded', function() {
            renderGanttChart(data);
          });
          
          function renderGanttChart(data) {
            const container = document.getElementById('gantt-container');
            
            // Create header
            const timelineHeader = document.createElement('div');
            timelineHeader.className = 'timeline-header';
            
            const projectColumn = document.createElement('div');
            projectColumn.className = 'project-column';
            projectColumn.textContent = 'Project';
            timelineHeader.appendChild(projectColumn);
            
            const timelineGrid = document.createElement('div');
            timelineGrid.className = 'timeline-grid';
            timelineHeader.appendChild(timelineGrid);
            
            // Add month columns
            data.timeline.months.forEach(month => {
              const monthColumn = document.createElement('div');
              monthColumn.className = 'month-column';
              monthColumn.textContent = month.label;
              timelineGrid.appendChild(monthColumn);
            });
            
            container.appendChild(timelineHeader);
            
            // Create today marker if available
            if (data.timeline.todayPosition) {
              const todayMarker = document.createElement('div');
              todayMarker.className = 'today-marker';
              todayMarker.style.left = data.timeline.todayPosition.left;
              
              const todayLabel = document.createElement('div');
              todayLabel.className = 'today-label';
              todayLabel.textContent = 'Today';
              todayMarker.appendChild(todayLabel);
              
              // Will be positioned relative to the gantt container
              container.style.position = 'relative';
              container.appendChild(todayMarker);
            }
            
            // Create project rows
            data.projects.forEach(project => {
              const projectRow = document.createElement('div');
              projectRow.className = 'project-row';
              
              const projectInfo = document.createElement('div');
              projectInfo.className = 'project-info';
              
              const projectName = document.createElement('div');
              projectName.className = 'project-name';
              projectName.textContent = project.name;
              projectInfo.appendChild(projectName);
              
              const projectMeta = document.createElement('div');
              projectMeta.className = 'project-meta';
              projectMeta.textContent = \`\${project.client} • \${project.imageCount} images\`;
              projectInfo.appendChild(projectMeta);
              
              projectRow.appendChild(projectInfo);
              
              const timelineBarContainer = document.createElement('div');
              timelineBarContainer.className = 'timeline-bar-container';
              
              if (project.position.width !== '0%') {
                const timelineBar = document.createElement('div');
                timelineBar.className = 'timeline-bar';
                
                // Set status-based color
                let statusClass = 'status-default';
                if (project.status) {
                  const status = project.status.toLowerCase();
                  if (status.includes('not started')) statusClass = 'status-not-started';
                  else if (status.includes('in progress')) statusClass = 'status-in-progress';
                  else if (status.includes('completed')) statusClass = 'status-completed';
                }
                timelineBar.classList.add(statusClass);
                
                // Set position and dimensions
                timelineBar.style.left = project.position.left;
                timelineBar.style.width = project.position.width;
                
                // Scale height based on image count
                const minHeight = 24;
                const maxHeight = 50;
                const height = Math.min(maxHeight, Math.max(minHeight, minHeight + (project.imageCount * 0.1)));
                timelineBar.style.height = \`\${height}px\`;
                
                timelineBar.textContent = project.name;
                
                // Add tooltip functionality
                timelineBar.addEventListener('mousemove', function(e) {
                  showTooltip(e, project);
                });
                
                timelineBar.addEventListener('mouseleave', function() {
                  hideTooltip();
                });
                
                timelineBarContainer.appendChild(timelineBar);
              }
              
              projectRow.appendChild(timelineBarContainer);
              container.appendChild(projectRow);
            });
          }
          
          // Tooltip functionality
          function showTooltip(event, project) {
            const tooltip = document.getElementById('tooltip');
            
            // Set content
            document.getElementById('tooltip-title').textContent = project.name;
            document.getElementById('tooltip-client').textContent = \`Client: \${project.client}\`;
            document.getElementById('tooltip-images').textContent = \`Images: \${project.imageCount}\`;
            document.getElementById('tooltip-status').textContent = \`Status: \${project.status || 'Unknown'}\`;
            
            // Format dates
            const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set';
            const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set';
            document.getElementById('tooltip-dates').textContent = \`Period: \${startDate} - \${endDate}\`;
            
            // Position the tooltip
            tooltip.style.left = \`\${event.pageX + 10}px\`;
            tooltip.style.top = \`\${event.pageY + 10}px\`;
            
            // Show the tooltip
            tooltip.classList.add('visible');
          }
          
          function hideTooltip() {
            document.getElementById('tooltip').classList.remove('visible');
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error generating Gantt page:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
      </head>
      <body>
        <h1>Error generating Gantt chart</h1>
        <p>An error occurred while generating the Gantt chart. Please try again later.</p>
        <pre>${error.message}</pre>
      </body>
      </html>
    `);
  }
};

function calculateTimelineData(projectsData) {
  // Calculate timeline dates
  const dates = projectsData
    .flatMap(p => [
      p['Previsional launch date'] ? new Date(p['Previsional launch date']) : null,
      p['Previsional final date'] ? new Date(p['Previsional final date']) : null
    ])
    .filter(d => d && !isNaN(d.getTime()));
  
  // If no valid dates, create a default timeline for the current year
  let earliest = new Date();
  let latest = new Date();
  
  if (dates.length > 0) {
    earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    latest = new Date(Math.max(...dates.map(d => d.getTime())));
  } else {
    earliest = new Date(new Date().getFullYear(), 0, 1); // Jan 1st of current year
    latest = new Date(new Date().getFullYear(), 11, 31); // Dec 31st of current year
  }
  
  // Add buffer months
  earliest.setMonth(earliest.getMonth() - 1);
  latest.setMonth(latest.getMonth() + 1);
  
  // Generate months for the timeline
  const months = [];
  const current = new Date(earliest);
  current.setDate(1); // Start at first day of month
  
  while (current <= latest) {
    months.push({
      date: current.toISOString(),
      label: current.toLocaleString('default', { month: 'short', year: '2-digit' })
    });
    current.setMonth(current.getMonth() + 1);
  }
  
  // Calculate timeline positions for each project
  const timelineProjects = projectsData.map(project => {
    // Parse dates
    const startDate = project['Previsional launch date'] ? new Date(project['Previsional launch date']) : null;
    const endDate = project['Previsional final date'] ? new Date(project['Previsional final date']) : null;
    
    // Calculate timeline position
    let position = { left: '0%', width: '0%' };
    
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const timelineDuration = latest.getTime() - earliest.getTime();
      const startOffset = Math.max(0, startDate.getTime() - earliest.getTime());
      const duration = Math.max(0, endDate.getTime() - startDate.getTime());
      
      const leftPercent = (startOffset / timelineDuration) * 100;
      const widthPercent = (duration / timelineDuration) * 100;
      
      position = {
        left: `${Math.min(100, Math.max(0, leftPercent))}%`,
        width: `${Math.min(100 - leftPercent, Math.max(0.5, widthPercent))}%`
      };
    }
    
    return {
      id: project['Project ID'],
      name: project['Project Name'],
      client: project['Client'],
      status: project['Status'],
      imageCount: parseInt(project['Qty'], 10) || 0,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      position
    };
  });
  
  // Calculate today marker position
  const today = new Date();
  let todayPosition = null;
  
  if (today >= earliest && today <= latest) {
    const timelineDuration = latest.getTime() - earliest.getTime();
    const todayOffset = today.getTime() - earliest.getTime();
    todayPosition = {
      left: `${(todayOffset / timelineDuration) * 100}%`
    };
  }
  
  return {
    timeline: {
      startDate: earliest.toISOString(),
      endDate: latest.toISOString(),
      months,
      todayPosition
    },
    projects: timelineProjects
  };
} 