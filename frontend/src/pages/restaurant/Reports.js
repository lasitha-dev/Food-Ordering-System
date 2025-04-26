import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card,
  Tabs,
  Tab,
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
  TablePagination,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as OrderIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import foodItemApi from '../../services/restaurant-service/api';
import orderService from '../../services/orderService';
import useAuth from '../../hooks/useAuth';

// Mock data for initial development
const MOCK_FOOD_ITEMS = [
  { 
    id: 'item1', 
    name: 'Margherita Pizza', 
    category: 'Pizza',
    price: 12.99, 
    description: 'Classic cheese pizza with tomato sauce', 
    active: true,
    createdAt: '2023-04-12',
    lastUpdated: '2023-05-20',
    restaurant: 'Pizza Palace'
  },
  { 
    id: 'item2', 
    name: 'Chicken Burger', 
    category: 'Burger',
    price: 9.99, 
    description: 'Chicken patty with lettuce, tomato and special sauce', 
    active: true,
    createdAt: '2023-03-15',
    lastUpdated: '2023-05-15',
    restaurant: 'Burger Joint'
  },
  { 
    id: 'item3', 
    name: 'Veggie Salad', 
    category: 'Salad', 
    price: 8.99, 
    description: 'Fresh vegetables with vinaigrette', 
    active: true,
    createdAt: '2023-02-10',
    lastUpdated: '2023-04-22',
    restaurant: 'Healthy Eats'
  }
];

const MOCK_ORDERS = [
  {
    id: 'order1',
    customerName: 'John Doe',
    items: ['Margherita Pizza', 'Coke'],
    total: 15.98,
    status: 'Delivered',
    date: '2023-05-25',
    paymentMethod: 'Credit Card',
    restaurant: 'Pizza Palace'
  },
  {
    id: 'order2',
    customerName: 'Jane Smith',
    items: ['Chicken Burger', 'Fries', 'Sprite'],
    total: 16.97,
    status: 'Preparing',
    date: '2023-05-26',
    paymentMethod: 'Cash on Delivery',
    restaurant: 'Burger Joint'
  },
  {
    id: 'order3',
    customerName: 'Mike Johnson',
    items: ['Veggie Salad', 'Water'],
    total: 10.99,
    status: 'Out for Delivery',
    date: '2023-05-26',
    paymentMethod: 'Online Payment',
    restaurant: 'Healthy Eats'
  }
];

const RestaurantReports = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  
  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 0) {
        // Fetch food items
        const response = await foodItemApi.getAllFoodItems();
        if (response.success) {
          const foodItemsData = response.data || [];
          // Transform data for consistency with the UI structure
          const processedItems = foodItemsData.map(item => ({
            id: item._id || item.id,
            name: item.title,
            category: item.category,
            price: item.price || 0,
            description: item.description || '',
            active: true, // Assume all items in the database are active
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown',
            lastUpdated: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Unknown'
          }));
          
          setFoodItems(processedItems);
          setTotalItems(processedItems.length);
        } else {
          throw new Error('Failed to fetch food items');
        }
      } else {
        // Fetch orders
        const response = await orderService.getRestaurantOrders();
        if (response.success) {
          const ordersData = response.data || [];
          // Transform data for consistency with the UI structure
          const processedOrders = ordersData.map(order => ({
            id: order._id || order.id,
            customerName: order.userName || 'Customer',
            items: order.items ? order.items.map(item => item.name || item.title) : [],
            total: order.total || order.totalAmount || 0,
            status: order.status || 'Pending',
            date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown',
            paymentMethod: order.paymentMethod || 'Unknown'
          }));
          
          setOrders(processedOrders);
          setTotalItems(processedOrders.length);
        } else {
          throw new Error('Failed to fetch orders');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      
      // Fallback to mock data in development environment or for demo
      if (process.env.NODE_ENV === 'development') {
        if (activeTab === 0) {
          setFoodItems(MOCK_FOOD_ITEMS);
          setTotalItems(MOCK_FOOD_ITEMS.length);
        } else {
          setOrders(MOCK_ORDERS);
          setTotalItems(MOCK_ORDERS.length);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch data on component mount, tab change, and when refreshKey changes
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setDateFilter('');
  };

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
    setPage(0);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
    setPage(0);
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
    setCategoryFilter('');
    setStatusFilter('');
    setDateFilter('');
    setPage(0);
  };
  
  // Generate Food Items PDF
  const generateFoodItemsPDF = async () => {
    setPdfLoading(true);
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Food Items Report', 14, 22);
      
      // Add report metadata
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      // Add filters if applied
      let yPos = 36;
      if (searchTerm || categoryFilter || dateFilter) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 6;
        
        if (searchTerm) {
          doc.text(`• Search: ${searchTerm}`, 14, yPos);
          yPos += 6;
        }
        
        if (categoryFilter) {
          doc.text(`• Category: ${categoryFilter}`, 14, yPos);
          yPos += 6;
        }
        
        if (dateFilter) {
          doc.text(`• Date Range: ${dateFilter}`, 14, yPos);
          yPos += 6;
        }
        
        yPos += 4;
      }
      
      // Define columns
      const columns = [
        { header: 'Name', dataKey: 'name' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Price', dataKey: 'price' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Last Updated', dataKey: 'lastUpdated' }
      ];
      
      // Filter items based on search and filters
      const filteredItems = foodItems.filter(item => {
        const matchesSearch = !searchTerm || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
      });
      
      // Transform data for the table
      const data = filteredItems.map(item => ({
        name: item.name,
        category: item.category,
        price: `$${item.price.toFixed(2)}`,
        status: item.active ? 'Active' : 'Inactive',
        lastUpdated: item.lastUpdated
      }));
      
      // Add table to PDF
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
      doc.text(`Total Food Items: ${filteredItems.length}`, 14, finalY + 10);
      
      // Save PDF
      doc.save('food-items-report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Generate Orders PDF
  const generateOrdersPDF = async () => {
    setPdfLoading(true);
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Orders Report', 14, 22);
      
      // Add report metadata
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      // Add filters if applied
      let yPos = 36;
      if (searchTerm || statusFilter || dateFilter) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 6;
        
        if (searchTerm) {
          doc.text(`• Search: ${searchTerm}`, 14, yPos);
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
      
      // Define columns
      const columns = [
        { header: 'Order ID', dataKey: 'id' },
        { header: 'Customer', dataKey: 'customerName' },
        { header: 'Items', dataKey: 'items' },
        { header: 'Total', dataKey: 'total' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Date', dataKey: 'date' }
      ];
      
      // Filter orders based on search and filters
      const filteredOrders = orders.filter(order => {
        const matchesSearch = !searchTerm || 
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });
      
      // Transform data for the table
      const data = filteredOrders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        items: order.items.join(', '),
        total: `$${order.total.toFixed(2)}`,
        status: order.status,
        date: order.date
      }));
      
      // Add table to PDF
      autoTable(doc, {
        startY: yPos,
        head: [columns.map(col => col.header)],
        body: data.map(item => columns.map(col => item[col.dataKey])),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [255, 87, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add footer with total count and revenue
      const finalY = doc.lastAutoTable.finalY || 280;
      doc.setFontSize(10);
      doc.text(`Total Orders: ${filteredOrders.length}`, 14, finalY + 10);
      
      // Calculate total revenue
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, finalY + 20);
      
      // Save PDF
      doc.save('orders-report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Food item categories
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Pizza', label: 'Pizza' },
    { value: 'Burger', label: 'Burger' },
    { value: 'Salad', label: 'Salad' },
    { value: 'Dessert', label: 'Dessert' },
    { value: 'Beverage', label: 'Beverage' }
  ];
  
  // Order status options
  const orderStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Preparing', label: 'Preparing' },
    { value: 'Out for Delivery', label: 'Out for Delivery' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];
  
  // Date filter options
  const dateOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  // Render Food Items Cards
  const renderFoodItemCards = () => {
    // Filter items based on search and category
    const filteredItems = foodItems.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
    
    if (filteredItems.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="body1" color="text.secondary">
            No food items found matching the filters
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3} sx={{ p: 2 }}>
        {filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
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
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.description}
                  </Typography>
                </Box>
                <Box>
                  <Chip 
                    label={item.category} 
                    color="primary"
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
                      Price
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${item.price.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Status
                    </Typography>
                    <Chip 
                      label={item.active ? 'Active' : 'Inactive'} 
                      color={item.active ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Updated
                    </Typography>
                    <Typography variant="body2">
                      {item.lastUpdated}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render Order Cards
  const renderOrderCards = () => {
    // Filter orders based on search and status
    const filteredOrders = orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    if (filteredOrders.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="body1" color="text.secondary">
            No orders found matching the filters
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3} sx={{ p: 2 }}>
        {filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
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
                    Order #{order.id.substring(5)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {order.customerName}
                  </Typography>
                </Box>
                <Box>
                  <Chip 
                    label={order.status} 
                    color={
                      order.status === 'Delivered' ? 'success' :
                      order.status === 'Preparing' ? 'primary' :
                      order.status === 'Out for Delivery' ? 'info' :
                      order.status === 'Cancelled' ? 'error' :
                      'default'
                    }
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Items
                </Typography>
                {order.items.map((item, index) => (
                  <Chip 
                    key={index}
                    label={item} 
                    variant="outlined"
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Payment
                    </Typography>
                    <Typography variant="body2">
                      {order.paymentMethod}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Order Date
                    </Typography>
                    <Typography variant="body2">
                      {order.date}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    return activeTab === 0 ? renderFoodItemCards() : renderOrderCards();
  };

  // Render filters based on active tab
  const renderFilters = () => {
    return (
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={activeTab === 0 ? "Search food items" : "Search orders"}
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
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="category-filter-label">
              {activeTab === 0 ? "Category" : "Status"}
            </InputLabel>
            <Select
              labelId="category-filter-label"
              value={activeTab === 0 ? categoryFilter : statusFilter}
              label={activeTab === 0 ? "Category" : "Status"}
              onChange={activeTab === 0 ? handleCategoryFilterChange : handleStatusFilterChange}
            >
              {activeTab === 0 
                ? categories.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))
                : orderStatuses.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))
              }
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
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
    );
  };

  // Display active filters
  const renderActiveFilters = () => {
    const hasFilters = searchTerm || 
                      (activeTab === 0 ? categoryFilter : statusFilter) || 
                      dateFilter;
    
    if (!hasFilters) {
      return null;
    }
    
    return (
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
          
          {activeTab === 0 && categoryFilter && (
            <Chip 
              size="small" 
              label={`Category: ${categories.find(c => c.value === categoryFilter)?.label || categoryFilter}`} 
              onDelete={() => setCategoryFilter('')}
            />
          )}
          
          {activeTab === 1 && statusFilter && (
            <Chip 
              size="small" 
              label={`Status: ${orderStatuses.find(s => s.value === statusFilter)?.label || statusFilter}`} 
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
    );
  };

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
          Restaurant Reports
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
            onClick={activeTab === 0 ? generateFoodItemsPDF : generateOrdersPDF}
            disabled={loading || pdfLoading || (activeTab === 0 ? foodItems.length === 0 : orders.length === 0)}
          >
            {pdfLoading ? 'Generating...' : 'Export to PDF'}
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              py: 2,
            }
          }}
        >
          <Tab 
            icon={<RestaurantIcon />} 
            label="Food Items" 
            iconPosition="start" 
          />
          <Tab 
            icon={<OrderIcon />} 
            label="Orders" 
            iconPosition="start" 
          />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          {renderFilters()}
          {renderActiveFilters()}
        </Box>
      </Paper>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        {renderContent()}
        
        <Box sx={{ p: 2 }}>
          <TablePagination
            rowsPerPageOptions={[6, 12, 24, 48]}
            component="div"
            count={activeTab === 0 
              ? foodItems.filter(item => {
                  const matchesSearch = !searchTerm || 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchTerm.toLowerCase());
                    
                  const matchesCategory = !categoryFilter || item.category === categoryFilter;
                  
                  return matchesSearch && matchesCategory;
                }).length
              : orders.filter(order => {
                  const matchesSearch = !searchTerm || 
                    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.id.toLowerCase().includes(searchTerm.toLowerCase());
                    
                  const matchesStatus = !statusFilter || order.status === statusFilter;
                  
                  return matchesSearch && matchesStatus;
                }).length
            }
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading...' : activeTab === 0 
            ? `${foodItems.length} total food items` 
            : `${orders.length} total orders`
          }
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<PdfIcon />}
          onClick={activeTab === 0 ? generateFoodItemsPDF : generateOrdersPDF}
          disabled={loading || pdfLoading || (activeTab === 0 ? foodItems.length === 0 : orders.length === 0)}
        >
          {pdfLoading ? 'Generating...' : activeTab === 0 ? 'Export Food Items' : 'Export Orders'}
        </Button>
      </Box>
    </Box>
  );
};

export default RestaurantReports; 