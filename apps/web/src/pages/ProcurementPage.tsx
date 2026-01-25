import { useState } from 'react';
import { Container, Tabs, Tab, Box } from '@mui/material';
import SupplierList from '../components/SupplierList';
import RawMaterialList from '../components/RawMaterialList';

export default function ProcurementPage() {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Suppliers" />
          <Tab label="Raw Materials" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 2 }}>
        {tab === 0 && <SupplierList />}
        {tab === 1 && <RawMaterialList />}
      </Box>
    </Container>
  );
}
