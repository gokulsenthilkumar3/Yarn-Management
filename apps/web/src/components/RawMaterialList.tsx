import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    MenuItem,
    TextField,
    Menu,
    Popover,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import SortIcon from '@mui/icons-material/Sort';
import { useTablePreferences } from '../hooks/useTablePreferences';
import { http } from '../lib/http';
import RawMaterialForm from './RawMaterialForm';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { notify } from '../context/NotificationContext';

type RawMaterial = {
    id: string;
    batchNo: string;
    materialType: string;
    quantity: string;
    unit: string;
    qualityScore: string;
    status: string;
    supplier: { name: string };
    receivedDate: string;
    productionBatches: { batchNumber: string }[];
};

export default function RawMaterialList() {
    const [data, setData] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);
    const [deleting, setDeleting] = useState(false);

    // New State for Search, Filter, Sort, Edit, Clone
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof RawMaterial | 'supplier.name'; direction: 'asc' | 'desc' }>({ key: 'receivedDate', direction: 'desc' });
    const [editing, setEditing] = useState<RawMaterial | undefined>();
    const [initialValues, setInitialValues] = useState<any | undefined>();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const { visibleColumns, toggleColumn, isVisible } = useTablePreferences('raw-materials', [
        'batchNo', 'supplier', 'type', 'quantity', 'cost', 'quality', 'moisture', 'location', 'batches', 'status', 'received', 'notes', 'actions'
    ]);

    // Process Data
    const processed = data
        .filter(row => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                (row.batchNo || '').toLowerCase().includes(searchLower) ||
                (row.supplier?.name || '').toLowerCase().includes(searchLower) ||
                (row.materialType || '').toLowerCase().includes(searchLower);
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let aVal: any = a[sortConfig.key as keyof RawMaterial] || '';
            let bVal: any = b[sortConfig.key as keyof RawMaterial] || '';

            if (sortConfig.key === 'supplier.name') {
                aVal = a.supplier?.name || '';
                bVal = b.supplier?.name || '';
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const handleSort = (key: keyof RawMaterial | 'supplier.name') => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    async function load() {
        setLoading(true);
        try {
            const res = await http.get('/raw-materials');
            setData(res.data.rawMaterials);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await http.delete(`/raw-materials/${deleteTarget.id}`);
            notify.showSuccess(`Raw Material Batch "${deleteTarget.batchNo}" has been successfully deleted.`);
            setDeleteTarget(null);
            load();
        } catch (err: any) {
            // Handled by global interceptor
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h6">Raw Materials Inventory</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search Batch, Supplier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <FilterListIcon sx={{ color: 'action.active', mr: 1 }} />
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="All">All Status</MenuItem>
                        <MenuItem value="IN_STOCK">In Stock</MenuItem>
                        <MenuItem value="USED">Used</MenuItem>
                        <MenuItem value="DEPLETED">Depleted</MenuItem>
                    </TextField>

                    <Button
                        variant="outlined"
                        startIcon={<ViewColumnIcon />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        size="small"
                        sx={{ minWidth: 'auto' }}
                    >
                        Cols
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
                                { id: 'batchNo', label: 'Batch No' },
                                { id: 'supplier', label: 'Supplier' },
                                { id: 'type', label: 'Type' },
                                { id: 'quantity', label: 'Quantity' },
                                { id: 'cost', label: 'Cost' },
                                { id: 'quality', label: 'Quality' },
                                { id: 'moisture', label: 'Moisture' },
                                { id: 'location', label: 'Location' },
                                { id: 'batches', label: 'Prod. Batches' },
                                { id: 'status', label: 'Status' },
                                { id: 'received', label: 'Received' },
                                { id: 'notes', label: 'Notes' },
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

                    <Button variant="contained" onClick={() => {
                        setEditing(undefined);
                        setInitialValues(undefined);
                        setFormOpen(true);
                    }}>Add Stock</Button>
                </Box>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            {isVisible('batchNo') && <TableCell sx={{ fontWeight: 'bold' }}>Batch No</TableCell>}
                            {isVisible('supplier') && <TableCell sx={{ fontWeight: 'bold' }}>Supplier</TableCell>}
                            {isVisible('type') && <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>}
                            {isVisible('quantity') && <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>}
                            {isVisible('cost') && <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>}
                            {isVisible('quality') && <TableCell sx={{ fontWeight: 'bold' }}>Quality</TableCell>}
                            {isVisible('moisture') && <TableCell sx={{ fontWeight: 'bold' }}>Moisture</TableCell>}
                            {isVisible('location') && <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>}
                            {isVisible('batches') && <TableCell sx={{ fontWeight: 'bold' }}>Prod. Batches</TableCell>}
                            {isVisible('status') && <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>}
                            {isVisible('received') && <TableCell sx={{ fontWeight: 'bold' }}>Received</TableCell>}
                            {isVisible('notes') && <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>}
                            {isVisible('actions') && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={13} align="center">Loading...</TableCell></TableRow> :
                            processed.length === 0 ? <TableRow><TableCell colSpan={13} align="center">No stock found</TableCell></TableRow> :
                                processed.map((row: any) => (
                                    <TableRow key={row.id}>
                                        {isVisible('batchNo') && <TableCell>{row.batchNo}</TableCell>}
                                        {isVisible('supplier') && <TableCell>{row.supplier?.name || '-'}</TableCell>}
                                        {isVisible('type') && <TableCell>{row.materialType}</TableCell>}
                                        {isVisible('quantity') && <TableCell>{row.quantity} {row.unit}</TableCell>}
                                        {isVisible('cost') && <TableCell>{row.costPerUnit || '-'}</TableCell>}
                                        {isVisible('quality') && <TableCell>{Number(row.qualityScore).toFixed(1)}</TableCell>}
                                        {isVisible('moisture') && <TableCell>{row.moistureContent ? `${row.moistureContent}%` : '-'}</TableCell>}
                                        {isVisible('location') && <TableCell>{row.warehouseLocation || '-'}</TableCell>}
                                        {isVisible('batches') && (
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {row.productionBatches?.map((b: any) => b.batchNumber).join(', ') || '-'}
                                                </Typography>
                                            </TableCell>
                                        )}
                                        {isVisible('status') && <TableCell><Chip label={row.status} size="small" /></TableCell>}
                                        {isVisible('received') && <TableCell>{new Date(row.receivedDate).toLocaleDateString()}</TableCell>}
                                        {isVisible('notes') && <TableCell>{row.notes || '-'}</TableCell>}
                                        {isVisible('actions') && (
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        setEditing(row);
                                                        setInitialValues(undefined);
                                                        setFormOpen(true);
                                                    }}
                                                    title="Edit"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => {
                                                        setEditing(undefined);
                                                        setInitialValues(row);
                                                        setFormOpen(true);
                                                    }}
                                                    title="Clone"
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => setDeleteTarget(row)}
                                                    title="Delete"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <RawMaterialForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={() => {
                    setFormOpen(false);
                    load();
                    // notify.showSuccess('Stock saved successfully'); // Handled in form now
                }}
                rawMaterial={editing}
                initialValues={initialValues}
            />

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                title="Raw Material Batch"
                name={deleteTarget?.batchNo || ''}
                loading={deleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
