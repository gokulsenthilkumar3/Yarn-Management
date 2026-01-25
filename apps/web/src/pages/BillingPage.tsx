import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { http } from '../lib/http';
import { notify } from '../context/NotificationContext';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, invoice: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      await http.delete(`/billing/invoices/${selectedInvoice.id}`);
      notify.showSuccess('Invoice deleted');
      load();
    } catch (e) {
      console.error(e);
      notify.showError('Failed to delete invoice');
    } finally {
      handleCloseMenu();
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedInvoice) return;
    try {
      await http.patch(`/billing/invoices/${selectedInvoice.id}`, { status });
      notify.showSuccess(`Invoice marked as ${status}`);
      load();
    } catch (e) {
      console.error(e);
      notify.showError('Failed to update status');
    } finally {
      handleCloseMenu();
    }
  };

  const handlePrintInvoice = () => {
    // Open print view in new tab
    window.open(`/billing/print/${selectedInvoice.id}`, '_blank');
    handleCloseMenu();
  };

  // Filter Logic
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const filteredInvoices = invoices.filter(inv => {
    if (!selectedMonth) return true;
    return inv.date.startsWith(selectedMonth);
  });

  // New Invoice State
  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    billingCycle: '',
    items: [{ description: 'Yarn Batch', quantity: 1, price: 100 }]
  });

  async function load() {
    setLoading(true);
    try {
      const res = await http.get('/billing/invoices');
      setInvoices(res.data.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, price: 100 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...newInvoice.items];
    (newItems[index] as any)[field] = value;
    setNewInvoice({ ...newInvoice, items: newItems });
  };

  async function handleSubmit() {
    if (!newInvoice.customerName || newInvoice.items.length === 0) {
      notify.showError('Please fill in all details');
      return;
    }

    try {
      // Ensure date is ISO for backend validation
      const payload = {
        ...newInvoice,
        date: new Date(newInvoice.date).toISOString()
      };
      await http.post('/billing/invoices', payload);
      notify.showSuccess('Invoice created');
      setOpenForm(false);
      setNewInvoice({
        customerName: '',
        date: new Date().toISOString().slice(0, 10),
        billingCycle: '',
        items: [{ description: 'Yarn Batch', quantity: 1, price: 100 }]
      });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Billing & Invoices</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            type="month"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ width: 200, bgcolor: 'background.paper' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
            Create Invoice
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No invoices found for this month</TableCell></TableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(inv.totalAmount).toLocaleString()}</TableCell>
                  <TableCell><Chip label={inv.status} size="small" color={getStatusColor(inv.status) as any} /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleOpenMenu(e, inv)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{ elevation: 2, sx: { minWidth: 150, borderRadius: 2 } }}
      >
        <MenuItem onClick={handlePrintInvoice}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print / Download</ListItemText>
        </MenuItem>
        {selectedInvoice?.status !== 'PAID' && (
          <MenuItem onClick={() => handleUpdateStatus('PAID')} sx={{ color: 'success.main' }}>
            <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Mark as Paid</ListItemText>
          </MenuItem>
        )}
        {selectedInvoice?.status === 'PAID' && (
          <MenuItem onClick={() => handleUpdateStatus('PENDING')} sx={{ color: 'warning.main' }}>
            <ListItemIcon><PendingIcon fontSize="small" color="warning" /></ListItemIcon>
            <ListItemText>Mark as Pending</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteInvoice} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Customer Name"
              fullWidth
              value={newInvoice.customerName}
              onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
            />

            <Typography variant="subtitle2">Items</Typography>
            {newInvoice.items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  label="Description"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                />
                <TextField
                  label="Qty"
                  type="number"
                  size="small"
                  sx={{ width: 80 }}
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                />
                <TextField
                  label="Price"
                  type="number"
                  size="small"
                  sx={{ width: 100 }}
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                />
                <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={handleAddItem}>Add Item</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}
