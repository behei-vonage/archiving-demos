import { useState, useMemo, useEffect } from 'react';
import type { Archive, ArchiveType, LoadingState, ApiResponse, VideoSession, ConnectionState } from '../types';
import { apiCall } from '../utils/api';
import { getRandomFact } from '../utils/randomFacts';

export const useVonageApi = () => {
  const [currentSession, setCurrentSession] = useState<string>('');
  const [currentToken, setCurrentToken] = useState<string>('');
  const [currentArchiveId, setCurrentArchiveId] = useState<string | null>(null);
  const [currentRenderId, setCurrentRenderId] = useState<string | null>(null);
  const [composerArchiveId, setComposerArchiveId] = useState<string | null>(null);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState<LoadingState>('');
  const [results, setResults] = useState<string>('');
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isPublishing: false
  });

  const createSession = async (): Promise<string | null> => {
    setLoading('session');
    try {
      const result = await apiCall('/sessions', 'POST') as ApiResponse & { sessionId?: string };
      if (result.success && result.sessionId) {
        setCurrentSession(result.sessionId);
        return result.sessionId;
      } else {
        return null;
      }
    } catch (error) {
      console.error('CREATE SESSION ERROR', error);
      return null;
    } finally {
      setLoading('');
    }
  };

  const generateToken = async (sessionId?: string): Promise<string | null> => {
    const session = sessionId || currentSession;
    if (!session) {
      console.error('No session ID available for token generation');
      return null;
    }
    setLoading('token');
    try {
      const result = await apiCall(`/sessions/${session}/tokens`, 'POST', {
        role: 'moderator',
      }) as ApiResponse & { token?: string };
      if (result.success && result.token) {
        setCurrentToken(result.token);
        return result.token;
      } else {
        console.error('GENERATE TOKEN ERROR', result);
        return null;
      }
    } catch (error) {
      console.error('GENERATE TOKEN ERROR', { error: error instanceof Error ? error.message : String(error) });
      return null;
    } finally {
      setLoading('');
    }
  };

  const listArchives = async () => {
    setLoading('archives');
    try {
      const result = await apiCall('/archives') as ApiResponse & { archives?: Archive[] };
      if (result.success) {
        setArchives(result.archives || []);
      } else {
        console.error('LIST ARCHIVES ERROR', result);
      }
    } catch (error) {
      console.error('LIST ARCHIVES ERROR', { error: error instanceof Error ? error.message : String(error) });
    }
    setLoading('');
  };

  const startArchive = async (type: ArchiveType, sessionId?: string) => {
    const activeSessionId = sessionId || currentSession;
    if (!activeSessionId) {
      console.error('No session ID available to start archive');
      return;
    }
    setLoading(`archive-${type}`);
    try {
      const randomFact = getRandomFact();
      const body: Record<string, unknown> = {
        sessionId: activeSessionId,
        name: `${randomFact} - ${type.charAt(0).toUpperCase() + type.slice(1)} Archive Test`
      };
      
      if (type === 'composed') {
        body.resolution = '1280x720';
      }
      
      const result = await apiCall(`/archives/start/${type}`, 'POST', body) as ApiResponse & { archiveId?: string };
      if (result.success) {
        setCurrentArchiveId(result.archiveId || '');
        listArchives();
      } else {
        console.error(`START ${type.toUpperCase()} ARCHIVE ERROR`, result);
        alert(`Failed to start archive: ${(result as { error?: string; message?: string }).error || (result as { message?: string }).message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`START ${type.toUpperCase()} ARCHIVE ERROR`, { error: error instanceof Error ? error.message : String(error) });
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to start archive: ${errorMessage}`);
    }
    setLoading('');
  };

  const stopArchive = async (archiveId?: string) => {
    const id = archiveId || currentArchiveId;
    if (!id) {
      alert('No archive ID available!');
      return;
    }
    setLoading('stop');
    try {
      const result = await apiCall(`/archives/${id}/stop`, 'POST') as ApiResponse;
      if (result.success) {
        setCurrentArchiveId(null);
        listArchives();
      }
    } catch (error) {
      console.error('STOP ARCHIVE ERROR', { error: error instanceof Error ? error.message : String(error) });
    }
    setLoading('');
  };

  const startExperienceComposer = async (sessionId?: string, url?: string) => {
    const activeSessionId = sessionId || currentSession;
    if (!activeSessionId) {
      console.error('No session ID available to start Experience Composer');
      return;
    }
    
    if (!url) {
      console.error('No URL provided for Experience Composer');
      return;
    }
    
    setLoading('composer');
    try {
      const result = await apiCall('/composer/start', 'POST', {
        sessionId: activeSessionId,
        url: url
      }) as ApiResponse & { render?: { id?: string }, archiveId?: string };

      if (result.success && result.render?.id) {
        setCurrentRenderId(result.render.id);
        setComposerArchiveId(result.archiveId || null);
        listArchives();
        return result;
      } else {
        console.error('START EXPERIENCE COMPOSER ERROR', result);
        throw new Error(result.error || 'Failed to start Experience Composer');
      }
    } catch (error) {
      console.error('START EXPERIENCE COMPOSER ERROR', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      setLoading('');
    }
  };

  const stopExperienceComposer = async (renderId?: string) => {
    const id = renderId || currentRenderId;
    if (!id) {
      console.error('No render ID available to stop Experience Composer');
      return;
    }
    setLoading('composer-stop');
    try {
      const result = await apiCall(`/composer/${id}/stop`, 'POST') as ApiResponse;
      if (result.success) {
        setCurrentRenderId(null);
        setComposerArchiveId(null);
        listArchives();
        return result;
      } else {
        console.error('STOP EXPERIENCE COMPOSER ERROR', result);
        throw new Error(result.error || 'Failed to stop Experience Composer');
      }
    } catch (error) {
      console.error('STOP EXPERIENCE COMPOSER ERROR', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      setLoading('');
    }
  };

  const clearResults = () => {
    setResults('');
  };

  const videoSession = useMemo((): VideoSession | null => {
    if (currentSession && currentToken) {
      return {
        sessionId: currentSession,
        token: currentToken
      };
    }
    return null;
  }, [currentSession, currentToken]);

  const handleConnectionChange = (state: ConnectionState) => {
    setConnectionState(state);
  };

  // Load archives when the hook is first used
  useEffect(() => {
    listArchives();
  }, []);

  return {
    // State
    currentSession,
    currentToken,
    currentArchiveId,
    currentRenderId,
    composerArchiveId,
    archives,
    loading,
    results,
    connectionState,
    // Actions
    createSession,
    generateToken,
    listArchives,
    startArchive,
    stopArchive,
    startExperienceComposer,
    stopExperienceComposer,
    clearResults,
    // Video session
    videoSession,
    handleConnectionChange
  };
};
