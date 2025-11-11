import { type ReactElement, useState, type ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination
} from '@mui/material';
import { ExpandMore, Refresh } from '@mui/icons-material';
import ArchiveItem from './ArchiveItem';
import type { Archive } from '../types';

interface ArchiveListProps {
  archives: Archive[];
  onStopArchive: (archiveId: string) => void;
  onRefreshArchives: () => void;
}

const ArchiveList = ({ archives, onStopArchive, onRefreshArchives }: ArchiveListProps): ReactElement => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(archives.length / itemsPerPage);
  
  const validCurrentPage = currentPage > totalPages && totalPages > 0 ? totalPages : currentPage;

  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArchives = archives.slice(startIndex, endIndex);

  const handlePageChange = (_event: ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    onRefreshArchives();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="h3">
          Recent Archives ({archives.length})
        </Typography>
        <Button
          onClick={handleRefresh}
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
        >
          Refresh
        </Button>
      </Box>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="archive-list-content"
          id="archive-list-header"
        >
          <Typography variant="body1">
            {archives.length === 0 
              ? 'No archives yet' 
              : `View ${archives.length} archive${archives.length !== 1 ? 's' : ''}`
            }
          </Typography>
        </AccordionSummary>
      <AccordionDetails>
        {archives.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No archives found. Start an archive to see it listed here.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Stack spacing={2}>
              {currentArchives.map((archive) => (
                <ArchiveItem 
                  key={archive.id}
                  archive={archive}
                  onStopArchive={onStopArchive}
                />
              ))}
            </Stack>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={validCurrentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
    </Box>
  );
};export default ArchiveList;
