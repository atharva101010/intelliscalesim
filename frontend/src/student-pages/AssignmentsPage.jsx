import { useState } from 'react';
import { BookOpen, Code, CheckSquare, Eye, Clock, Calendar, Award, ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const AssignmentsPage = () => {
  const { assignments } = useData();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);

  const getModuleIcon = (type) => {
    switch (type) {
      case 'reading': return BookOpen;
      case 'lab': return Code;
      case 'quiz': return CheckSquare;
      case 'video': return Eye;
      default: return FileText;
    }
  };

  const getModuleEmoji = (type) => {
    switch (type) {
      case 'reading': return '📖';
      case 'lab': return '💻';
      case 'quiz': return '✅';
      case 'video': return '🎥';
      default: return '📄';
    }
  };

  const getStatusColor = (assignment) => {
    const today = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (assignment.submitted >= assignment.students) return '#10b981';
    if (dueDate < today) return '#ef4444';
    if ((dueDate - today) / (1000 * 60 * 60 * 24) <= 3) return '#f59e0b';
    return '#3b82f6';
  };

  const getStatusLabel = (assignment) => {
    const today = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (assignment.submitted >= assignment.students) return 'Submitted';
    if (dueDate < today) return 'Overdue';
    if ((dueDate - today) / (1000 * 60 * 60 * 24) <= 3) return 'Due Soon';
    return 'Active';
  };

  const handleStartAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setCurrentModuleIndex(0);
    setCompletedModules([]);
  };

  const handleNextModule = () => {
    setCompletedModules([...completedModules, currentModuleIndex]);
    if (currentModuleIndex < selectedAssignment.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handleSubmitAssignment = () => {
    alert('Assignment submitted successfully! 🎉');
    setSelectedAssignment(null);
    setCurrentModuleIndex(0);
    setCompletedModules([]);
  };

  if (selectedAssignment) {
    const currentModule = selectedAssignment.modules[currentModuleIndex];
    const progress = ((completedModules.length / selectedAssignment.modules.length) * 100).toFixed(0);

    return (
      <div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <button
            onClick={() => setSelectedAssignment(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}
          >
            <ArrowLeft size={16} />
            Back to Assignments
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                {selectedAssignment.title}
              </h1>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <span><Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />Due: {selectedAssignment.dueDate}</span>
                <span><Award size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />{selectedAssignment.points} points</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Progress</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{progress}%</p>
            </div>
          </div>

          <div style={{ marginTop: '1rem', background: '#e5e7eb', borderRadius: '9999px', height: '0.5rem', overflow: 'hidden' }}>
            <div style={{ background: '#10b981', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', minHeight: '500px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem' }}>
            Module {currentModuleIndex + 1}: {currentModule.title}
          </h2>
          
          <div style={{ marginBottom: '2rem', padding: '2rem', background: '#f9fafb', borderRadius: '0.75rem', minHeight: '300px' }}>
            <p style={{ lineHeight: '1.8', color: '#4b5563' }}>
              This is the content area for the {currentModule.type} module: {currentModule.title}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            {currentModuleIndex < selectedAssignment.modules.length - 1 ? (
              <button
                onClick={handleNextModule}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Next Module
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmitAssignment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <CheckSquare size={20} />
                Submit Assignment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          My Assignments
        </h1>
        <p style={{ color: '#6b7280' }}>
          View and complete your assigned learning modules
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Assignments', value: assignments.length.toString(), color: '#7c3aed', icon: FileText },
          { label: 'In Progress', value: assignments.filter(a => a.status === 'active').length.toString(), color: '#3b82f6', icon: Clock },
          { label: 'Completed', value: '0', color: '#10b981', icon: CheckSquare }
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.5rem',
              background: `${stat.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon style={{ color: stat.color }} size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{stat.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
            All Assignments ({assignments.length})
          </h2>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No assignments yet. Your teacher will assign learning modules soon!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignments.map((assignment) => {
                const statusColor = getStatusColor(assignment);
                const statusLabel = getStatusLabel(assignment);

                return (
                  <div
                    key={assignment.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                            {assignment.title}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: `${statusColor}20`,
                            color: statusColor
                          }}>
                            {statusLabel}
                          </span>
                        </div>

                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          {assignment.description}
                        </p>

                        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={16} /> Due: {assignment.dueDate}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <BookOpen size={16} /> {assignment.modules.length} modules
                          </span>
                          <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                            {assignment.points} points
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartAssignment(assignment)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#7c3aed',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Start Assignment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
