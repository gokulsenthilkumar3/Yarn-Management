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
    Typography
} from '@mui/material';
import { http } from '../../lib/http';
import CreateInvoiceDialog from './CreateInvoiceDialog';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [openCreate, setOpenCreate] = useState(false);

    async function load() {
        try {
            const res = await http.get('/billing/invoices');
            setInvoices(res.data.invoices);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Invoices</Typography>
                <Button variant="contained" onClick={() => setOpenCreate(true)}>New Invoice</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {invoices.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No invoices found</TableCell></TableRow> :
                            invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell>{inv.invoiceNumber}</TableCell>
                                    <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{inv.customer?.name}</TableCell>
                                    <TableCell>{Number(inv.totalAmount).toFixed(2)}</TableCell>
                                    <TableCell><Chip label={inv.status} size="small" /></TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <CreateInvoiceDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSave={() => { setOpenCreate(false); load(); }}
            />
        </Box>
    );
}
