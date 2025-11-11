import { type ReactElement } from 'react';
import type { ArchiveType, LoadingState } from '../types';

interface ArchiveControlsProps {
  currentSession: string;
  currentArchiveId: string;
  loading: LoadingState;
  onStartArchive: (type: ArchiveType) => void;
  onListArchives: () => void;
  onStopArchive: () => void;
}

const ArchiveControls = ({
  currentSession,
  currentArchiveId,
  loading,
  onStartArchive,
  onListArchives,
  onStopArchive
}: ArchiveControlsProps): ReactElement => {
  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Archive Management</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={() => onStartArchive('audio-only')} 
          disabled={loading.includes('archive') || !currentSession}
          style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
        >
          {loading === 'archive-audio-only' ? 'Starting...' : 'Start Audio-Only'}
        </button>
        <button 
          onClick={() => onStartArchive('composed')} 
          disabled={loading.includes('archive') || !currentSession}
          style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
        >
          {loading === 'archive-composed' ? 'Starting...' : 'Start Composed'}
        </button>
        <button 
          onClick={() => onStartArchive('individual')} 
          disabled={loading.includes('archive') || !currentSession}
          style={{ marginBottom: '0.5rem' }}
        >
          {loading === 'archive-individual' ? 'Starting...' : 'Start Individual'}
        </button>
      </div>
      
      <div>
        <button 
          onClick={onListArchives} 
          disabled={loading === 'archives'}
          style={{ marginRight: '1rem' }}
        >
          {loading === 'archives' ? 'Loading...' : 'List Archives'}
        </button>
        <button 
          onClick={onStopArchive} 
          disabled={loading === 'stop' || !currentArchiveId}
        >
          {loading === 'stop' ? 'Stopping...' : 'Stop Current Archive'}
        </button>
      </div>
      
      {currentArchiveId && (
        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          <strong>Current Archive ID:</strong> <code>{currentArchiveId}</code>
        </div>
      )}
    </div>
  );
};

export default ArchiveControls;
