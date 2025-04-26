import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import * as authApi from '../../services/auth-service/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const theme = useTheme();
  const { getUsersDirectly } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Debounce search and filter changes
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedRoleFilter, setDebouncedRoleFilter] = useState('');
  
  // Search debounce effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);
  
  // Role filter debounce effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedRoleFilter(roleFilter);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [roleFilter]);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Sanitize inputs
      const sanitizedSearch = debouncedSearchTerm.trim();
      const sanitizedRoleFilter = debouncedRoleFilter.trim();
      
      console.log(`Fetching users for reports: page=${page + 1}, limit=${rowsPerPage}, search="${sanitizedSearch}", role="${sanitizedRoleFilter}"`);
      
      // Try getting the user counts from getUserCountsByRole
      const userResponse = await authApi.getUserCountsByRole();
      
      if (userResponse && userResponse.success && userResponse.data) {
        console.log('User counts:', userResponse.data);
      }
      
      // Try using our API first
      const response = await authApi.getUsers(page + 1, rowsPerPage, sanitizedSearch, sanitizedRoleFilter);
      
      // Debug log to see exact response structure
      console.log('API response structure:', {
        success: response.success,
        data: response.data,
        count: response.count,
        total: response.total,
        isDataArray: Array.isArray(response.data)
      });
      
      if (response.success) {
        // Consistent user data normalization function
        const normalizeUserData = (user) => ({
          id: user.id || user._id || '',
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email || '',
          userType: (user.userType || 'customer').toLowerCase(),
          active: user.active !== undefined ? user.active : true,
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
        });
        
        // Handle backend response format which has users directly in 'data' array
        if (Array.isArray(response.data)) {
          // Ensure consistent data format
          const processedUsers = response.data.map(normalizeUserData);
          
          setUsers(processedUsers);
          // Use total from response for pagination if available, otherwise use count
          setTotalUsers(response.total || response.count || response.data.length);
          console.log('Using array data format, processed users:', processedUsers);
        } 
        // Handle cases where users might be nested in data.users
        else if (response.data && response.data.users) {
          const processedUsers = response.data.users.map(normalizeUserData);
          
          setUsers(processedUsers);
          setTotalUsers(response.data.total);
          console.log('Using nested data format, processed users:', processedUsers);
        }
        // Ensure users is never undefined with a default empty array
        else {
          console.warn('Unexpected response format, no users array found');
          setUsers([]);
          setTotalUsers(0);
        }
      } else {
        // If API fails, use our direct method with mock data
        console.log('Falling back to direct user fetching method');
        const directResponse = await getUsersDirectly(page + 1, rowsPerPage, sanitizedSearch, sanitizedRoleFilter);
        
        if (directResponse.success && directResponse.data) {
          // Consistent user data normalization function
          const normalizeUserData = (user) => ({
            id: user.id || user._id || '',
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
            email: user.email || '',
            userType: (user.userType || 'customer').toLowerCase(),
            active: user.active !== undefined ? user.active : true,
            createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
          });
          
          if (directResponse.data.users) {
            const processedUsers = directResponse.data.users.map(normalizeUserData);
            setUsers(processedUsers);
            setTotalUsers(directResponse.data.total || 0);
          } 
          // Handle case where data itself is the users array
          else if (Array.isArray(directResponse.data)) {
            const processedUsers = directResponse.data.map(normalizeUserData);
            setUsers(processedUsers);
            setTotalUsers(directResponse.data.length);
          }
          // Default to empty array if no valid response format
          else {
            console.warn('Unexpected direct response format, setting empty users array');
            setUsers([]);
            setTotalUsers(0);
          }
        } else {
          console.warn('Failed response from direct method, setting empty users array');
          setUsers([]);
          setTotalUsers(0);
          setError(directResponse?.message || 'Failed to fetch users');
        }
      }
    } catch (err) {
      console.error('Error fetching users for reports:', err);
      setError('Failed to load user data. Please try again later.');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, debouncedRoleFilter, getUsersDirectly]);

  // Fetch users on component mount and when page, rowsPerPage, or search term changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when search changes
  };

  // Handle role filter change
  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  // Handle date filter change
  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
    setPage(0);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setDateFilter('');
    setPage(0);
  };
  
  // Generate and download PDF report
  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('User Report', 14, 22);
      
      // Add report metadata
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      // Add filters if applied
      let yPos = 36;
      if (searchTerm || roleFilter || statusFilter || dateFilter) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 6;
        
        if (searchTerm) {
          doc.text(`• Search: ${searchTerm}`, 14, yPos);
          yPos += 6;
        }
        
        if (roleFilter) {
          doc.text(`• Role: ${roleFilter}`, 14, yPos);
          yPos += 6;
        }
        
        if (statusFilter) {
          doc.text(`• Status: ${statusFilter}`, 14, yPos);
          yPos += 6;
        }
        
        if (dateFilter) {
          doc.text(`• Date Range: ${dateFilter}`, 14, yPos);
          yPos += 6;
        }
        
        yPos += 4;
      }
      
      // Get filtered data for PDF
      // Apply client-side filters for status and date that aren't handled by API
      let filteredUsers = [...users];
      
      if (statusFilter) {
        const isActive = statusFilter === 'active';
        filteredUsers = filteredUsers.filter(user => user.active === isActive);
      }
      
      // Define columns
      const columns = [
        { header: 'Name', dataKey: 'name' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Role', dataKey: 'userType' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Created', dataKey: 'createdAt' }
      ];
      
      // Transform data for the table
      const data = filteredUsers.map(user => ({
        name: user.name,
        email: user.email,
        userType: user.userType.charAt(0).toUpperCase() + user.userType.slice(1),
        status: user.active ? 'Active' : 'Inactive',
        createdAt: user.createdAt
      }));
      
      // Add table to PDF using autoTable
      autoTable(doc, {
        startY: yPos,
        head: [columns.map(col => col.header)],
        body: data.map(item => columns.map(col => item[col.dataKey])),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [255, 87, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add footer with total count
      const finalY = doc.lastAutoTable.finalY || 280;
      doc.setFontSize(10);
      doc.text(`Total Users: ${filteredUsers.length}`, 14, finalY + 10);
      
      // Save PDF
      doc.save('user-report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Define valid user roles for the system
  const validRoles = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'restaurant-admin', label: 'Restaurant Admin' },
    { value: 'delivery-personnel', label: 'Delivery Personnel' },
    { value: 'customer', label: 'Customer' }
  ];
  
  // Status filter options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];
  
  // Date filter options
  const dateOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  return (
    <Box>
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          User Reports
        </Typography>
        
        <Box>
          <Button 
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PdfIcon />}
            onClick={generatePDF}
            disabled={loading || pdfLoading || users.length === 0}
          >
            {pdfLoading ? 'Generating...' : 'Export Card View to PDF'}
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Search by name or email"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                label="Role"
                onChange={handleRoleFilterChange}
              >
                {validRoles.map(role => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="date-filter-label">Date Range</InputLabel>
              <Select
                labelId="date-filter-label"
                value={dateFilter}
                label="Date Range"
                onChange={handleDateFilterChange}
              >
                {dateOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Active filters display */}
        {(searchTerm || roleFilter || statusFilter || dateFilter) && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Active filters:
              </Typography>
              
              {searchTerm && (
                <Chip 
                  size="small" 
                  label={`Search: ${searchTerm}`} 
                  onDelete={() => setSearchTerm('')}
                />
              )}
              
              {roleFilter && (
                <Chip 
                  size="small" 
                  label={`Role: ${validRoles.find(r => r.value === roleFilter)?.label || roleFilter}`} 
                  onDelete={() => setRoleFilter('')}
                />
              )}
              
              {statusFilter && (
                <Chip 
                  size="small" 
                  label={`Status: ${statusOptions.find(s => s.value === statusFilter)?.label}`} 
                  onDelete={() => setStatusFilter('')}
                />
              )}
              
              {dateFilter && (
                <Chip 
                  size="small" 
                  label={`Date: ${dateOptions.find(d => d.value === dateFilter)?.label}`} 
                  onDelete={() => setDateFilter('')}
                />
              )}
              
              <Button 
                size="small" 
                variant="outlined" 
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="body1" color="text.secondary">
              No users found matching the filters
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ p: 2 }}>
              {users
                // Apply client-side filters for status that isn't handled by API
                .filter(user => !statusFilter || 
                  (statusFilter === 'active' ? user.active : !user.active))
                .map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        p: 2,
                        height: '100%',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[6]
                        },
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {user.email}
                          </Typography>
                        </Box>
                        <Box>
                          <Chip 
                            label={user.userType} 
                            color={
                              user.userType === 'admin' ? 'error' :
                              user.userType === 'restaurant-admin' ? 'primary' :
                              user.userType === 'delivery-personnel' ? 'success' :
                              'info'
                            }
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        </Box>
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Status
                            </Typography>
                            <Chip 
                              label={user.active ? 'Active' : 'Inactive'} 
                              color={user.active ? 'success' : 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Created
                            </Typography>
                            <Typography variant="body2">
                              {user.createdAt}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Last Login
                            </Typography>
                            <Typography variant="body2">
                              {user.lastLogin}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Card>
                  </Grid>
                ))}
            </Grid>
            
            <Box sx={{ p: 2 }}>
              <TablePagination
                rowsPerPageOptions={[6, 12, 24, 48]}
                component="div"
                count={totalUsers}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          </>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading...' : `Showing ${users.length} of ${totalUsers} total users`}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<PdfIcon />}
          onClick={generatePDF}
          disabled={loading || pdfLoading || users.length === 0}
        >
          {pdfLoading ? 'Generating...' : 'Export Card View to PDF'}
        </Button>
      </Box>
    </Box>
  );
};

export default Reports; 