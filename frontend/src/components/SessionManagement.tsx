import { type ReactElement } from 'react';
import type { LoadingState } from '../types';

interface SessionManagementProps {
  currentSession: string;
  currentToken: string;
  loading: LoadingState;
  onCreateSession: () => void;
  onGenerateToken: () => void;
}

const SessionManagement = ({
  currentSession,
  currentToken,
  loading,
  onCreateSession,
  onGenerateToken
}: SessionManagementProps): ReactElement => {
  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Session Management</h3>
      <button 
        onClick={onCreateSession} 
        disabled={loading === 'session'}
        style={{ marginRight: '1rem', marginBottom: '0.5rem' }}
      >
        {loading === 'session' ? 'Creating...' : 'Create Session'}
      </button>
      <button 
        onClick={onGenerateToken} 
        disabled={loading === 'token' || !currentSession}
        style={{ marginBottom: '0.5rem' }}
      >
        {loading === 'token' ? 'Generating...' : 'Generate Token'}
      </button>
      {currentSession && (
        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          <strong>Session ID:</strong> <code>{currentSession.slice(0, 20)}...</code>
        </div>
      )}
      {currentToken && (
        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          <strong>Token:</strong> <code>{currentToken.slice(0, 20)}...</code>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
