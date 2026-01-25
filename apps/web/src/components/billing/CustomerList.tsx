import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { http } from '../../lib/http';
import AddCustomerDialog from './AddCustomerDialog';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import { notify } from '../../context/NotificationContext';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';

export default function CustomerList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [openAdd, setOpenAdd] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function load() {
        try {
            const res = await http.get('/billing/customers');
            setCustomers(res.data.customers);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => { load(); }, []);

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await http.delete(`/billing/customers/${deleteTarget.id}`);
            notify.showSuccess(`Customer "${deleteTarget.name}" has been successfully deleted.`);
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Customers</Typography>
                <Button variant="contained" onClick={() => setOpenAdd(true)}>Add Customer</Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>GSTIN</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No customers found</TableCell></TableRow> :
                            customers.map((c) => (
                                <TableRow key={c.id} hover>
                                    <TableCell>{c.name}</TableCell>
                                    <TableCell>{c.email || '-'}</TableCell>
                                    <TableCell>{c.phone || '-'}</TableCell>
                                    <TableCell>{c.gstin || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton color="error" size="small" onClick={() => setDeleteTarget(c)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <AddCustomerDialog
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                onSave={() => { setOpenAdd(false); load(); notify.showSuccess('Customer added successfully'); }}
            />

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                title="Customer"
                name={deleteTarget?.name || ''}
                loading={deleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
