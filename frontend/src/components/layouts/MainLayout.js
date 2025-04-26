import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Typography, Grid, Link as MuiLink, Divider, useTheme } from '@mui/material';
import Header from '../Header';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  const theme = useTheme();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[50] 
          : theme.palette.grey[900],
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RestaurantMenuIcon
                sx={{
                  mr: 1.5,
                  fontSize: 28,
                  color: theme.palette.primary.main
                }}
              />
              <Typography
                variant="h6"
                sx={{ 
                  fontWeight: 700,
                  backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Tasty Eats
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Delicious food delivered to your doorstep. Order from your favorite 
              restaurants and enjoy the best dining experience at home.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <MuiLink href="#" color="inherit">
                <FacebookIcon sx={{ fontSize: 22 }} />
              </MuiLink>
              <MuiLink href="#" color="inherit">
                <TwitterIcon sx={{ fontSize: 22 }} />
              </MuiLink>
              <MuiLink href="#" color="inherit">
                <InstagramIcon sx={{ fontSize: 22 }} />
              </MuiLink>
              <MuiLink href="#" color="inherit">
                <LinkedInIcon sx={{ fontSize: 22 }} />
              </MuiLink>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Explore
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink href="#" color="text.secondary" underline="hover">Home</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover">Restaurants</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover">Cuisines</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover">Special Offers</MuiLink>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink href="#" color="text.secondary" underline="hover">Terms</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover">Privacy</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover">Cookies</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover">Licenses</MuiLink>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              123 Restaurant Avenue,<br />
              Food District, City 12345<br />
              support@tastyeats.com<br />
              +1 (555) 123-4567
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Tasty Eats. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <MuiLink href="#" color="text.secondary" underline="hover" variant="body2">
              Help Center
            </MuiLink>
            <MuiLink href="#" color="text.secondary" underline="hover" variant="body2">
              Partner with us
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

const MainLayout = () => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
      }}
    >
      <Header />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: { xs: 10, sm: 12 }, 
          pb: 6,
          px: { xs: 2, sm: 3 }
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout; 