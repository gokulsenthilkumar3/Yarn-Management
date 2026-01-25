import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  LinearProgress,
  IconButton,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import FactoryIcon from '@mui/icons-material/Factory';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useNavigate } from 'react-router-dom';
import { http } from '../lib/http';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeBatches: 0,
    inventoryCount: 0,
    rawMaterialCount: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Parallel data fetching for aggregation
        const [billingRes, batchesRes, fgRes, rmRes] = await Promise.all([
          http.get('/billing/invoices'),
          http.get('/manufacturing/batches'),
          http.get('/finished-goods'),
          http.get('/raw-materials'),
        ]);

        // 1. Calculate Stats
        const totalRevenue = billingRes.data.invoices.reduce((acc: number, inv: any) => acc + Number(inv.totalAmount), 0);
        const activeBatches = batchesRes.data.batches.filter((b: any) => b.status !== 'COMPLETED').length;
        const inventoryCount = fgRes.data.finishedGoods.reduce((acc: number, item: any) => acc + Number(item.producedQuantity), 0);
        const rawMaterialCount = rmRes.data.rawMaterials.reduce((acc: number, item: any) => acc + Number(item.quantity), 0);

        setStats({
          totalRevenue,
          activeBatches,
          inventoryCount,
          rawMaterialCount
        });

        // 2. Prepare Chart Data (Aggregated by Month)
        // 2. Prepare Chart Data (Aggregated by Month)
        // Metrics: Total Invoiced, Paid (Same Month), Paid (Total)
        const chartDataMap: Record<string, { name: string, totalInvoiced: number, paidSameMonth: number, paidTotal: number }> = {};

        // Initialize last 6 months
        const monthNames = [];
        for (let i = 5; i >= 0; i--) { // Last 6 months
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleDateString('default', { month: 'short', year: '2-digit' }); // e.g., "Jan 24"
          monthNames.push(key);
          chartDataMap[key] = { name: key, totalInvoiced: 0, paidSameMonth: 0, paidTotal: 0 };
        }

        billingRes.data.invoices.forEach((inv: any) => {
          const createDate = new Date(inv.date);
          const key = createDate.toLocaleDateString('default', { month: 'short', year: '2-digit' });

          // Only process if within the last 6 months window
          if (chartDataMap[key]) {
            const amount = Number(inv.totalAmount);

            // 1. Total Invoiced
            chartDataMap[key].totalInvoiced += amount;

            // 2. Paid (Total) - Lifetime Collection for invoices of this month
            if (inv.status === 'PAID') {
              chartDataMap[key].paidTotal += amount;

              // 3. Paid (Same Month) - Actually collected in the billing month
              if (inv.paidDate) {
                const payDate = new Date(inv.paidDate);
                const isSameMonth = payDate.getMonth() === createDate.getMonth() && payDate.getFullYear() === createDate.getFullYear();
                if (isSameMonth) {
                  chartDataMap[key].paidSameMonth += amount;
                }
              }
            }
          }
        });

        const dynamicChartData = monthNames.map(name => chartDataMap[name]);

        setChartData(dynamicChartData);

        // 3. Mock Recent Activity
        setRecentActivity([
          { id: 1, type: 'Invoice', message: 'Invoice #INV-2024-001 created', time: '2 hours ago', color: '#10b981' },
          { id: 2, type: 'Batch', message: 'Batch #B-105 completed Spinning', time: '4 hours ago', color: '#3b82f6' },
          { id: 3, type: 'Stock', message: 'Raw Cotton stock low (450kg)', time: '5 hours ago', color: '#ef4444' },
        ]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const KPICard = ({ title, value, icon, color, subtext }: any) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, p: 3, bgcolor: `${color}10`, borderRadius: '50%', width: 100, height: 100 }} />
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}15`, color: color }}>
            {icon}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#10b981', bgcolor: '#10b98115', px: 1, py: 0.5, borderRadius: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="caption" fontWeight="bold">12%</Typography>
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b', mb: 0.5 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="500">{title}</Typography>
        {subtext && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{subtext}</Typography>}
      </CardContent>
    </Card>
  );

  const QuickAction = ({ title, icon, color, onClick }: any) => (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
      }}
    >
      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
      <Typography variant="subtitle2" fontWeight="600">{title}</Typography>
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">Welcome back, here's what's happening today.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => navigate('/manufacturing')}>
            New Batch
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* KPI Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue / 1000).toFixed(1)}k`}
            icon={<AttachMoneyIcon />}
            color="#3b82f6"
            subtext="vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Batches"
            value={stats.activeBatches}
            icon={<FactoryIcon />}
            color="#f59e0b"
            subtext="In production lines"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Yarn Produced"
            value={`${(stats.inventoryCount / 1000).toFixed(1)}t`}
            icon={<InventoryIcon />}
            color="#10b981"
            subtext="Finished goods"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Raw Material"
            value={`${(stats.rawMaterialCount / 1000).toFixed(1)}t`}
            icon={<InventoryIcon />}
            color="#8b5cf6"
            subtext="Available stock"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          {/* Revenue Trend */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 400, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Financial Trend</Typography>
            </Box>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="totalInvoiced" name="Total Invoiced Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="paidTotal" name="Actually Paid (Lifetime)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="paidSameMonth" name="Actually Paid (Updated Status)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Recent Activity List */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Activity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentActivity.map(item => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}>
                  <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 40, height: 40 }}>
                    <NotificationsActiveIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="600">{item.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                  </Box>
                  <Chip label={item.type} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quick Actions</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
            <QuickAction
              title="New Invoice"
              icon={<AttachMoneyIcon />}
              color="#3b82f6"
              onClick={() => navigate('/billing')}
            />
            <QuickAction
              title="Start Production"
              icon={<FactoryIcon />}
              color="#f59e0b"
              onClick={() => navigate('/manufacturing')}
            />
            <QuickAction
              title="Add Supplier"
              icon={<AddIcon />}
              color="#10b981"
              onClick={() => navigate('/suppliers')}
            />
            <QuickAction
              title="Inventory Check"
              icon={<InventoryIcon />}
              color="#8b5cf6"
              onClick={() => navigate('/inventory')}
            />
          </Box>

          {/* Low Stock Alert Preview */}
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff1f2', color: '#be123c', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <NotificationsActiveIcon />
              <Typography variant="subtitle1" fontWeight="bold">Attention Needed</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Raw Cotton inventory is below 500kg. Production for Batch B-105 might be delayed.
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/inventory')}
              sx={{ borderColor: '#be123c', color: '#be123c', '&:hover': { borderColor: '#9f1239', bgcolor: '#be123c10' } }}
            >
              View Inventory
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
