import { Router } from 'express';
import multer from 'multer';
import { handleSupplierImport, handleRawMaterialImport } from './import.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/suppliers/import', upload.single('file'), handleSupplierImport);
router.post('/raw-materials/import', upload.single('file'), handleRawMaterialImport);

export default router;
