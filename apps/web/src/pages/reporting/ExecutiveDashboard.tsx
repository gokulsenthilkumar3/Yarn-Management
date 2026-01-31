import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    LinearProgress,
    Card,
    CardContent,
    Alert
} from '@mui/material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { http } from '../../lib/http';
import { TrendingUp, TrendingDown, AttachMoney, Settings, People } from '@mui/icons-material';

interface DashboardData {
    financial: {
        revenue: number;
        profit: number;
        growth: number;
    };
    operations: {
        activeBatches: number;
        activeOperators: number;
        efficiency: number;
    };
    charts: {
        revenueVsCost: any[];
        operationalEfficiency: any[];
    }
}

export default function ExecutiveDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Use the new endpoint
                const response = await http.get('/reporting/dashboard/kpis');
                setData(response.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <LinearProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return <Alert severity="warning">No data available</Alert>;

    return (
        <Grid container spacing={3}>
            {/* KPI Cards */}
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Total Revenue</Typography>
                            <AttachMoney color="primary" />
                        </Box>
                        <Typography variant="h4">₹{data.financial.revenue.toLocaleString()}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            {data.financial.growth >= 0 ? <TrendingUp color="success" fontSize="small" /> : <TrendingDown color="error" fontSize="small" />}
                            <Typography variant="body2" color={data.financial.growth >= 0 ? "success.main" : "error.main"} sx={{ ml: 0.5 }}>
                                {data.financial.growth}% vs last month
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Operating Profit</Typography>
                            <AttachMoney color="secondary" />
                        </Box>
                        <Typography variant="h4">₹{data.financial.profit.toLocaleString()}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Estimated Margin: 25%
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Active Operations</Typography>
                            <Settings color="action" />
                        </Box>
                        <Typography variant="h4">{data.operations.activeBatches}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Batches In Progress
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Workforce</Typography>
                            <People color="info" />
                        </Box>
                        <Typography variant="h4">{data.operations.activeOperators}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Active Operators
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Revenue Chart */}
            <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Revenue Trend (Last 6 Months)</Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.charts.revenueVsCost}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Revenue" />
                            <Area type="monotone" dataKey="cost" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Cost" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* Operations Efficiency */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Operational Efficiency (Daily)</Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.charts.operationalEfficiency}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="efficiency" stroke="#ffc658" fill="#ffc658" name="OEE %" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
        </Grid>
    );
}
