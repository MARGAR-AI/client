module.exports = (req, res) => {
  const sampleAvailability = [
    {
      "Provider's ID": "P001",
      "Name": "Provider 1",
      "Role": "AI Creator",
      "Available Now": "TRUE",
      "Available In Future": "TRUE",
      "Start Date": new Date("2025-03-01"),
      "End Date": new Date("2025-12-31"),
      "No longer Available": "FALSE",
      "Duration": 220,
      "Capacity": 440,
      "Skills": ["3D Modeling", "Texturing", "Lighting"],
      "Experience": "3 years",
      "Total Assignments": 5,
      "Current Capacity": 60,
      "Max Capacity": 100
    },
    {
      "Provider's ID": "P002",
      "Name": "Provider 2",
      "Role": "AI Creator",
      "Available Now": "TRUE",
      "Available In Future": "TRUE",
      "Start Date": new Date("2025-03-01"),
      "End Date": new Date("2025-12-31"),
      "No longer Available": "FALSE",
      "Duration": 220,
      "Capacity": 440,
      "Skills": ["3D Modeling", "Animation"],
      "Experience": "2 years",
      "Total Assignments": 3,
      "Current Capacity": 40,
      "Max Capacity": 100
    },
    {
      "Provider's ID": "P003",
      "Name": "Provider 3",
      "Role": "AI Creator",
      "Available Now": "TRUE",
      "Available In Future": "TRUE",
      "Start Date": new Date("2025-03-01"),
      "End Date": new Date("2025-12-31"),
      "No longer Available": "FALSE",
      "Duration": 220,
      "Capacity": 440,
      "Skills": ["Texturing", "Lighting", "Animation"],
      "Experience": "4 years",
      "Total Assignments": 7,
      "Current Capacity": 70,
      "Max Capacity": 100
    }
  ];
  
  res.status(200).json(sampleAvailability);
}; 