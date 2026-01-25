import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { http } from '../lib/http';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    monthlyRevenue: [],
    wasteByStage: [],
    productionTrend: []
  });

  useEffect(() => {
    // Mock Data aggregation (In real app, fetch from specific stats endpoints)
    async function load() {
      setLoading(true);
      try {
        // Determine monthly revenue from mock invoices
        const billingRes = await http.get('/billing/invoices');
        // Mocking monthly aggregation
        const revenueData = [
          { name: 'Jan', amount: 50000 },
          { name: 'Feb', amount: 30000 },
          { name: 'Mar', amount: 75000 },
          { name: 'Apr', amount: 45000 },
          { name: 'May', amount: 60000 },
          { name: 'Jun', amount: 90000 },
        ];

        const wasteRes = await http.get('/manufacturing/wastage');
        const wasteMap: Record<string, number> = {};
        wasteRes.data.wastage.forEach((w: any) => {
          wasteMap[w.stage] = (wasteMap[w.stage] || 0) + Number(w.quantity);
        });
        const wasteData = Object.entries(wasteMap).map(([name, value]) => ({ name, value }));

        // Mock Production Trend
        const prodData = [
          { name: 'Wk 1', output: 4000 },
          { name: 'Wk 2', output: 3500 },
          { name: 'Wk 3', output: 5000 },
          { name: 'Wk 4', output: 4800 },
        ];

        setData({
          monthlyRevenue: revenueData,
          wasteByStage: wasteData,
          productionTrend: prodData
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Reports & Analytics</Typography>

      <Grid container spacing={3}>
        {/* Financial Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Monthly Revenue (Mock)</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Waste Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Wastage Distribution</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.wasteByStage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {data.wasteByStage.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Production Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, height: 350 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Weekly Production Output</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.productionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="output" fill="#82ca9d" name="Yarn Output (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
