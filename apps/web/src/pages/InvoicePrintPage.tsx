import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Divider, Button } from '@mui/material';
import { http } from '../lib/http';
import PrintIcon from '@mui/icons-material/Print';

export default function InvoicePrintPage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await http.get('/billing/invoices');
                // In a real app we would get by ID, but we have filtered list in mock
                const found = res.data.invoices.find((i: any) => i.id === id);
                setInvoice(found);

                // Auto print removed based on user feedback
                // if (found) {
                //    setTimeout(() => window.print(), 500);
                // }
            } catch (e) {
                console.error(e);
            }
        }
        load();
    }, [id]);

    if (!invoice) return <Box p={4}>Loading invoice...</Box>;

    return (
        <Box sx={{ p: 4, maxWidth: '800px', mx: 'auto', bgcolor: 'white', color: 'black' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, '@media print': { display: 'none' } }}>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                    Print / Save as PDF
                </Button>
            </Box>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#2563eb' }}>INVOICE</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>#{invoice.invoiceNumber}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight="bold">Yarn Master Ltd.</Typography>
                    <Typography variant="body2">123 Textile Avenue</Typography>
                    <Typography variant="body2">Coimbatore, TN, 641001</Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Bill To */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>Allowed To</Typography>
                    <Typography variant="h6" fontWeight="bold">{invoice.customerName}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>Date</Typography>
                    <Typography variant="body1">{new Date(invoice.date).toLocaleDateString()}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', mt: 1, display: 'block' }}>Status</Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ color: invoice.status === 'PAID' ? 'green' : 'orange' }}>
                        {invoice.status}
                    </Typography>

                    {invoice.billingCycle && (
                        <>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', mt: 1, display: 'block' }}>Billing Cycle</Typography>
                            <Typography variant="body1">{invoice.billingCycle}</Typography>
                        </>
                    )}
                </Box>
            </Box>

            {/* Items */}
            <Table size="small" sx={{ mb: 4 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {invoice.items && invoice.items.map((item: any, i: number) => (
                        <TableRow key={i}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.price}</TableCell>
                            <TableCell align="right">₹{(item.quantity * item.price).toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                    {/* Handling mock data structure legacy */}
                    {!invoice.items && (
                        <TableRow>
                            <TableCell>Generic Yarn Batch</TableCell>
                            <TableCell align="right">1</TableCell>
                            <TableCell align="right">₹{invoice.totalAmount}</TableCell>
                            <TableCell align="right">₹{Number(invoice.totalAmount).toLocaleString()}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Total */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: '250px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Subtotal:</Typography>
                        <Typography>₹{Number(invoice.totalAmount).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Tax (5%):</Typography>
                        <Typography>₹{(Number(invoice.totalAmount) * 0.05).toLocaleString()}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">Total:</Typography>
                        <Typography variant="h6" fontWeight="bold">₹{(Number(invoice.totalAmount) * 1.05).toLocaleString()}</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 8, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="caption">Thank you for your business!</Typography>
            </Box>
        </Box>
    );
}
