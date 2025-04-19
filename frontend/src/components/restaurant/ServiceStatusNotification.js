import React, { useState } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import { 
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import { getAuthToken } from '../../hooks/useAuth';
import axios from 'axios';

const ServiceStatusNotification = ({ serviceName, port, error }) => {
  const [debugging, setDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  // Function to check auth status 
  const checkAuthStatus = async () => {
    setChecking(true);
    try {
      const info = {};

      // Get token info
      const token = getAuthToken();
      info.hasToken = Boolean(token);
      
      if (token) {
        // Get token parts
        const parts = token.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]));
            info.tokenPayload = payload;
            info.tokenExpiry = new Date(payload.exp * 1000).toLocaleString();
            info.tokenIsExpired = payload.exp * 1000 < Date.now();
          } catch (e) {
            info.tokenParseError = e.message;
          }
        }
      }

      // Check local storage
      const keys = Object.keys(localStorage);
      info.localStorageKeys = keys;

      // Check service connection
      try {
        const serviceResponse = await axios.get(`http://localhost:${port}`);
        info.serviceStatus = {
          connected: true,
          statusCode: serviceResponse.status,
          data: serviceResponse.data
        };
      } catch (e) {
        info.serviceStatus = {
          connected: false,
          error: e.message
        };
      }

      // Check auth service
      try {
        const authResponse = await axios.get('http://localhost:3001');
        info.authServiceStatus = {
          connected: true,
          statusCode: authResponse.status,
          data: authResponse.data
        };
      } catch (e) {
        info.authServiceStatus = {
          connected: false,
          error: e.message
        };
      }

      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({ error: error.message });
    } finally {
      setChecking(false);
    }
  };

  const isTokenError = error && (
    error.includes('token') || 
    error.includes('authorization') || 
    error.includes('authorized') ||
    error.includes('401')
  );

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Alert 
        severity={isTokenError ? "error" : "warning"} 
        icon={<WarningIcon fontSize="large" />} 
        sx={{ mb: 2 }}
      >
        <AlertTitle>
          {isTokenError ? 'Authentication Error' : 'Backend Service Unavailable'}
        </AlertTitle>
        {isTokenError ? 
          'There was a problem with your authentication. Your token might be invalid or expired.'
          : 
          `We couldn't connect to the ${serviceName} service. This is needed to view and manage food items.`
        }
      </Alert>

      <Typography variant="subtitle1" gutterBottom>
        To fix this issue:
      </Typography>

      <List dense>
        {isTokenError ? (
          <>
            <ListItem>
              <ListItemText 
                primary="Try logging out and logging back in" 
                secondary="This will generate a new authentication token"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Check if the auth service is running" 
                secondary="The authentication service should be running on port 3001"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Verify token verification endpoint" 
                secondary="The restaurant service needs to connect to the auth service"
              />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem>
              <ListItemText 
                primary="Make sure the backend service is running" 
                secondary={`The ${serviceName} service should be running on port ${port}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Start the service if it's not running" 
                secondary="Navigate to the backend directory and run the service with npm or node"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Check for error messages in the terminal" 
                secondary="The service might have started with errors"
              />
            </ListItem>
          </>
        )}
      </List>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {isTokenError ? 
            'To fix authentication issues, try:' :
            `To start the ${serviceName.toLowerCase()} service, run these commands:`
          }
        </Typography>
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: 'background.paper', 
            borderRadius: 1, 
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            mb: 2
          }}
        >
          {isTokenError ? (
            <>
              1. Restart both services:<br/>
              cd backend/auth-service<br/>
              npm run dev<br/>
              cd ../restaurant-service<br/>
              npm run dev<br/><br/>
              2. Log out and log back in to your account
            </>
          ) : (
            <>
              cd backend/{serviceName.toLowerCase()}-service<br />
              npm run dev
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={checking ? <CircularProgress size={20} /> : <KeyIcon />}
            onClick={checkAuthStatus}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check Auth Status'}
          </Button>
        </Box>
        
        {debugInfo && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Authentication Debug Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'background.paper', 
                borderRadius: 1, 
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(debugInfo, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Paper>
  );
};

export default ServiceStatusNotification; 