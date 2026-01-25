import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import { http } from '../lib/http';
import { notify } from '../context/NotificationContext';
import SupplierForm from './SupplierForm';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { Menu, MenuItem as MuiMenuItem, TableSortLabel, Checkbox, FormControlLabel, Popover } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useTablePreferences } from '../hooks/useTablePreferences';

type Supplier = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  paymentTerms?: string;
  rating?: number;
  notes?: string;
  status: string;
};

type SortConfig = {
  key: keyof Supplier;
  direction: 'asc' | 'desc';
};

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | undefined>();
  const [initialValues, setInitialValues] = useState<Omit<Supplier, 'id'> | undefined>();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { visibleColumns, toggleColumn, isVisible } = useTablePreferences('suppliers', ['name', 'email', 'phone', 'gstin', 'terms', 'rating', 'status', 'actions']);

  const rowsPerPage = 10;

  // Filter and Sort suppliers
  const processed = suppliers
    .filter((s) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(searchLower) ||
        (s.email && s.email.toLowerCase().includes(searchLower)) ||
        (s.phone && s.phone.includes(searchQuery)) ||
        (s.gstin && s.gstin.toLowerCase().includes(searchLower)) ||
        (s.address && s.address.toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = String(a[sortConfig.key] || '').toLowerCase();
      const bVal = String(b[sortConfig.key] || '').toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const startIndex = (page - 1) * rowsPerPage;
  const paginated = processed.slice(startIndex, startIndex + rowsPerPage);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get('/suppliers');
      setSuppliers(res.data.suppliers);
    } catch (err: any) {
      // Handled by global interceptor
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleRequestSort = (key: keyof Supplier) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'info';
      case 'On Hold': return 'warning';
      case 'Blacklisted': return 'error';
      default: return 'default';
    }
  };

  function handleOpenForm(supplier?: Supplier) {
    setEditing(supplier);
    setInitialValues(undefined);
    setFormOpen(true);
  }

  function handleClone(supplier: Supplier) {
    const { id, ...rest } = supplier;
    setEditing(undefined);
    setInitialValues({ ...rest });
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditing(undefined);
    setInitialValues(undefined);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await http.delete(`/suppliers/${deleteTarget.id}`);
      notify.showSuccess(`Supplier "${deleteTarget.name}" has been successfully deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      notify.showError(`Could not delete supplier "${deleteTarget.name}"`);
    } finally {
      setDeleting(false);
    }
  }

  function handleSave(supplier: Supplier) {
    load();
    handleCloseForm();
  }

  async function exportToCsv() {
    try {
      const csv = [
        'Name,Email,Phone,Address,GSTIN,Payment Terms,Rating,Notes,Status',
        ...processed.map((s) =>
          [s.name, s.email || '', s.phone || '', s.address || '', s.gstin || '', s.paymentTerms || '', s.rating ?? '', s.notes || '', s.status]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      notify.showError('Export failed');
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Suppliers</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <FilterListIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MuiMenuItem value="All">All Status</MuiMenuItem>
            <MuiMenuItem value="Active">Active</MuiMenuItem>
            <MuiMenuItem value="On Hold">On Hold</MuiMenuItem>
            <MuiMenuItem value="Blacklisted">Blacklisted</MuiMenuItem>
            <MuiMenuItem value="Inactive">Inactive</MuiMenuItem>
          </TextField>

          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
          >
            Columns
          </Button>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Visible Columns</Typography>
              {[
                { id: 'name', label: 'Name' },
                { id: 'email', label: 'Email' },
                { id: 'phone', label: 'Phone' },
                { id: 'address', label: 'Address' },
                { id: 'gstin', label: 'GSTIN' },
                { id: 'terms', label: 'Terms' },
                { id: 'rating', label: 'Rating' },
                { id: 'notes', label: 'Notes' },
                { id: 'status', label: 'Status' },
                { id: 'actions', label: 'Actions' },
              ].map((col) => (
                <FormControlLabel
                  key={col.id}
                  control={
                    <Checkbox
                      checked={isVisible(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      size="small"
                    />
                  }
                  label={col.label}
                />
              ))}
            </Box>
          </Popover>

          <Button variant="outlined" startIcon={<GetAppIcon />} onClick={exportToCsv} size="small">
            Export
          </Button>
          <Button variant="contained" onClick={() => {
            setEditing(undefined);
            setInitialValues(undefined);
            setFormOpen(true);
          }} size="small">
            Add Supplier
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              {isVisible('name') && (
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'name'}
                    direction={sortConfig.direction}
                    onClick={() => handleRequestSort('name')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
              )}
              {isVisible('email') && <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>}
              {isVisible('phone') && <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>}
              {isVisible('address') && <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>}
              {isVisible('gstin') && (
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'gstin'}
                    direction={sortConfig.direction}
                    onClick={() => handleRequestSort('gstin')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    GSTIN
                  </TableSortLabel>
                </TableCell>
              )}
              {isVisible('terms') && <TableCell sx={{ fontWeight: 'bold' }}>Terms</TableCell>}
              {isVisible('rating') && (
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'rating'}
                    direction={sortConfig.direction}
                    onClick={() => handleRequestSort('rating')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Rating
                  </TableSortLabel>
                </TableCell>
              )}
              {isVisible('notes') && <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>}
              {isVisible('status') && (
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.direction}
                    onClick={() => handleRequestSort('status')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
              )}
              {isVisible('actions') && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} align="center">Loading…</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center">No results</TableCell></TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} hover>
                  {isVisible('name') && <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>}
                  {isVisible('email') && <TableCell>{row.email || '-'}</TableCell>}
                  {isVisible('phone') && <TableCell>{row.phone || '-'}</TableCell>}
                  {isVisible('address') && <TableCell>{row.address || '-'}</TableCell>}
                  {isVisible('gstin') && <TableCell>{row.gstin || '-'}</TableCell>}
                  {isVisible('terms') && <TableCell>{row.paymentTerms || '-'}</TableCell>}
                  {isVisible('rating') && <TableCell>{row.rating ?? '-'}</TableCell>}
                  {isVisible('notes') && <TableCell>{row.notes || '-'}</TableCell>}
                  {isVisible('status') && (
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        color={getStatusColor(row.status) as any}
                        sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600, minWidth: 80 }}
                      />
                    </TableCell>
                  )}
                  {isVisible('actions') && (
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenForm(row)} size="small" title="Edit"><EditIcon fontSize="small" /></IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => {
                          const { id, ...rest } = row;
                          setEditing(undefined);
                          setInitialValues(rest);
                          setFormOpen(true);
                        }}
                        title="Clone"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTarget(row);
                        }}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(processed.length / rowsPerPage)}
          page={page}
          onChange={(_, p) => setPage(p)}
          color="primary"
        />
      </Box>

      <SupplierForm
        open={formOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        supplier={editing}
        initialValues={initialValues}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Supplier"
        name={deleteTarget?.name || ''}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
