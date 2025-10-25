import { useState } from 'react';
import { BookOpen, Container, GitBranch, Code, FileCode, AlertTriangle, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';

const GitHubDeploymentDocs = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'docker-hub', label: 'Docker Hub', icon: Container },
    { id: 'github', label: 'GitHub', icon: GitBranch },
    { id: 'examples', label: 'Examples', icon: Code },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertTriangle }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '3rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BookOpen size={48} />
          <h1 style={{ fontSize: '2.75rem', fontWeight: '800', margin: 0 }}>
            Deployment Guide
          </h1>
        </div>
        <p style={{ fontSize: '1.25rem', opacity: 0.95, lineHeight: '1.8', margin: 0 }}>
          Complete guide for deploying applications via Docker Hub and GitHub
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto',
                minWidth: '150px',
                padding: '1rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#f3f4f6',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 6px 25px rgba(0,0,0,0.08)',
        minHeight: '500px'
      }}>
        {activeTab === 'overview' && <OverviewContent />}
        {activeTab === 'docker-hub' && <DockerHubContent />}
        {activeTab === 'github' && <GitHubContent />}
        {activeTab === 'examples' && <ExamplesContent />}
        {activeTab === 'troubleshooting' && <TroubleshootingContent />}
      </div>
    </div>
  );
};

// Overview Tab Content
const OverviewContent = () => (
  <div>
    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea', marginBottom: '1.5rem' }}>
      Two Ways to Deploy
    </h2>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Docker Hub Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
        border: '2px solid #667eea40',
        borderRadius: '16px',
        padding: '2rem',
        transition: 'transform 0.3s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <Container size={48} style={{ color: '#667eea', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea', marginBottom: '0.75rem' }}>
          Docker Hub
        </h3>
        <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '1rem' }}>
          Deploy pre-built Docker images from Docker Hub or private registries
        </p>
        <div style={{ color: '#667eea', fontWeight: '600', fontSize: '0.95rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>✓ Pre-built images</div>
          <div style={{ marginBottom: '0.5rem' }}>✓ Quick deployments</div>
          <div>✓ Testing existing containers</div>
        </div>
      </div>

      {/* GitHub Card */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f615 0%, #2563eb25 100%)',
        border: '2px solid #3b82f640',
        borderRadius: '16px',
        padding: '2rem',
        transition: 'transform 0.3s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <GitBranch size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.75rem' }}>
          GitHub Repository
        </h3>
        <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '1rem' }}>
          Build and deploy directly from your GitHub source code
        </p>
        <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.95rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>✓ Custom applications</div>
          <div style={{ marginBottom: '0.5rem' }}>✓ Source code projects</div>
          <div>✓ Automatic builds</div>
        </div>
      </div>
    </div>

    {/* Tip Box */}
    <div style={{
      background: '#fef3c7',
      border: '2px solid #fbbf24',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      gap: '1rem'
    }}>
      <Lightbulb size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />
      <div>
        <h4 style={{ color: '#92400e', fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
          💡 Tip
        </h4>
        <p style={{ color: '#78350f', lineHeight: '1.7', margin: 0 }}>
          Choose Docker Hub for quick deployments of existing images, or GitHub for building from source code with automatic CI/CD.
        </p>
      </div>
    </div>
  </div>
);

// Docker Hub Tab Content
const DockerHubContent = () => (
  <div>
    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea', marginBottom: '1.5rem' }}>
      Docker Hub Deployment
    </h2>

    {/* What You Need */}
    <div style={{
      background: '#f0f9ff',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{ color: '#0369a1', fontWeight: '700', marginBottom: '1rem', fontSize: '1.25rem' }}>
        What You Need
      </h3>
      <ul style={{ color: '#075985', lineHeight: '2', paddingLeft: '1.5rem' }}>
        <li><strong>Docker Image Name:</strong> Full image name (e.g., nginx:latest, username/app:v1.0)</li>
        <li><strong>Port Number:</strong> The port your application listens on</li>
        <li><strong>Optional:</strong> Container name (auto-generated if not provided)</li>
      </ul>
    </div>

    {/* Public Images Section */}
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: '#667eea', fontWeight: '700', marginBottom: '1rem', fontSize: '1.4rem' }}>
        📦 Public Images
      </h3>
      <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.7' }}>
        Deploy public images from Docker Hub without authentication:
      </p>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '10px',
        fontFamily: 'monospace',
        fontSize: '0.95rem',
        overflowX: 'auto'
      }}>
        nginx:latest  redis:alpine  postgres:14  node:18-alpine
      </div>
    </div>

    {/* Private Images Section */}
    <div style={{
      background: '#fef3c7',
      border: '2px solid #fbbf24',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{ color: '#92400e', fontWeight: '700', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertTriangle size={24} />
        🔒 Private Images
      </h3>
      <p style={{ color: '#78350f', marginBottom: '1rem', lineHeight: '1.7' }}>
        For private Docker images, you'll need to provide:
      </p>
      <ul style={{ color: '#78350f', lineHeight: '2', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
        <li><strong>Username:</strong> Your Docker Hub username</li>
        <li><strong>Password/Token:</strong> Your Docker Hub password or access token</li>
      </ul>
      <div style={{
        background: '#fffbeb',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #fbbf24'
      }}>
        <p style={{ color: '#92400e', fontWeight: '600', margin: 0, fontSize: '0.95rem' }}>
          🔐 Security Note: Credentials are used only during pull and never stored permanently.
        </p>
      </div>
    </div>

    {/* Step-by-Step Guide */}
    <div>
      <h3 style={{ color: '#667eea', fontWeight: '700', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
        Step-by-Step Guide
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          'Go to "Deploy Application" page',
          'Select "Docker Image" option',
          'Enter the Docker image name (e.g., nginx:latest)',
          'Specify the port number',
          'Optionally provide a container name',
          'For private images, enter username and password',
          'Click "Deploy Application"'
        ].map((step, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '10px',
            borderLeft: '4px solid #667eea'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              flexShrink: 0
            }}>
              {index + 1}
            </div>
            <p style={{ color: '#374151', margin: 0, lineHeight: '2' }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// GitHub Tab Content
const GitHubContent = () => (
  <div>
    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', marginBottom: '1.5rem' }}>
      GitHub Repository Deployment
    </h2>

    {/* Important Requirements */}
    <div style={{
      background: '#dbeafe',
      border: '2px solid #3b82f6',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{ color: '#1e40af', fontWeight: '700', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileCode size={24} />
        1. Dockerfile Must Be in Repository Root
      </h3>
      <p style={{ color: '#1e3a8a', marginBottom: '1rem', lineHeight: '1.7' }}>
        Your repository MUST contain a file named <code style={{ background: '#bfdbfe', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>Dockerfile</code> in the root directory.
      </p>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        your-repository/  ├── Dockerfile ← Required (root level)  ├── src/  ├── index.js  ├── package.json  └── README.md
      </div>
    </div>

    <div style={{
      background: '#f3f4f6',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{ color: '#6366f1', fontWeight: '700', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Code size={24} />
        2. EXPOSE Statement Required
      </h3>
      <p style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: '1.7' }}>
        Dockerfile must include EXPOSE statement:
      </p>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.95rem'
      }}>
        FROM node:18-alpine<br/>
        WORKDIR /app<br/>
        COPY . .<br/>
        RUN npm install<br/>
        <span style={{ background: '#fbbf24', color: '#000', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>EXPOSE 3000</span> ← Required<br/>
        CMD ["npm", "start"]
      </div>
    </div>

    <div style={{
      background: '#fef3c7',
      border: '2px solid #fbbf24',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{ color: '#92400e', fontWeight: '700', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertTriangle size={24} />
        3. Application Must Listen on 0.0.0.0
      </h3>
      <p style={{ color: '#78350f', marginBottom: '1rem', lineHeight: '1.7' }}>
        Application code must bind to <code style={{ background: '#fde68a', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>0.0.0.0</code> (not localhost):
      </p>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.95rem'
      }}>
        // ✅ Correct<br/>
        app.listen(3000, '0.0.0.0');<br/><br/>
        // ❌ Wrong<br/>
        app.listen(3000, 'localhost');
      </div>
    </div>
  </div>
);

// Examples Tab Content
const ExamplesContent = () => (
  <div>
    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea', marginBottom: '1.5rem' }}>
      Dockerfile Examples
    </h2>

    {/* Node.js Example */}
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ color: '#3b82f6', fontWeight: '700', marginBottom: '1rem', fontSize: '1.4rem' }}>
        Node.js Application
      </h3>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '12px',
        fontFamily: 'monospace',
        fontSize: '0.95rem',
        lineHeight: '1.8'
      }}>
        FROM node:18-alpine<br/>
        WORKDIR /app<br/>
        COPY package*.json ./<br/>
        RUN npm install --production<br/>
        COPY . .<br/>
        EXPOSE 3000<br/>
        CMD ["node", "server.js"]
      </div>
    </div>

    {/* Python Flask Example */}
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ color: '#10b981', fontWeight: '700', marginBottom: '1rem', fontSize: '1.4rem' }}>
        Python Flask Application
      </h3>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '12px',
        fontFamily: 'monospace',
        fontSize: '0.95rem',
        lineHeight: '1.8'
      }}>
        FROM python:3.11-slim<br/>
        WORKDIR /app<br/>
        COPY requirements.txt .<br/>
        RUN pip install --no-cache-dir -r requirements.txt<br/>
        COPY . .<br/>
        EXPOSE 5000<br/>
        CMD ["python", "app.py"]
      </div>
    </div>

    {/* React Multi-stage Example */}
    <div>
      <h3 style={{ color: '#f59e0b', fontWeight: '700', marginBottom: '1rem', fontSize: '1.4rem' }}>
        React Application (Multi-stage)
      </h3>
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '12px',
        fontFamily: 'monospace',
        fontSize: '0.95rem',
        lineHeight: '1.8'
      }}>
        FROM node:18-alpine AS build<br/>
        WORKDIR /app<br/>
        COPY package*.json ./<br/>
        RUN npm install<br/>
        COPY . .<br/>
        RUN npm run build<br/><br/>
        FROM nginx:alpine<br/>
        COPY --from=build /app/build /usr/share/nginx/html<br/>
        EXPOSE 80<br/>
        CMD ["nginx", "-g", "daemon off;"]
      </div>
    </div>
  </div>
);

// Troubleshooting Tab Content
const TroubleshootingContent = () => (
  <div>
    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444', marginBottom: '1.5rem' }}>
      Common Issues
    </h2>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Issue 1 */}
      <div style={{
        background: '#fee2e2',
        border: '2px solid #ef4444',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: '#991b1b', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={24} />
          "Image not found"
        </h3>
        <p style={{ color: '#7f1d1d', fontWeight: '600', marginBottom: '0.5rem' }}>
          Docker Hub: Check image name spelling and tag
        </p>
        <p style={{ color: '#991b1b', lineHeight: '1.7' }}>
          <strong>Solution:</strong> Verify image exists on Docker Hub or provide credentials for private images
        </p>
      </div>

      {/* Issue 2 */}
      <div style={{
        background: '#fee2e2',
        border: '2px solid #ef4444',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: '#991b1b', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={24} />
          "No Dockerfile found"
        </h3>
        <p style={{ color: '#7f1d1d', fontWeight: '600', marginBottom: '0.5rem' }}>
          GitHub: Dockerfile missing or in wrong location
        </p>
        <p style={{ color: '#991b1b', lineHeight: '1.7' }}>
          <strong>Solution:</strong> Create Dockerfile in repository root directory
        </p>
      </div>

      {/* Issue 3 */}
      <div style={{
        background: '#fee2e2',
        border: '2px solid #ef4444',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: '#991b1b', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={24} />
          "Container runs but cannot access"
        </h3>
        <p style={{ color: '#7f1d1d', fontWeight: '600', marginBottom: '0.5rem' }}>
          Cause: Application listening on localhost instead of 0.0.0.0
        </p>
        <p style={{ color: '#991b1b', lineHeight: '1.7' }}>
          <strong>Solution:</strong> Change app code to bind to 0.0.0.0
        </p>
      </div>

      {/* Issue 4 */}
      <div style={{
        background: '#fee2e2',
        border: '2px solid #ef4444',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: '#991b1b', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={24} />
          "Authentication failed"
        </h3>
        <p style={{ color: '#7f1d1d', fontWeight: '600', marginBottom: '0.5rem' }}>
          Cause: Invalid Docker Hub or GitHub credentials
        </p>
        <p style={{ color: '#991b1b', lineHeight: '1.7' }}>
          <strong>Solution:</strong> Verify username and password/token are correct
        </p>
      </div>
    </div>

    {/* Success Tips */}
    <div style={{
      background: '#d1fae5',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '2rem'
    }}>
      <h3 style={{ color: '#065f46', fontWeight: '700', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CheckCircle2 size={28} />
        Tips for Success
      </h3>
      <ul style={{ color: '#047857', lineHeight: '2', paddingLeft: '1.5rem' }}>
        <li>Always test your Dockerfile locally before deploying</li>
        <li>Use specific image tags instead of 'latest' for reproducibility</li>
        <li>Keep Dockerfile in repository root directory</li>
        <li>Include EXPOSE statement in your Dockerfile</li>
        <li>Bind your application to 0.0.0.0, not localhost</li>
      </ul>
    </div>
  </div>
);

export default GitHubDeploymentDocs;
