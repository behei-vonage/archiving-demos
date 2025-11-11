import { useState, useEffect, type ReactElement } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { Close, Download, Archive as ArchiveIcon, PlayArrow } from '@mui/icons-material';
import type { Archive } from '../types';
import { extractArchive, getBackendUrl, type ExtractedFile } from '../utils/api';

interface ArchivePlayModalProps {
  open: boolean;
  onClose: () => void;
  archive: Archive | null;
}

const ArchivePlayModal = ({ open, onClose, archive }: ArchivePlayModalProps): ReactElement => {
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ExtractedFile | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const isZipFile = archive?.url?.toLowerCase().endsWith('.zip') || 
                   archive?.url?.toLowerCase().includes('.zip');

  const handleExtractArchive = async () => {
    if (!archive?.url) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const result = await extractArchive(archive.url, archive.id);
      if (result.success && result.files.length > 0) {
        setExtractedFiles(result.files);
        if (result.files.length === 1) {
          setSelectedFile(result.files[0]);
        }
      } else {
        setExtractionError('No video files found in archive');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError('Failed to extract archive. Please try downloading the ZIP file instead.');
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    if (open && isZipFile && archive?.url && extractedFiles.length === 0) {
      handleExtractArchive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isZipFile, archive?.url]);

  useEffect(() => {
    if (!open) {
      setExtractedFiles([]);
      setSelectedFile(null);
      setIsExtracting(false);
      setExtractionError(null);
    }
  }, [open]);

  const handleDownload = () => {
    if (archive?.url) {
      const link = document.createElement('a');
      link.href = archive.url;
      link.download = `${archive.name}${isZipFile ? '.zip' : '.mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileSelect = (file: ExtractedFile) => {
    setSelectedFile(file);
  };

  if (!archive) {
    return <></>;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Play Archive: {archive.name}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isZipFile ? (
          <Box>
            {isExtracting ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Extracting archive...
                </Typography>
              </Box>
            ) : extractionError ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ArchiveIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Individual Archive (ZIP File)
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {extractionError}
                </Alert>
                <Button 
                  variant="contained" 
                  startIcon={<Download />} 
                  onClick={handleDownload}
                  sx={{ mt: 2 }}
                >
                  Download Archive
                </Button>
              </Box>
            ) : extractedFiles.length > 0 ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Found {extractedFiles.length} video file{extractedFiles.length > 1 ? 's' : ''} in this archive.
                </Alert>
                
                {extractedFiles.length > 1 && !selectedFile && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Select a video to play:
                    </Typography>
                    <List>
                      {extractedFiles.map((file, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemButton onClick={() => handleFileSelect(file)}>
                            <PlayArrow sx={{ mr: 1 }} />
                            <ListItemText primary={file.filename} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {(selectedFile || extractedFiles.length === 1) && (
                  <Box>
                    {extractedFiles.length > 1 && (
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          Playing: {selectedFile?.filename}
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => setSelectedFile(null)}
                        >
                          Choose Different Video
                        </Button>
                      </Box>
                    )}
                    <Box sx={{ width: '100%', height: 400 }}>
                      <video 
                        controls 
                        width="100%" 
                        height="100%"
                        src={`${getBackendUrl()}${selectedFile?.url || extractedFiles[0].url}`}
                        style={{ backgroundColor: '#000' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Download />} 
                    onClick={handleDownload}
                    size="small"
                  >
                    Download Original ZIP
                  </Button>
                </Box>
              </Box>
            ) : null}
          </Box>
        ) : archive.url ? (
          <Box sx={{ width: '100%', height: 400 }}>
            <video 
              controls 
              width="100%" 
              height="100%"
              src={archive.url}
              style={{ backgroundColor: '#000' }}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Archive not available
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchivePlayModal;
