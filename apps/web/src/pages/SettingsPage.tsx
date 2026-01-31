import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { notify } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';
import WebAuthnSetup from '../components/WebAuthnSetup';
import SessionManagement from '../components/SessionManagement';

export default function SettingsPage() {
  const { mode, toggleTheme } = useThemeContext();
  const [settings, setSettings] = useState({
    companyName: 'Yarn Master Ltd.',
    taxId: 'GSTIN-123456789',
    email: 'admin@yarnmaster.com',
    notifications: true
  });
  const [tab, setTab] = useState(0);

  const handleSave = () => {
    // Save logic here
    notify.showSuccess('Settings saved successfully');
  };

  return (
    <Box maxWidth="md">
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Settings</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="General" />
          <Tab label="Security" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <GeneralSettings
          settings={settings}
          setSettings={setSettings}
          handleSave={handleSave}
          mode={mode}
          toggleTheme={toggleTheme}
        />
      )}

      {tab === 1 && (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <WebAuthnSetup />
          <Divider sx={{ my: 4 }} />
          <SessionManagement />
        </Paper>
      )}
    </Box>
  );
}

// Extracted General Settings for cleanliness
function GeneralSettings({ settings, setSettings, handleSave, mode, toggleTheme }: any) {
  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Company Profile</Typography>
      <Box sx={{ display: 'grid', gap: 2, mb: 4 }}>
        <TextField
          label="Company Name"
          value={settings.companyName}
          onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
          fullWidth
        />
        <TextField
          label="Tax ID / GSTIN"
          value={settings.taxId}
          onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
          fullWidth
        />
        <TextField
          label="Admin Email"
          value={settings.email}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          fullWidth
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>Application Preferences</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={<Switch checked={settings.notifications} onChange={e => setSettings({ ...settings, notifications: e.target.checked })} />}
          label="Enable Email Notifications"
        />
        <FormControlLabel
          control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
          label="Dark Mode"
        />
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Paper>
  );
}
