import { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress,
    Typography,
    Chip
} from '@mui/material';
import { http } from '../../lib/http';

export default function FinishedGoodsList() {
    const [goods, setGoods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const res = await http.get('/finished-goods');
            setGoods(res.data.finishedGoods);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LinearProgress />;

    return (
        <Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Batch No</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Yarn Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Quantity (kg)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Packed Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Days in Stock</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {goods.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center">No finished goods in stock</TableCell></TableRow>
                        ) : (
                            goods.map((item) => {
                                const daysInStock = Math.floor((new Date().getTime() - new Date(item.packingDate).getTime()) / (1000 * 3600 * 24));
                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>{item.batch?.batchNumber}</TableCell>
                                        <TableCell>{item.batch?.rawMaterial?.materialType}</TableCell>
                                        <TableCell><Chip label={item.yarnCount} size="small" color="primary" variant="outlined" /></TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{item.producedQuantity}</TableCell>
                                        <TableCell>{item.qualityGrade || '-'}</TableCell>
                                        <TableCell>{new Date(item.packingDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{item.warehouseLocation || 'Main Warehouse'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${daysInStock} days`}
                                                size="small"
                                                color={daysInStock > 30 ? 'warning' : 'default'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
