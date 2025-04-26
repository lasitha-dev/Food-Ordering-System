import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Refresh as RefreshIcon, LockReset as LockResetIcon, Info as InfoIcon, Clear as ClearIcon } from '@mui/icons-material';
import * as authApi from '../../services/auth-service/api';
import useAuth from '../../hooks/useAuth';

// Define protected demo user emails that shouldn't be edited/deleted
const PROTECTED_DEMO_USERS = [
  'admin@fooddelivery.com',
  'restaurant@example.com',
  'delivery@example.com'
];

// Check if a user is a protected demo user
const isProtectedDemoUser = (user) => {
  return PROTECTED_DEMO_USERS.includes(user.email);
};

const UserManagement = () => {
  const location = useLocation();
  const { getUsersDirectly } = useAuth(); // Import our direct user fetch method
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add a key to force refresh
  
  // Add debounce function for search and filter updates
  // This is at the top of the component, just after state definitions
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
  
  // Parse URL query parameters for initial role filter
  useEffect(() => {
    // Check for URL query parameters
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    
    if (roleParam) {
      console.log(`Setting initial role filter from URL: ${roleParam}`);
      setRoleFilter(roleParam);
    }
  }, [location.search]);
  
  // Force refresh when receiving navigation state with refresh:true
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('Detected refresh state, forcing component update');
      setRefreshKey(prev => prev + 1);
      // Clear the state to avoid infinite refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  // Listen for storage events (when localStorage changes in other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'createdUsers') {
        console.log('Detected createdUsers change in localStorage, refreshing');
        setRefreshKey(prev => prev + 1);
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Listen for custom user list refresh events
  useEffect(() => {
    const handleCustomRefresh = (event) => {
      console.log('Received userListRefresh event:', event.detail);
      setRefreshKey(prev => prev + 1);
    };
    
    // Add custom event listener
    window.addEventListener('userListRefresh', handleCustomRefresh);
    
    // Clean up
    return () => {
      window.removeEventListener('userListRefresh', handleCustomRefresh);
    };
  }, []);
  
  // Manual check for new users in localStorage
  useEffect(() => {
    const checkCreatedUsers = () => {
      try {
        // Parse the current value
        const createdUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
        
        if (createdUsers.length > 0) {
          console.log(`Found ${createdUsers.length} users in localStorage`);
        }
      } catch (e) {
        console.error('Error checking createdUsers:', e);
      }
    };
    
    // Run once on mount
    checkCreatedUsers();
  }, []);
  
  // Fetch users on component mount and when page, rowsPerPage, or searchTerm changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Sanitize inputs
        const sanitizedSearch = debouncedSearchTerm.trim();
        const sanitizedRoleFilter = debouncedRoleFilter.trim();
        
        console.log(`Fetching users with parameters: page=${page + 1}, limit=${rowsPerPage}, search="${sanitizedSearch}", role="${sanitizedRoleFilter}"`);
        
        // Try using our API first
        let apiSuccess = false;
        
        try {
          const response = await authApi.getUsers(page + 1, rowsPerPage, sanitizedSearch, sanitizedRoleFilter);
          
          // Debug log to see exact response structure
          console.log('API response structure:', {
            success: response.success,
            data: response.data,
            count: response.count,
            total: response.total,
            isDataArray: Array.isArray(response.data),
            hasNestedUsers: response.data && response.data.users,
            dataLength: response.data?.length,
            firstItemId: response.data?.[0]?.id,
            firstItemType: response.data?.[0]?.userType,
            typeof: typeof response.data
          });
          
          if (response.success) {
            apiSuccess = true;
            
            // Consistent user data normalization function
            const normalizeUserData = (user) => ({
              id: user.id || user._id || '',
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
              email: user.email || '',
              userType: (user.userType || 'customer').toLowerCase(),
              active: user.active !== undefined ? user.active : true
            });
            
            // Handle backend response format which has users directly in 'data' array
            // and count in 'count' property
            if (Array.isArray(response.data)) {
              // Ensure consistent data format
              const processedUsers = response.data.map(normalizeUserData);
              
              setUsers(processedUsers);
              // Use total from response for pagination if available, otherwise use count
              setTotalUsers(response.total || response.count || response.data.length);
              console.log('Using array data format, processed users:', processedUsers);
              console.log(`Total users: ${response.total || response.count || response.data.length}`);
            } 
            // Handle cases where users might be nested in data.users
            else if (response.data && response.data.users) {
              const processedUsers = response.data.users.map(normalizeUserData);
              
              setUsers(processedUsers);
              setTotalUsers(response.data.total);
              console.log('Using nested data format, processed users:', processedUsers);
              console.log(`Total users: ${response.data.total}`);
            }
            // Ensure users is never undefined with a default empty array
            else {
              console.warn('Unexpected response format, no users array found');
              setUsers([]);
              setTotalUsers(0);
            }
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('API fetch failed, trying direct method:', apiError.message || apiError);
          // Show user-friendly error message if API call failed
          if (apiError.response?.status === 403) {
            setError('You do not have permission to view users.');
          } else if (apiError.response?.status === 401) {
            setError('Authentication error. Please log in again.');
          }
        }
        
        if (apiSuccess) {
          return; // Don't proceed to fallback if API was successful
        }
        
        // If API fails, use our direct method with mock data
        console.log('Falling back to direct user fetching method');
        const directResponse = await getUsersDirectly(page + 1, rowsPerPage, sanitizedSearch, sanitizedRoleFilter);
        
        // Debug log for direct response
        console.log('Direct response structure:', {
          success: directResponse.success,
          data: directResponse.data,
          users: directResponse.data?.users,
          total: directResponse.data?.total
        });
        
        if (directResponse.success && directResponse.data) {
          // Clear any previous errors since we have data
          setError(null);
          
          // Consistent user data normalization function
          const normalizeUserData = (user) => ({
            id: user.id || user._id || '',
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
            email: user.email || '',
            userType: (user.userType || 'customer').toLowerCase(),
            active: user.active !== undefined ? user.active : true
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
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        // Ensure users is set to an empty array on error
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setLoading(false);
      }
    };
    
    // Call the function to fetch users
    fetchUsers();
  }, [page, rowsPerPage, debouncedSearchTerm, debouncedRoleFilter, getUsersDirectly, refreshKey]);
  
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
  
  // Open delete confirmation dialog
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  // Close delete dialog
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };
  
  // State for password reset functionality
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Open reset password dialog
  const handleResetPasswordClick = (user) => {
    setUserToReset(user);
    setResetPasswordDialogOpen(true);
    setTempPassword('');
    setResetError('');
    setResetSuccess(false);
  };
  
  // Close reset password dialog
  const handleResetPasswordClose = () => {
    setResetPasswordDialogOpen(false);
    setUserToReset(null);
    setTempPassword('');
    setResetError('');
  };
  
  // Reset user password
  const handleResetPasswordConfirm = async () => {
    try {
      setResetLoading(true);
      setResetError('');
      
      // Call the backend API to reset the password
      const response = await authApi.resetUserPassword(userToReset.id);
      
      if (response.success && response.data?.tempPassword) {
        setTempPassword(response.data.tempPassword);
        setResetSuccess(true);
      } else {
        setResetError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };
  
  // Delete user
  const handleDeleteConfirm = async () => {
    try {
      // For local mock users, delete from localStorage
      if (userToDelete.id.startsWith('local_')) {
        const createdUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
        const updatedUsers = createdUsers.filter(user => user.id !== userToDelete.id);
        localStorage.setItem('createdUsers', JSON.stringify(updatedUsers));
        
        // Update UI
        setUsers(users.filter(user => user.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        
        // Dispatch custom event to notify other components about the deletion
        window.dispatchEvent(new CustomEvent('userListRefresh', { 
          detail: { action: 'delete', userId: userToDelete.id, userType: userToDelete.userType } 
        }));
        
        return;
      }
      
      // Otherwise try the API
      try {
        const response = await authApi.deleteUser(userToDelete.id);
        
        if (response.success) {
          // Update local state
          setUsers(users.filter(user => user.id !== userToDelete.id));
          
          // Close dialog
          handleDeleteDialogClose();
          
          // Dispatch custom event to notify other components about the deletion
          window.dispatchEvent(new CustomEvent('userListRefresh', { 
            detail: { action: 'delete', userId: userToDelete.id, userType: userToDelete.userType } 
          }));
        } else {
          setError(response.message || 'Failed to delete user');
        }
      } catch (apiError) {
        console.error('API delete failed:', apiError);
        setError('Failed to delete user. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };
  
  // Get color for user type chip
  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'error';
      case 'restaurant-admin':
        return 'primary';
      case 'delivery-personnel':
        return 'success';
      case 'customer':
        return 'info';
      default:
        return 'default';
    }
  };

  // Improved filters render function
  const renderFilters = () => {
    // Define valid user roles for the system
    const validRoles = [
      { value: '', label: 'All Roles' },
      { value: 'admin', label: 'Admin' },
      { value: 'restaurant-admin', label: 'Restaurant Admin' },
      { value: 'delivery-personnel', label: 'Delivery Personnel' },
      { value: 'customer', label: 'Customer' }
    ];
    
    return (
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 300, flexGrow: 1 }}
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
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="role-filter-label">Filter by Role</InputLabel>
          <Select
            labelId="role-filter-label"
            value={roleFilter}
            label="Filter by Role"
            onChange={handleRoleFilterChange}
          >
            {validRoles.map(role => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Tooltip title="Refresh user list">
          <IconButton onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
        {/* Show active filters */}
        {(searchTerm || roleFilter) && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', mt: 1 }}>
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
          </Box>
        )}
      </Box>
    );
  };

  // Add a function to handle manual refresh
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
    
    // Dispatch custom event to notify other components about the refresh
    window.dispatchEvent(new CustomEvent('userListRefresh', { 
      detail: { action: 'refresh' } 
    }));
  };

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h4">
          User Management
        </Typography>
        <Box>
          <Button 
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleManualRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            to="/admin/users/create"
          >
            Add User
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Note: Customer accounts are not managed here. Customers register themselves through the public registration page.
      </Alert>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        {renderFilters()}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.email}
                      {isProtectedDemoUser(user) && (
                        <Tooltip title="Demo account - cannot be edited or deleted">
                          <InfoIcon color="primary" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.userType} 
                        color={getUserTypeColor(user.userType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.active ? 'Active' : 'Inactive'} 
                        color={user.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {user.userType === 'customer' ? (
                        <Typography variant="caption" color="text.secondary">
                          Self-managed account
                        </Typography>
                      ) : isProtectedDemoUser(user) ? (
                        <Typography variant="caption" color="text.secondary">
                          Demo account (protected)
                        </Typography>
                      ) : (
                        <>
                          <IconButton 
                            component={Link}
                            to={`/admin/users/${user.id}/edit`}
                            color="primary"
                            size="small"
                            title="Edit User"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDeleteClick(user)}
                            title="Delete User"
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton 
                            color="secondary" 
                            size="small"
                            onClick={() => handleResetPasswordClick(user)}
                            title="Reset Password"
                          >
                            <LockResetIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={resetSuccess ? null : handleResetPasswordClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {resetSuccess ? 'Password Reset Successful' : `Reset Password for ${userToReset?.name}`}
        </DialogTitle>
        <DialogContent>
          {!resetSuccess ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                This will generate a temporary password for {userToReset?.name}. The user will need to change it on next login.
              </DialogContentText>
              {resetError && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {resetError}
                </Alert>
              )}
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                Password has been reset successfully!
              </Alert>
              <Typography variant="subtitle2" gutterBottom>
                Temporary Password:
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'background.paper', 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2
              }}>
                <Typography 
                  variant="body1" 
                  fontFamily="monospace" 
                  sx={{ flexGrow: 1 }}
                >
                  {tempPassword}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    // Show a brief notification that password was copied
                    alert('Password copied to clipboard');
                  }}
                >
                  Copy
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Please securely share this temporary password with the user. They will need to change it on their next login.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {resetSuccess ? (
            <Button onClick={handleResetPasswordClose} color="primary">
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleResetPasswordClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleResetPasswordConfirm} 
                color="primary" 
                disabled={resetLoading}
              >
                {resetLoading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 