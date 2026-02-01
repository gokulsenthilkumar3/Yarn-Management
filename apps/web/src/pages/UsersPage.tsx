import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Avatar,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { notify } from '../context/NotificationContext';
import { http } from '../lib/http';
import { useEffect } from 'react';

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // TODO: Add proper TS interface
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await http.get('/users');
      setUsers(data.users);
    } catch (e) {
      console.error(e);
      notify.showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string) => {
    try {
      await http.post('/users/invite', { email }); // Assuming invite endpoint or create endpoint
      notify.showSuccess(`Invitation sent to ${email}`);
      setOpen(false);
      fetchUsers();
    } catch (e: any) {
      notify.showError(e.response?.data?.message || 'Failed to invite user');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Invite User
        </Button>
      </Box>

      <Grid container spacing={2}>
        {users.map((user) => (
          <Grid item xs={12} md={4} key={user.id}>
            <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}><PersonIcon /></Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight="bold">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                <Chip label={user.role} size="small" variant="outlined" />
                <Chip
                  label={user.status}
                  size="small"
                  color={user.status === 'ACTIVE' ? 'success' : 'default'}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <InviteDialog open={open} onClose={() => setOpen(false)} onInvite={handleInvite} />
    </Box>
  );
}

function InviteDialog({ open, onClose, onInvite }: any) {
  const [email, setEmail] = useState('');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invite User</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Email Address"
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onInvite(email)}>Send Invite</Button>
      </DialogActions>
    </Dialog>
  )
}
