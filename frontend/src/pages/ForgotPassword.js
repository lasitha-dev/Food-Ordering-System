import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" paragraph>
            This page is under development.
          </Typography>
          <Button component={Link} to="/login" variant="contained" color="primary">
            Back to Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 