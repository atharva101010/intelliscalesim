import { useState } from 'react';
import { Plus, BookOpen, Code, FileText, CheckSquare, Trash2, Edit, Eye, Clock, Users, Calendar, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const AssignmentBuilderPage = () => {
  const { assignments, simulations, addAssignment, deleteAssignment, updateAssignment } = useData();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'lab',
    dueDate: '',
    points: 100,
    attachSimulation: false,
    selectedSimulation: '',
    modules: []
  });

  const [currentModule, setCurrentModule] = useState({
    type: 'reading',
    title: '',
    content: '',
    duration: 30
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setCurrentModule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addModule = () => {
    if (currentModule.title) {
      setFormData(prev => ({
        ...prev,
        modules: [...prev.modules, { ...currentModule, id: Date.now() }]
      }));
      setCurrentModule({
        type: 'reading',
        title: '',
        content: '',
        duration: 30
      });
    }
  };

  const removeModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'lab',
      dueDate: '',
      points: 100,
      attachSimulation: false,
      selectedSimulation: '',
      modules: []
    });
    setCurrentModule({
      type: 'reading',
      title: '',
      content: '',
      duration: 30
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const typeLabel = formData.type === 'lab' ? 'Lab' : 
                     formData.type === 'quiz' ? 'Quiz' : 'Lab + Quiz';
    
    addAssignment({
      title: formData.title,
      description: formData.description,
      type: typeLabel,
      dueDate: formData.dueDate,
      points: parseInt(formData.points),
      modules: formData.modules,
      simulationId: formData.attachSimulation ? formData.selectedSimulation : null
    });
    
    setShowCreateModal(false);
    resetForm();
  };

  const handleView = (assignment) => {
    setViewingAssignment(assignment);
    setShowViewModal(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    
    const typeValue = assignment.type === 'Lab' ? 'lab' :
                     assignment.type === 'Quiz' ? 'quiz' : 'combined';
    
    setFormData({
      title: assignment.title,
      description: assignment.description,
      type: typeValue,
      dueDate: assignment.dueDate,
      points: assignment.points,
      attachSimulation: assignment.simulationId ? true : false,
      selectedSimulation: assignment.simulationId || '',
      modules: assignment.modules || []
    });
    setShowEditModal(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    
    const typeLabel = formData.type === 'lab' ? 'Lab' : 
                     formData.type === 'quiz' ? 'Quiz' : 'Lab + Quiz';
    
    updateAssignment(editingAssignment.id, {
      title: formData.title,
      description: formData.description,
      type: typeLabel,
      dueDate: formData.dueDate,
      points: parseInt(formData.points),
      modules: formData.modules,
      simulationId: formData.attachSimulation ? formData.selectedSimulation : null
    });
    
    setShowEditModal(false);
    setEditingAssignment(null);
    resetForm();
  };

  const handleDelete = (assignment) => {
    if (window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      deleteAssignment(assignment.id);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#10b981' : '#6b7280';
  };

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

  const renderAssignmentForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleUpdate : handleSubmit} style={{ padding: '1.5rem' }}>
      {/* Same form content as before */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Assignment Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="e.g., Introduction to Kubernetes Auto-Scaling"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="Describe the assignment objectives..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem'
            }}
          >
            <option value="lab">Lab Only</option>
            <option value="quiz">Quiz Only</option>
            <option value="combined">Lab + Quiz</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            Due Date *
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            Points *
          </label>
          <input
            type="number"
            name="points"
            value={formData.points}
            onChange={handleInputChange}
            required
            min="0"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="attachSimulation"
            checked={formData.attachSimulation}
            onChange={handleInputChange}
            style={{ width: '1.25rem', height: '1.25rem' }}
          />
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e' }}>
            Attach to existing simulation
          </span>
        </label>
        {formData.attachSimulation && (
          <select
            name="selectedSimulation"
            value={formData.selectedSimulation}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d97706',
              borderRadius: '0.5rem',
              marginTop: '0.75rem'
            }}
          >
            <option value="">Select simulation...</option>
            {simulations.map(sim => (
              <option key={sim.id} value={sim.id}>{sim.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
          {isEdit ? 'Edit Learning Modules' : 'Add Learning Modules'}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
          <select
            name="type"
            value={currentModule.type}
            onChange={handleModuleChange}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem'
            }}
          >
            <option value="reading">📖 Reading</option>
            <option value="video">🎥 Video</option>
            <option value="lab">💻 Lab Exercise</option>
            <option value="quiz">✅ Quiz</option>
          </select>

          <input
            type="text"
            name="title"
            value={currentModule.title}
            onChange={handleModuleChange}
            placeholder="Module title..."
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem'
            }}
          />
        </div>

        <button
          type="button"
          onClick={addModule}
          disabled={!currentModule.title}
          style={{
            padding: '0.5rem 1rem',
            background: currentModule.title ? '#10b981' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: currentModule.title ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
        >
          + Add Module
        </button>

        {formData.modules.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {formData.modules.map((module, idx) => {
              const ModuleIcon = getModuleIcon(module.type);
              return (
                <div
                  key={module.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ModuleIcon size={16} color="#6b7280" />
                    <span style={{ fontSize: '0.875rem' }}>
                      {idx + 1}. {module.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModule(module.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingAssignment(null);
            } else {
              setShowCreateModal(false);
            }
            resetForm();
          }}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isEdit ? 'Update Assignment' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      {/* Header - Same as before */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Assignment Builder
          </h1>
          <p style={{ color: '#6b7280' }}>
            Create structured learning modules with readings, labs, and assessments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#d97706'}
          onMouseOut={(e) => e.target.style.background = '#f59e0b'}
        >
          <Plus size={20} />
          Create Assignment
        </button>
      </div>

      {/* Stats Cards - Same as before */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Assignments', value: assignments.length.toString(), icon: FileText, color: '#f59e0b' },
          { label: 'Active Assignments', value: assignments.filter(a => a.status === 'active').length.toString(), icon: CheckSquare, color: '#10b981' },
          { label: 'Avg. Submission', value: '65%', icon: Users, color: '#3b82f6' }
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

      {/* Assignments List */}
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
            Your Assignments ({assignments.length})
          </h2>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
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
                        background: `${getStatusColor(assignment.status)}20`,
                        color: getStatusColor(assignment.status)
                      }}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: '#ede9fe',
                        color: '#7c3aed'
                      }}>
                        {assignment.type}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={16} /> Due: {assignment.dueDate}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={16} /> {assignment.submitted}/{assignment.students} submitted
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={16} /> {assignment.modules.length} modules
                      </span>
                      <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                        {assignment.points} points
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(assignment);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#dbeafe',
                        color: '#3b82f6',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(assignment);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#fef3c7',
                        color: '#f59e0b',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(assignment);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                Create New Assignment
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={24} />
              </button>
            </div>
            {renderAssignmentForm(false)}
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                Edit Assignment
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAssignment(null);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={24} />
              </button>
            </div>
            {renderAssignmentForm(true)}
          </div>
        </div>
      )}

      {/* View Assignment Modal */}
      {showViewModal && viewingAssignment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, marginBottom: '0.5rem' }}>
                  {viewingAssignment.title}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: `${getStatusColor(viewingAssignment.status)}20`,
                    color: getStatusColor(viewingAssignment.status)
                  }}>
                    {viewingAssignment.status.charAt(0).toUpperCase() + viewingAssignment.status.slice(1)}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: '#ede9fe',
                    color: '#7c3aed'
                  }}>
                    {viewingAssignment.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingAssignment(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Description
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                  {viewingAssignment.description}
                </p>
              </div>

              {/* Assignment Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Due Date</p>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>
                    <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    {viewingAssignment.dueDate}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Points</p>
                  <p style={{ fontWeight: '600', color: '#f59e0b', fontSize: '1.25rem' }}>
                    {viewingAssignment.points} points
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Students Assigned</p>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>
                    <Users size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    {viewingAssignment.students} students
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Submissions</p>
                  <p style={{ fontWeight: '600', color: '#10b981' }}>
                    {viewingAssignment.submitted}/{viewingAssignment.students} submitted
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                      ({Math.round((viewingAssignment.submitted / viewingAssignment.students) * 100)}%)
                    </span>
                  </p>
                </div>
              </div>

              {/* Learning Modules */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                  Learning Modules ({viewingAssignment.modules.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {viewingAssignment.modules.map((module, idx) => {
                    const ModuleIcon = getModuleIcon(module.type);
                    return (
                      <div
                        key={module.id}
                        style={{
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}
                      >
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '0.5rem',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}>
                          {getModuleEmoji(module.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                            {idx + 1}. {module.title}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>
                            {module.type}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingAssignment(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingAssignment);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Edit size={18} />
                  Edit Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentBuilderPage;
