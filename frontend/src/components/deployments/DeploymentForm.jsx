import { useState } from 'react';
import { Container, GitBranch, Loader, CheckCircle, XCircle, Rocket, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { deployDockerImage, deployGitHub } from '../../api/api';

const DeploymentForm = () => {
  const [deploymentType, setDeploymentType] = useState('docker');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [dockerForm, setDockerForm] = useState({
    image_name: '',
    container_name: '',
    port: 8080,
    username: '',
    password: ''
  });

  const [githubForm, setGithubForm] = useState({
    repo_url: '',
    branch: 'main',
    container_name: '',
    port: 8080,
    username: '',
    access_token: ''
  });

  const handleDockerDeploy = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await deployDockerImage(dockerForm);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubDeploy = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await deployGitHub(githubForm);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Tab Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        background: 'white',
        padding: '0.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setDeploymentType('docker')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            borderRadius: '8px',
            background: deploymentType === 'docker' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'transparent',
            color: deploymentType === 'docker' ? 'white' : '#6b7280',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Container size={20} />
          Docker Hub
        </button>
        <button
          onClick={() => setDeploymentType('github')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            borderRadius: '8px',
            background: deploymentType === 'github' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'transparent',
            color: deploymentType === 'github' ? 'white' : '#6b7280',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <GitBranch size={20} />
          GitHub Repository
        </button>
      </div>

      {/* Docker Hub Form */}
      {deploymentType === 'docker' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #667eea30'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#667eea',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Container size={24} />
              Docker Hub Deployment
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              Deploy containerized applications directly from Docker Hub. Supports both public and private images.
            </p>
            
            {/* Documentation Link */}
            <Link 
              to="/documentation" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <BookOpen size={18} />
              Read Documentation First
              <ExternalLink size={16} />
            </Link>
          </div>

          <form onSubmit={handleDockerDeploy}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Docker Image Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., nginx:latest or username/myapp:1.0"
                value={dockerForm.image_name}
                onChange={(e) => setDockerForm({ ...dockerForm, image_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Container Name
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={dockerForm.container_name}
                  onChange={(e) => setDockerForm({ ...dockerForm, container_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                  onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Port *
                </label>
                <input
                  type="number"
                  required
                  value={dockerForm.port}
                  onChange={(e) => setDockerForm({ ...dockerForm, port: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                  onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
                />
              </div>
            </div>

            <div style={{
              background: '#fef3c7',
              padding: '1.25rem',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              border: '1px solid #fbbf2420'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#92400e',
                marginBottom: '0.75rem'
              }}>
                🔒 Private Image Credentials (Optional)
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '1rem' }}>
                For private Docker Hub images, provide your username and password/token
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#78350f',
                    fontSize: '0.9rem'
                  }}>
                    Docker Hub Username
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    value={dockerForm.username}
                    onChange={(e) => setDockerForm({ ...dockerForm, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #fbbf24',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#78350f',
                    fontSize: '0.9rem'
                  }}>
                    Password / Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="•••••••••"
                    value={dockerForm.password}
                    onChange={(e) => setDockerForm({ ...dockerForm, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #fbbf24',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket size={24} />
                  Deploy Application
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* GitHub Form */}
      {deploymentType === 'github' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #667eea30'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#667eea',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <GitBranch size={24} />
              GitHub Repository Deployment
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              Build and deploy applications directly from your GitHub repository. Dockerfile required in the repo root.
            </p>
            
            {/* Documentation Link */}
            <Link 
              to="/documentation" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <BookOpen size={18} />
              Read Documentation First
              <ExternalLink size={16} />
            </Link>
          </div>

          <form onSubmit={handleGitHubDeploy}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Repository URL *
              </label>
              <input
                type="text"
                required
                placeholder="https://github.com/username/repository"
                value={githubForm.repo_url}
                onChange={(e) => setGithubForm({ ...githubForm, repo_url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Branch *
                </label>
                <input
                  type="text"
                  required
                  value={githubForm.branch}
                  onChange={(e) => setGithubForm({ ...githubForm, branch: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                  onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Container Name
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated"
                  value={githubForm.container_name}
                  onChange={(e) => setGithubForm({ ...githubForm, container_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                  onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Port *
                </label>
                <input
                  type="number"
                  required
                  value={githubForm.port}
                  onChange={(e) => setGithubForm({ ...githubForm, port: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid #667eea'}
                  onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
                />
              </div>
            </div>

            <div style={{
              background: '#fef3c7',
              padding: '1.25rem',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              border: '1px solid #fbbf2420'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#92400e',
                marginBottom: '0.75rem'
              }}>
                🔒 Private Repository Access (Optional)
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '1rem' }}>
                For private repositories, provide your GitHub username and personal access token
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#78350f',
                    fontSize: '0.9rem'
                  }}>
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    value={githubForm.username}
                    onChange={(e) => setGithubForm({ ...githubForm, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #fbbf24',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#78350f',
                    fontSize: '0.9rem'
                  }}>
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_••••••••••••••••"
                    value={githubForm.access_token}
                    onChange={(e) => setGithubForm({ ...githubForm, access_token: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #fbbf24',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  Building & Deploying...
                </>
              ) : (
                <>
                  <Rocket size={24} />
                  Deploy from GitHub
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {result && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #10b98115 0%, #05966925 100%)',
          borderRadius: '12px',
          border: '2px solid #10b981',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <CheckCircle size={28} style={{ color: '#059669', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#065f46', marginBottom: '0.5rem' }}>
              Deployment Successful! 🎉
            </h4>
            <p style={{ color: '#047857', marginBottom: '0.75rem' }}>
              Container: <strong>{result.container_name}</strong>
            </p>
            {result.access_url && (
              <a
                href={result.access_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0284c7',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}
              >
                Open Application →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #ef444415 0%, #dc262625 100%)',
          borderRadius: '12px',
          border: '2px solid #ef4444',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <XCircle size={28} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#991b1b', marginBottom: '0.5rem' }}>
              Deployment Failed
            </h4>
            <p style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentForm;
