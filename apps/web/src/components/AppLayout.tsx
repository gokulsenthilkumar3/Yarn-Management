import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { http } from '../lib/http';
import { clearAccessToken } from '../lib/auth';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from './NotificationCenter';

const drawerWidth = 240;

type NavItem = {
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Procurement', to: '/procurement' },
  { label: 'Manufacturing', to: '/manufacturing' },
  { label: 'Wastage', to: '/wastage' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Billing', to: '/billing' },
  { label: 'Reports', to: '/reports' },
  { label: 'Users', to: '/users' },
  { label: 'Settings', to: '/settings' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  async function logout() {
    try {
      await http.post('/auth/logout');
    } finally {
      clearAccessToken();
      navigate('/login', { replace: true });
    }
  }

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={isMobile ? handleDrawerToggle : undefined}
            sx={{
              [`&.active`]: {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' }
              },
              minHeight: 48,
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
            Yarn Management
          </Typography>
          <Typography variant="h6" noWrap sx={{ display: { xs: 'block', sm: 'none' } }}>
            YM
          </Typography>
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            maxWidth: { xs: 300, sm: 600 },
            mx: 'auto'
          }}>
            <GlobalSearch />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationCenter />
            <Button
              color="inherit"
              onClick={logout}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Logout
            </Button>
            <IconButton
              color="inherit"
              onClick={logout}
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              size="small"
            >
              <Typography variant="caption">Exit</Typography>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
