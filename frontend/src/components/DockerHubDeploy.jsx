import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import { Rocket, BookOpen } from 'lucide-react';
import axios from 'axios';

function DockerHubDeploy() {
  const [formData, setFormData] = useState({
    image: 'nginx:latest',
    container_name: '',
    port: 80,
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 80 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        image: formData.image,
        port: parseInt(formData.port) || 80,
      };

      if (formData.container_name) payload.container_name = formData.container_name;
      if (formData.username) payload.username = formData.username;
      if (formData.password) payload.password = formData.password;

      const response = await axios.post('http://localhost:8000/api/deployment/docker', payload);

      setSuccess(`Deployment successful! Container ID: ${response.data.container_id.substring(0, 12)}`);
      
      // Reset form
      setFormData({
        image: 'nginx:latest',
        container_name: '',
        port: 80,
        username: '',
        password: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rocket size={24} style={{ marginRight: 8 }} />
          <Typography variant="h5">Docker Hub Deployment</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Deploy containerized applications directly from Docker Hub.
          Supports both public and private images.
        </Typography>

        <Button
          variant="outlined"
          startIcon={<BookOpen size={16} />}
          sx={{ mb: 3 }}
          href="https://docs.docker.com/docker-hub/"
          target="_blank"
        >
          Read Documentation First
        </Button>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Docker Image Name"
            name="image"
            value={formData.image}
            onChange={handleChange}
            required
            placeholder="e.g., nginx:latest"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Container Name"
              name="container_name"
              value={formData.container_name}
              onChange={handleChange}
              placeholder="Auto-generated if empty"
            />
            <TextField
              fullWidth
              label="Port"
              name="port"
              type="number"
              value={formData.port}
              onChange={handleChange}
              required
              inputProps={{ min: 1, max: 65535 }}
            />
          </Box>

          <Box sx={{ backgroundColor: '#FFF9E6', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              🔒 Private Image Credentials (Optional)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              For private Docker Hub images, provide your username and password/token
            </Typography>

            <TextField
              fullWidth
              label="Docker Hub Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              label="Password / Access Token"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Rocket size={20} />}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Deploying...' : 'Deploy Application'}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            <Typography variant="subtitle2">Deployment Failed</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            <Typography variant="subtitle2">Deployment Successful!</Typography>
            <Typography variant="body2">{success}</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default DockerHubDeploy;
