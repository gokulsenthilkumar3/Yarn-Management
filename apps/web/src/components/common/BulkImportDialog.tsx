import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    LinearProgress,
    Alert
} from '@mui/material';
import { useState, useRef } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { http } from '../../lib/http';
import { notify } from '../../context/NotificationContext';

interface BulkImportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    entityName: string; // e.g. "Suppliers", "Raw Materials"
    endpoint: string; // e.g. "/suppliers/import"
    templateUrl?: string; // Optional URL to download template
}

export default function BulkImportDialog({
    open,
    onClose,
    onSuccess,
    entityName,
    endpoint,
    templateUrl
}: BulkImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await http.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            notify.showSuccess(`${entityName} imported successfully`);
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Import failed. Please check your file format.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        setUploading(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={!uploading ? handleClose : undefined} maxWidth="sm" fullWidth>
            <DialogTitle>Import {entityName}</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: '#fafafa',
                        '&:hover': { bgcolor: '#f0f0f0' },
                        mt: 1
                    }}
                    onClick={() => !uploading && inputRef.current?.click()}
                >
                    <input
                        type="file"
                        hidden
                        ref={inputRef}
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                        {file ? file.name : 'Click to select CSV or Excel file'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Supported formats: .csv, .xlsx
                    </Typography>
                </Box>

                {uploading && <LinearProgress sx={{ mt: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {templateUrl && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button href={templateUrl} download size="small">
                            Download Template
                        </Button>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!file || uploading}
                >
                    {uploading ? 'Importing...' : 'Upload & Import'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
