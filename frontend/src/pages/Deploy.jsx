import React, { useState, useEffect } from 'react';
import { Rocket, Package, Github, Server, Play, Trash2, RefreshCw, BookOpen, ExternalLink, Lock } from 'lucide-react';
import { deploymentApi } from '../services/deploymentApi';
import { metricsApi } from '../services/metricsApi';
import { useNavigate } from 'react-router-dom';

const Deploy = () => {
  const navigate = useNavigate();
  const [deploymentType, setDeploymentType] = useState('docker');
  const [isDeploying, setIsDeploying] = useState(false);
  const [containers, setContainers] = useState([]);
  
  const [dockerForm, setDockerForm] = useState({
    imageName: '',
    containerName: '',
    port: '',
    username: '',
    password: ''
  });
  
  const [githubForm, setGithubForm] = useState({
    repoUrl: '',
    containerName: '',
    port: '',
    dockerfilePath: 'Dockerfile',
    username: '',
    token: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsResponse = await metricsApi.getContainersMetrics();
        if (metricsResponse.success) setContainers(metricsResponse.data.containers);
      } catch (e) { }
    };
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, []);

  const handleDockerDeploy = async (e) => {
    e.preventDefault();
    setIsDeploying(true);
    try {
      const credentials = (dockerForm.username || dockerForm.password) ? {
        username: dockerForm.username,
        password: dockerForm.password
      } : null;

      const result = await deploymentApi.deployDockerImage(
        dockerForm.imageName,
        dockerForm.containerName,
        dockerForm.port ? parseInt(dockerForm.port) : null,
        'student',
        'Student',
        credentials
      );

      if (result.success) {
        alert(`✅ Deployed!\nContainer: ${result.data.containerName}\nPort: ${result.data.port}\nURL: ${result.data.url}`);
        setDockerForm({ imageName: '', containerName: '', port: '', username: '', password: '' });
      } else {
        alert(`❌ Deployment failed: ${result.message}`);
      }
    } catch (err) {
      alert(`❌ Deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleGithubDeploy = async (e) => {
    e.preventDefault();
    setIsDeploying(true);
    try {
      const credentials = (githubForm.username || githubForm.token) ? {
        username: githubForm.username,
        token: githubForm.token
      } : null;

      const result = await deploymentApi.deployFromGitHub(
        githubForm.repoUrl,
        githubForm.containerName,
        githubForm.port ? parseInt(githubForm.port) : null,
        'student',
        'Student',
        githubForm.dockerfilePath,
        credentials
      );

      if (result.success) {
        alert(`✅ Deployed!\nContainer: ${result.data.containerName}\nPort: ${result.data.port}`);
        setGithubForm({ repoUrl: '', containerName: '', port: '', dockerfilePath: 'Dockerfile', username: '', token: '' });
      } else {
        alert(`❌ Deployment failed: ${result.message}`);
      }
    } catch (err) {
      alert(`❌ Deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRemoveContainer = async (containerId, containerName) => {
    if (!confirm(`Remove ${containerName}?`)) return;
    try {
      const result = await deploymentApi.removeContainer(containerId, true);
      if (!result.success) alert(`❌ Failed: ${result.message}`);
    } catch (e) {
      alert(`❌ Error: ${e.message}`);
    }
  };

  const navigateToDocumentation = (tab) => {
    navigate('/student/documentation', { state: { activeTab: tab } });
  };

  return (
    <div style={{ padding: '30px', minHeight: '100vh', background: '#f3f4f6' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); }}
      `}</style>

      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
            <Rocket size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Deploy Application</h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>Deploy from Docker Hub or GitHub (public or private)</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
          <button onClick={() => setDeploymentType('docker')}
            style={{ padding: '12px 24px', background: deploymentType === 'docker' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: deploymentType === 'docker' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} /> Docker Hub
          </button>
          <button onClick={() => setDeploymentType('github')}
            style={{ padding: '12px 24px', background: deploymentType === 'github' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: deploymentType === 'github' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Github size={20} /> GitHub
          </button>
        </div>

        {deploymentType === 'docker' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
              border: '2px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={24} style={{ color: '#92400e' }} />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>📦 Docker Hub Deployment</h4>
                  <p style={{ fontSize: '13px', color: '#78350f' }}>Deploy images from Docker Hub. For private images, provide credentials below.</p>
                </div>
              </div>
              <button onClick={() => navigateToDocumentation('docker')}
                style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <BookOpen size={16} /> Read Documentation First <ExternalLink size={14} />
              </button>
            </div>

            <form onSubmit={handleDockerDeploy}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    Docker Image Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" required value={dockerForm.imageName}
                    onChange={(e) => setDockerForm({ ...dockerForm, imageName: e.target.value })}
                    placeholder="e.g., nginx:alpine or username/private-image:tag"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    Container Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" required value={dockerForm.containerName}
                    onChange={(e) => setDockerForm({ ...dockerForm, containerName: e.target.value })}
                    placeholder="e.g., my-web-app"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    Port (optional)
                  </label>
                  <input type="number" value={dockerForm.port}
                    onChange={(e) => setDockerForm({ ...dockerForm, port: e.target.value })}
                    placeholder="Auto-assign if empty"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div style={{ background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lock size={18} style={{ color: '#92400e' }} />
                    <span style={{ color: '#92400e', fontWeight: 'bold', fontSize: '15px' }}>🔒 Private Image Credentials (Optional)</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#78350f', marginBottom: '16px', lineHeight: '1.5' }}>
                    For private Docker Hub images, provide your credentials. <strong>These are used only for this deployment and are NOT stored anywhere.</strong>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#92400e' }}>
                        Docker Hub Username
                      </label>
                      <input type="text" value={dockerForm.username}
                        onChange={(e) => setDockerForm({ ...dockerForm, username: e.target.value })}
                        placeholder="username"
                        style={{ width: '100%', padding: '10px', border: '2px solid #fbbf24', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#92400e' }}>
                        Password / Access Token
                      </label>
                      <input type="password" value={dockerForm.password}
                        onChange={(e) => setDockerForm({ ...dockerForm, password: e.target.value })}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '10px', border: '2px solid #fbbf24', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isDeploying}
                  style={{ padding: '16px', background: isDeploying ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: isDeploying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  {isDeploying ? (<><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Deploying...</>) : (<><Play size={20} /> Deploy Container</>)}
                </button>
              </div>
            </form>
          </>
        )}

        {deploymentType === 'github' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
              border: '2px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Github size={24} style={{ color: '#92400e' }} />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>🔗 GitHub Repository Deployment</h4>
                  <p style={{ fontSize: '13px', color: '#78350f' }}>Build and deploy from GitHub. For private repos, provide credentials below.</p>
                </div>
              </div>
              <button onClick={() => navigateToDocumentation('github')}
                style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <BookOpen size={16} /> Read Documentation First <ExternalLink size={14} />
              </button>
            </div>

            <form onSubmit={handleGithubDeploy}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    GitHub Repository URL <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" required value={githubForm.repoUrl}
                    onChange={(e) => setGithubForm({ ...githubForm, repoUrl: e.target.value })}
                    placeholder="https://github.com/username/repo.git"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    Container Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" required value={githubForm.containerName}
                    onChange={(e) => setGithubForm({ ...githubForm, containerName: e.target.value })}
                    placeholder="e.g., my-app"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    Dockerfile Path
                  </label>
                  <input type="text" value={githubForm.dockerfilePath}
                    onChange={(e) => setGithubForm({ ...githubForm, dockerfilePath: e.target.value })}
                    placeholder="Dockerfile"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                    Port (optional)
                  </label>
                  <input type="number" value={githubForm.port}
                    onChange={(e) => setGithubForm({ ...githubForm, port: e.target.value })}
                    placeholder="Auto-assign if empty"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div style={{ background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lock size={18} style={{ color: '#92400e' }} />
                    <span style={{ color: '#92400e', fontWeight: 'bold', fontSize: '15px' }}>🔒 Private Repository Credentials (Optional)</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#78350f', marginBottom: '16px', lineHeight: '1.5' }}>
                    For private GitHub repositories, provide your credentials. <strong>These are used only for this deployment and are NOT stored anywhere.</strong>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#92400e' }}>
                        GitHub Username
                      </label>
                      <input type="text" value={githubForm.username}
                        onChange={(e) => setGithubForm({ ...githubForm, username: e.target.value })}
                        placeholder="username"
                        style={{ width: '100%', padding: '10px', border: '2px solid #fbbf24', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#92400e' }}>
                        Personal Access Token
                      </label>
                      <input type="password" value={githubForm.token}
                        onChange={(e) => setGithubForm({ ...githubForm, token: e.target.value })}
                        placeholder="ghp_••••••••••••••••"
                        style={{ width: '100%', padding: '10px', border: '2px solid #fbbf24', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isDeploying}
                  style={{ padding: '16px', background: isDeploying ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: isDeploying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  {isDeploying ? (<><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Building & Deploying...</>) : (<><Play size={20} /> Build & Deploy</>)}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={24} style={{ color: '#10b981' }} /> Your Deployed Containers ({containers.length})
        </h3>
        {containers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#f9fafb', borderRadius: '12px' }}>
            <Server size={48} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#9ca3af' }} />
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>No containers deployed yet</p>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Deploy your first container using the form above</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {containers.map((c) => (
              <div key={c.id} style={{ padding: '20px', background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', borderRadius: '12px', border: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>📦 {c.image}</div>
                  {c.metrics && c.metrics.running && (
                    <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '16px' }}>
                      <span>💻 CPU: <strong>{c.metrics.cpu}%</strong></span>
                      <span>🧠 Memory: <strong>{c.metrics.memory}%</strong></span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '13px', padding: '6px 12px',
                    background: c.status === 'running' ? '#dcfce7' : '#fee2e2',
                    color: c.status === 'running' ? '#047857' : '#991b1b',
                    borderRadius: '6px', fontWeight: 'bold'
                  }}>
                    {c.status === 'running' ? '✓ Running' : c.status}
                  </span>
                  <button onClick={() => handleRemoveContainer(c.fullId, c.name)}
                    style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Deploy;
