import { useState, type ReactElement } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Card,
  CardContent,
  Link
} from '@mui/material';
import { Stop, Download, PlayArrow, Archive as ArchiveIcon, OpenInNew } from '@mui/icons-material';
import type { Archive } from '../types';
import ArchivePlayModal from './ArchivePlayModal';

interface ArchiveItemProps {
  archive: Archive;
  onStopArchive: (archiveId: string) => void;
}

const ArchiveItem = ({ archive, onStopArchive }: ArchiveItemProps): ReactElement => {
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);

  const isZipFile = archive.url?.toLowerCase().endsWith('.zip') ||
    archive.url?.toLowerCase().includes('.zip');

  const handleDownload = () => {
    if (archive.url) {
      window.open(archive.url, '_blank');
    }
  };

  const handlePlay = () => {
    setIsPlayModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPlayModalOpen(false);
  };
  return (
    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h6" component="h4" gutterBottom>
              {archive.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={archive.status}
                size="small"
                color={archive.status === 'started' ? 'success' : 'default'}
              />
              <Chip
                label={archive.outputMode}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              ID:{' '}
              <Link
                href={`https://tools.vonage.com/video/archive-inspector/archive/${archive.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  verticalAlign: 'middle'
                }}
              >
                {archive.id}
                <OpenInNew sx={{ fontSize: 14 }} />
              </Link>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            {archive.status === 'started' && (
              <Button
                onClick={() => onStopArchive(archive.id)}
                variant="contained"
                color="error"
                size="small"
                startIcon={<Stop />}
              >
                Stop Archive
              </Button>
            )}
            {(archive.status === 'available' || archive.status === 'uploaded') && archive.url && (
              <>
                <Button
                  onClick={handlePlay}
                  variant="contained"
                  color={isZipFile ? "warning" : "success"}
                  size="small"
                  sx={{ minWidth: 'auto', px: 0.75 }}
                  title={isZipFile ? "View Archive Details" : "Play Video"}
                >
                  {isZipFile ? <ArchiveIcon /> : <PlayArrow />}
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: 'auto', px: 0.75 }}
                  title="Download"
                >
                  <Download />
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </CardContent>

      <ArchivePlayModal
        open={isPlayModalOpen}
        onClose={handleCloseModal}
        archive={archive}
      />
    </Card>
  );
};

export default ArchiveItem;
