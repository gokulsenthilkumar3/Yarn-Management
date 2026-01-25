import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RecyclingIcon from '@mui/icons-material/Recycling';
import { http } from '../lib/http';
import WastageForm from '../components/manufacturing/WastageForm';

export default function WastagePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    mostWastefulStage: '-'
  });

  async function load() {
    setLoading(true);
    try {
      const res = await http.get('/manufacturing/wastage');
      const data = res.data.wastage;
      setLogs(data);

      // Calculate Stats
      const total = data.reduce((sum: number, log: any) => sum + Number(log.quantity), 0);

      // Find most wasteful stage
      const stageMap: Record<string, number> = {};
      data.forEach((log: any) => {
        stageMap[log.stage] = (stageMap[log.stage] || 0) + Number(log.quantity);
      });
      let maxStage = '-';
      let maxVal = 0;
      Object.entries(stageMap).forEach(([stage, val]) => {
        if (val > maxVal) {
          maxVal = val;
          maxStage = stage;
        }
      });

      setStats({
        total,
        count: data.length,
        mostWastefulStage: maxStage
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const KPICard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color, mr: 2 }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Wastage Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
          color="error" // Red primarily for wastage focus
        >
          Log Wastage
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Total Wastage (kg)"
            value={stats.total.toFixed(2)}
            icon={<DeleteIcon fontSize="large" />}
            color="#ef4444"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Most Wasteful Stage"
            value={stats.mostWastefulStage}
            icon={<WarningAmberIcon fontSize="large" />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Total Logs"
            value={stats.count}
            icon={<RecyclingIcon fontSize="large" />}
            color="#3b82f6"
          />
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Batch No</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quantity (kg)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No wastage logged yet</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{new Date(log.loggedAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{log.batch?.batchNumber || 'Unknown'}</TableCell>
                    <TableCell><Chip label={log.stage} size="small" variant="outlined" /></TableCell>
                    <TableCell>{log.wasteType}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>{Number(log.quantity).toFixed(2)}</TableCell>
                    <TableCell>{log.reason || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <WastageForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={load}
      />
    </Box>
  );
}
