// src/components/Sidebar.js

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Drawer,
  IconButton,
  Divider,
  Toolbar,
  AppBar,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox'; // Goods-in
import ArticleIcon from '@mui/icons-material/Article'; // Milwaukee Test Form
import AssessmentIcon from '@mui/icons-material/Assessment'; // Analysis
import EditIcon from '@mui/icons-material/Edit'; // Add/Revise Product
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Productivity
import StraightenIcon from '@mui/icons-material/Straighten'; // Measurement Calibration
import DescriptionIcon from '@mui/icons-material/Description'; // Calibration Reports
import FolderIcon from '@mui/icons-material/Folder'; // Document Storage
import InventoryIcon from '@mui/icons-material/Inventory'; // Stock Table
import LayersIcon from '@mui/icons-material/Layers'; // Raw Material SKU
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'; // Compare Machines
import CloseIcon from '@mui/icons-material/Close';
import EngineeringIcon from '@mui/icons-material/Engineering'; // Block Calibration
import PrintIcon from '@mui/icons-material/Print'; // Label Printing
import ReceiptIcon from '@mui/icons-material/Receipt'; // Customer PO
import ListAltIcon from '@mui/icons-material/ListAlt'; // Printed Boxes or general list
import { useTheme, useMediaQuery } from '@mui/material';

import { useAuth } from '../AuthProvider';
import { auth } from '../firebase';

const drawerWidth = 280;

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { currentUser } = useAuth();

  const navLinks = [
    { path: '/home', label: 'Home', icon: <HomeIcon /> },
    { path: '/label-printing', label: 'Label Printing', icon: <PrintIcon /> },
    { path: '/printed-boxes', label: 'Printed Boxes', icon: <ListAltIcon /> },  // New Printed Boxes link
    { path: '/goods-in', label: 'Goods-in', icon: <MoveToInboxIcon /> },
    { path: '/milwaukee-test-form', label: 'Test Form', icon: <ArticleIcon /> },
    { path: '/reports', label: 'Reports', icon: <DescriptionIcon /> },
    { path: '/analysis', label: 'Analysis', icon: <AssessmentIcon /> },
    { path: '/compare', label: 'Compare Machines', icon: <CompareArrowsIcon /> },
    { path: '/shiftform', label: 'Productivity', icon: <TrendingUpIcon /> },
    { path: '/shift-analysis', label: 'Productivity Data', icon: <AssessmentIcon /> },
    { path: '/CalibrationForm', label: 'Measurement Calibration', icon: <StraightenIcon /> },
    { path: '/CalibrationReportTable', label: 'Calibration Reports', icon: <DescriptionIcon /> },
    { path: '/StockTable', label: 'Stock Table', icon: <InventoryIcon /> },
    { path: '/add-product', label: 'Add/Revise Product', icon: <EditIcon /> },
    { path: '/AddRawMaterial', label: 'Add Raw Materials SKU', icon: <LayersIcon /> },
    { path: '/PdfCatalog', label: 'Document Storage', icon: <FolderIcon /> },
    { path: '/block-calibration-form', label: 'Block Calibration', icon: <EngineeringIcon /> },
    { path: '/block-calibration-reports', label: 'Block Calibration Reports', icon: <EngineeringIcon /> },
    { path: '/customer-po', label: 'Customer PO', icon: <ReceiptIcon /> },
    // NEW NAV LINK for the Customer PO list
    { path: '/customer-po-list', label: 'Customer PO List', icon: <ListAltIcon /> },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        bgcolor: '#f5f5f5',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="presentation"
      onClick={isMobile ? handleDrawerToggle : undefined}
      onKeyDown={isMobile ? handleDrawerToggle : undefined}
    >
      <Box sx={{ flexShrink: 0, py: 2 }}>
        <Typography variant="h6" align="center">
          BTM201
        </Typography>
        <Divider />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List>
          {navLinks.map((link) => (
            <ListItem
              button
              key={link.path}
              component={NavLink}
              to={link.path}
              sx={{
                '&.active': { backgroundColor: '#e0e0e0' },
                whiteSpace: 'nowrap',
              }}
            >
              <ListItemIcon>{link.icon}</ListItemIcon>
              <ListItemText primary={link.label} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ flexShrink: 0, p: 2 }}>
        <Divider />
        {currentUser ? (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Logged in as {currentUser.email}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLogout}
              fullWidth
              size="small"
            >
              Logout
            </Button>
          </>
        ) : (
          <Typography variant="body2">Not logged in</Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Bladetech Application
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            [`& .MuiDrawer-paper`]: {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflowX: 'hidden',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: theme.spacing(0, 1),
              ...theme.mixins.toolbar,
            }}
          >
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Menu
            </Typography>
            <IconButton onClick={handleDrawerToggle} aria-label="close drawer">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
