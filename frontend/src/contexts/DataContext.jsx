import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

// Default initial data
const DEFAULT_SIMULATIONS = [
  {
    id: 1,
    name: 'Auto-Scaling Web Server',
    description: 'Kubernetes-based auto-scaling simulation',
    status: 'active',
    students: 25,
    created: '2025-10-15',
    duration: '2 weeks',
    type: 'kubernetes',
    minReplicas: 2,
    maxReplicas: 10
  },
  {
    id: 2,
    name: 'Load Balancer Configuration',
    description: 'NGINX load balancing exercise',
    status: 'paused',
    students: 18,
    created: '2025-10-10',
    duration: '1 week',
    type: 'docker',
    minReplicas: 1,
    maxReplicas: 5
  }
];

const DEFAULT_ASSIGNMENTS = [
  {
    id: 1,
    title: 'Introduction to Kubernetes Auto-Scaling',
    description: 'Learn HPA fundamentals',
    type: 'Lab + Quiz',
    dueDate: '2025-10-25',
    points: 100,
    students: 43,
    submitted: 28,
    status: 'active',
    modules: [
      { id: 1, type: 'reading', title: 'HPA Basics' },
      { id: 2, type: 'video', title: 'HPA Demo' },
      { id: 3, type: 'lab', title: 'Configure HPA' }
    ]
  },
  {
    id: 2,
    title: 'Docker Container Optimization',
    description: 'Optimize Docker containers',
    type: 'Lab',
    dueDate: '2025-10-30',
    points: 75,
    students: 43,
    submitted: 15,
    status: 'active',
    modules: [
      { id: 1, type: 'reading', title: 'Docker Best Practices' },
      { id: 2, type: 'lab', title: 'Optimize Your Container' }
    ]
  }
];

export const DataProvider = ({ children }) => {
  // ==================== SIMULATIONS ====================
  // Load from localStorage or use defaults
  const [simulations, setSimulations] = useState(() => {
    const saved = localStorage.getItem('intelliscalesim_simulations');
    return saved ? JSON.parse(saved) : DEFAULT_SIMULATIONS;
  });

  // Save to localStorage whenever simulations change
  useEffect(() => {
    localStorage.setItem('intelliscalesim_simulations', JSON.stringify(simulations));
  }, [simulations]);

  const addSimulation = (simulation) => {
    const newSimulation = {
      ...simulation,
      id: Date.now(),
      status: 'active',
      created: new Date().toISOString().split('T')[0]
    };
    setSimulations(prev => [...prev, newSimulation]);
    return newSimulation;
  };

  const updateSimulation = (id, updates) => {
    setSimulations(prev =>
      prev.map(sim => (sim.id === id ? { ...sim, ...updates } : sim))
    );
  };

  const deleteSimulation = (id) => {
    setSimulations(prev => prev.filter(sim => sim.id !== id));
  };

  // ==================== ASSIGNMENTS ====================
  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem('intelliscalesim_assignments');
    return saved ? JSON.parse(saved) : DEFAULT_ASSIGNMENTS;
  });

  useEffect(() => {
    localStorage.setItem('intelliscalesim_assignments', JSON.stringify(assignments));
  }, [assignments]);

  const addAssignment = (assignment) => {
    const newAssignment = {
      ...assignment,
      id: Date.now(),
      status: 'active',
      students: 43,
      submitted: 0
    };
    setAssignments(prev => [...prev, newAssignment]);
    return newAssignment;
  };

  const updateAssignment = (id, updates) => {
    setAssignments(prev =>
      prev.map(asgn => (asgn.id === id ? { ...asgn, ...updates } : asgn))
    );
  };

  const deleteAssignment = (id) => {
    setAssignments(prev => prev.filter(asgn => asgn.id !== id));
  };

  // ==================== CONTAINERS (for students) ====================
  const [containers, setContainers] = useState(() => {
    const saved = localStorage.getItem('intelliscalesim_containers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('intelliscalesim_containers', JSON.stringify(containers));
  }, [containers]);

  const addContainer = (container) => {
    const newContainer = {
      ...container,
      id: Date.now(),
      status: 'running',
      created: new Date().toISOString()
    };
    setContainers(prev => [...prev, newContainer]);
    return newContainer;
  };

  const updateContainer = (id, updates) => {
    setContainers(prev =>
      prev.map(cont => (cont.id === id ? { ...cont, ...updates } : cont))
    );
  };

  const deleteContainer = (id) => {
    setContainers(prev => prev.filter(cont => cont.id !== id));
  };

  // ==================== ANALYTICS DATA ====================
  const [analyticsData, setAnalyticsData] = useState(() => {
    const saved = localStorage.getItem('intelliscalesim_analytics');
    return saved ? JSON.parse(saved) : {
      totalStudents: 43,
      activeStudents: 35,
      completionRate: 78,
      avgPerformance: 82
    };
  });

  useEffect(() => {
    localStorage.setItem('intelliscalesim_analytics', JSON.stringify(analyticsData));
  }, [analyticsData]);

  const updateAnalyticsData = (data) => {
    setAnalyticsData(prev => ({ ...prev, ...data }));
  };

  // ==================== RESET FUNCTION (for testing) ====================
  const resetAllData = () => {
    localStorage.removeItem('intelliscalesim_simulations');
    localStorage.removeItem('intelliscalesim_assignments');
    localStorage.removeItem('intelliscalesim_containers');
    localStorage.removeItem('intelliscalesim_analytics');
    setSimulations(DEFAULT_SIMULATIONS);
    setAssignments(DEFAULT_ASSIGNMENTS);
    setContainers([]);
    setAnalyticsData({
      totalStudents: 43,
      activeStudents: 35,
      completionRate: 78,
      avgPerformance: 82
    });
  };

  // ==================== CONTEXT VALUE ====================
  const value = {
    // Simulations
    simulations,
    addSimulation,
    updateSimulation,
    deleteSimulation,
    
    // Assignments
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    
    // Containers
    containers,
    addContainer,
    updateContainer,
    deleteContainer,
    
    // Analytics
    analyticsData,
    updateAnalyticsData,
    
    // Utility
    resetAllData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
