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
    
    // Return formatted timeline data
    res.json({
      timeline: {
        startDate: earliest.toISOString(),
        endDate: latest.toISOString(),
        months,
        todayPosition
      },
      projects: timelineProjects
    });
  } catch (error) {
    console.error('Error generating timeline data:', error);
    res.status(500).json({ error: 'Failed to generate timeline data' });
  }
}; 