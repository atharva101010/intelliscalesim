import { useState } from 'react';
import { Plus, Play, Pause, Trash2, Edit, Settings, Users, Clock, Activity, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const SimulationManagerPage = () => {
  const { simulations, addSimulation, deleteSimulation, updateSimulation } = useData();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSimulation, setEditingSimulation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'kubernetes',
    duration: '1',
    minReplicas: 1,
    maxReplicas: 10,
    cpuThreshold: 70,
    memoryThreshold: 80,
    assignToAll: true,
    selectedStudents: []
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addSimulation({
      name: formData.name,
      description: formData.description,
      students: formData.assignToAll ? 43 : formData.selectedStudents.length,
      duration: `${formData.duration} week${formData.duration > 1 ? 's' : ''}`,
      type: formData.type,
      minReplicas: formData.minReplicas,
      maxReplicas: formData.maxReplicas
    });
    
    setShowCreateModal(false);
    resetForm();
  };

  const handleEdit = (simulation) => {
    setEditingSimulation(simulation);
    setFormData({
      name: simulation.name,
      description: simulation.description,
      type: simulation.type,
      duration: simulation.duration.split(' ')[0],
      minReplicas: simulation.minReplicas,
      maxReplicas: simulation.maxReplicas,
      cpuThreshold: 70,
      memoryThreshold: 80,
      assignToAll: true,
      selectedStudents: []
    });
    setShowEditModal(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateSimulation(editingSimulation.id, {
      name: formData.name,
      description: formData.description,
      duration: `${formData.duration} week${formData.duration > 1 ? 's' : ''}`,
      type: formData.type,
      minReplicas: formData.minReplicas,
      maxReplicas: formData.maxReplicas
    });
    
    setShowEditModal(false);
    setEditingSimulation(null);
    resetForm();
  };

  const handleToggleStatus = (simulation) => {
    const newStatus = simulation.status === 'active' ? 'paused' : 'active';
    updateSimulation(simulation.id, { status: newStatus });
  };

  const handleDelete = (simulation) => {
    if (window.confirm(`Are you sure you want to delete "${simulation.name}"?`)) {
      deleteSimulation(simulation.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'kubernetes',
      duration: '1',
      minReplicas: 1,
      maxReplicas: 10,
      cpuThreshold: 70,
      memoryThreshold: 80,
      assignToAll: true,
      selectedStudents: []
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleUpdate : handleSubmit} style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Simulation Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          placeholder="e.g., Auto-Scaling Web Server"
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
          placeholder="Describe the simulation objectives..."
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

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Simulation Type *
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
        >
          <option value="kubernetes">Kubernetes Auto-Scaling</option>
          <option value="docker">Docker Swarm</option>
          <option value="loadbalancer">Load Balancer</option>
          <option value="custom">Custom Configuration</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Duration (weeks) *
        </label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleInputChange}
          required
          min="1"
          max="12"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
          Scaling Configuration
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#6b7280' }}>
              Min Replicas
            </label>
            <input
              type="number"
              name="minReplicas"
              value={formData.minReplicas}
              onChange={handleInputChange}
              min="1"
              max="50"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#6b7280' }}>
              Max Replicas
            </label>
            <input
              type="number"
              name="maxReplicas"
              value={formData.maxReplicas}
              onChange={handleInputChange}
              min={formData.minReplicas}
              max="100"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#6b7280' }}>
              CPU Threshold (%)
            </label>
            <input
              type="number"
              name="cpuThreshold"
              value={formData.cpuThreshold}
              onChange={handleInputChange}
              min="10"
              max="100"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#6b7280' }}>
              Memory Threshold (%)
            </label>
            <input
              type="number"
              name="memoryThreshold"
              value={formData.memoryThreshold}
              onChange={handleInputChange}
              min="10"
              max="100"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
        </div>
      </div>

      {!isEdit && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="assignToAll"
              checked={formData.assignToAll}
              onChange={handleInputChange}
              style={{ width: '1.25rem', height: '1.25rem' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              Assign to all students (43 students)
            </span>
          </label>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingSimulation(null);
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
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isEdit ? 'Update Simulation' : 'Create Simulation'}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Simulation Manager
          </h1>
          <p style={{ color: '#6b7280' }}>
            Create and manage auto-scaling simulations for your students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#7c3aed'}
          onMouseOut={(e) => e.target.style.background = '#8b5cf6'}
        >
          <Plus size={20} />
          Create Simulation
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Simulations', value: simulations.filter(s => s.status === 'active').length.toString(), icon: Activity, color: '#10b981' },
          { label: 'Total Students', value: '43', icon: Users, color: '#3b82f6' },
          { label: 'Avg. Completion', value: '78%', icon: Clock, color: '#f59e0b' }
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

      {/* Simulations List */}
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
            Your Simulations ({simulations.length})
          </h2>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {simulations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Settings size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No simulations yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Create Your First Simulation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {simulations.map((sim) => (
                <div
                  key={sim.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                          {sim.name}
                        </h3>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: `${getStatusColor(sim.status)}20`,
                          color: getStatusColor(sim.status)
                        }}>
                          {sim.status.charAt(0).toUpperCase() + sim.status.slice(1)}
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        {sim.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={16} /> {sim.students} students
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={16} /> {sim.duration}
                        </span>
                        <span>Created: {sim.created}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(sim);
                        }}
                        style={{
                          padding: '0.5rem',
                          background: sim.status === 'active' ? '#fef3c7' : '#d1fae5',
                          color: sim.status === 'active' ? '#f59e0b' : '#10b981',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={sim.status === 'active' ? 'Pause' : 'Start'}
                      >
                        {sim.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(sim);
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
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(sim);
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
          )}
        </div>
      </div>

      {/* Create Simulation Modal */}
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                Create New Simulation
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
                  borderRadius: '0.25rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                <X size={24} />
              </button>
            </div>
            {renderForm(false)}
          </div>
        </div>
      )}

      {/* Edit Simulation Modal */}
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                Edit Simulation
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSimulation(null);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                <X size={24} />
              </button>
            </div>
            {renderForm(true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationManagerPage;
