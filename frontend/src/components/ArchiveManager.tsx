import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Container,
  Chip,
  TextField
} from '@mui/material';
import {
  AudioFile,
  Movie,
  Videocam,
  Stop,
  RecordVoiceOver,
  Palette
} from '@mui/icons-material';
import * as OT from '@vonage/client-sdk-video';
import VideoPublisher from './VideoPublisher';
import { useVonageApi } from '../hooks/useVonageApi';
import type { ConnectionState } from '../types';

const ArchiveManager = () => {
  const {
    currentSession,
    currentToken,
    currentArchiveId,
    currentRenderId,
    createSession,
    generateToken,
    startArchive,
    stopArchive,
    startExperienceComposer,
    stopExperienceComposer,
    videoSession,
    handleConnectionChange
  } = useVonageApi();

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isPublishing: false
  });
  const [composerUrl, setComposerUrl] = useState('https://time.is/');
  const publisherRef = useRef<(() => Promise<void>) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isPublishingRef = useRef(false);
  const otSessionRef = useRef<OT.Session | null>(null);

  const handleVideoReady = useCallback((publisher: () => Promise<void>, cleanup: () => void, getSession: () => OT.Session | null) => {
    publisherRef.current = publisher;
    cleanupRef.current = cleanup;
    const session = getSession();
    if (session) {
      otSessionRef.current = session;
    }
  }, []);

  const publishBlurredPublisher = async () => {
    if (!otSessionRef.current) {
      throw new Error('Session not initialized. Call ensureSessionAndPublishing first.');
    }

    const publisherDiv = document.createElement('div');
    publisherDiv.style.display = 'none';
    document.body.appendChild(publisherDiv);

    const publisher = OT.initPublisher(publisherDiv, {
      insertMode: 'append',
      width: '320px',
      height: '240px',
      name: 'Background Blur Publisher',
      publishAudio: false,
      publishVideo: true,
      fitMode: 'cover',
      videoFilter: {
        type: 'backgroundBlur',
        blurStrength: 'high'
      }
    });

    await new Promise<void>((resolve, reject) => {
      otSessionRef.current!.publish(publisher, (publishError) => {
        if (publishError) {
          reject(new Error(`Failed to publish mirrored video: ${publishError.message}`));
        } else {
          resolve();
        }
      });
    });
  };

  const publishScreenShare = async () => {
    if (!otSessionRef.current) {
      throw new Error('Session not initialized. Call ensureSessionAndPublishing first.');
    }

    const publisherDiv = document.createElement('div');
    publisherDiv.style.display = 'none';
    document.body.appendChild(publisherDiv);

    const publisher = OT.initPublisher(publisherDiv, {
      insertMode: 'append',
      width: '1920px',
      height: '1080px',
      name: 'Screen Share Publisher',
      publishAudio: false,
      videoSource: 'screen',
      fitMode: 'contain'
    });

    await new Promise<void>((resolve, reject) => {
      otSessionRef.current!.publish(publisher, (publishError) => {
        if (publishError) {
          reject(new Error(`Failed to publish screen share: ${publishError.message}`));
        } else {
          resolve();
        }
      });
    });
  };

  const ensureSessionAndPublishing = async () => {
    let sessionId = currentSession;
    let token = currentToken;

    // Step 1: Create session if not exists
    if (!sessionId) {
      const newSessionId = await createSession();
      if (!newSessionId) {
        throw new Error('Failed to create session');
      }
      sessionId = newSessionId;
    }

    // Step 2: Generate token if not exists
    if (!token && sessionId) {
      const newToken = await generateToken(sessionId);
      if (!newToken) {
        throw new Error('Failed to generate token');
      }
      token = newToken;
    }

    // Step 3: Start video publishing and wait for it to complete
    if (!connectionState.isPublishing) {
      // Wait for publisher to be ready (simple timeout)
      if (!publisherRef.current) {
        // Give it a moment for the publisher to be set up
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!publisherRef.current) {
        throw new Error('Video publisher is not ready');
      }

      await publisherRef.current();

      // Wait a moment for the publishing state to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!isPublishingRef.current) {
        throw new Error('Failed to start video publishing. Please check your camera permissions');
      }
    }

    return sessionId;
  };

  const handleArchiveMode = async (mode: 'audio-only' | 'composed' | 'individual') => {
    try {
      const sessionId = await ensureSessionAndPublishing();

      if (mode === 'composed') {
        await publishBlurredPublisher();
        await publishScreenShare();
      }

      if (mode === 'individual') {
        await publishBlurredPublisher();
      }

      await startArchive(mode, sessionId);
    } catch (error) {
      console.error(`Failed to start ${mode} archive:`, error);
      alert(`Failed to start ${mode} archive. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleConnectionStateChange = (state: ConnectionState) => {
    setConnectionState(state);
    isPublishingRef.current = state.isPublishing;
    handleConnectionChange(state);
  };

  const handleExperienceComposer = async () => {
    try {
      if (!composerUrl || composerUrl.length < 15) {
        alert('Please enter a valid URL (minimum 15 characters)');
        return;
      }
      const sessionId = await ensureSessionAndPublishing();
      await startExperienceComposer(sessionId, composerUrl);
    } catch (error) {
      console.error('Failed to start Experience Composer:', error);
      alert(`Failed to start Experience Composer. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleStop = async () => {
    try {
      // Step 1: Stop the archive or Experience Composer
      if (currentArchiveId) {
        await stopArchive();
      } else if (currentRenderId) {
        await stopExperienceComposer();
      }

      // Step 2: Clean up the video publisher (disconnect and destroy)
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      // Step 3: Reset local state
      setConnectionState({
        isConnected: false,
        isPublishing: false
      });
      isPublishingRef.current = false;
    } catch (error) {
      console.error('Error stopping:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Hidden Video Publisher for functionality */}
      <Box sx={{ display: 'none' }}>
        <VideoPublisher
          session={videoSession}
          onConnectionChange={handleConnectionStateChange}
          onReady={handleVideoReady}
        />
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          align="center"
          sx={{ mb: 4, fontWeight: 'bold' }}
        >
          Choose Archive Mode
        </Typography>

        <Box sx={{
          display: 'flex',
          gap: 3,
          justifyContent: 'center',
          flexWrap: 'wrap',
          '& > *': { flex: '1 1 250px', maxWidth: 320 }
        }}>
          <Card
            elevation={currentArchiveId || currentRenderId ? 1 : 4}
            sx={{
              opacity: currentArchiveId || currentRenderId ? 0.6 : 1,
              transition: 'all 0.3s ease',
              '&:hover': currentArchiveId || currentRenderId ? {} : {
                transform: 'translateY(-4px)',
                boxShadow: 8
              }
            }}
          >
            <CardContent sx={{
              textAlign: 'center',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <AudioFile sx={{ fontSize: 60, color: '#FA7655', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                Audio-Only Archive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Record audio streams without video composition
              </Typography>
              {(currentArchiveId || currentRenderId) && (
                <Chip
                  label={currentArchiveId ? "Archive in progress" : "Composer in progress"}
                  size="small"
                  color="warning"
                  sx={{ mb: 2 }}
                />
              )}
              <Button
                onClick={() => handleArchiveMode('audio-only')}
                disabled={currentArchiveId !== null || currentRenderId !== null}
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  bgcolor: '#FA7655',
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Start an Audio-Only Archive
              </Button>
            </CardContent>
          </Card>

          <Card
            elevation={currentArchiveId || currentRenderId ? 1 : 4}
            sx={{
              opacity: currentArchiveId || currentRenderId ? 0.6 : 1,
              transition: 'all 0.3s ease',
              '&:hover': currentArchiveId || currentRenderId ? {} : {
                transform: 'translateY(-4px)',
                boxShadow: 8
              }
            }}
          >
            <CardContent sx={{
              textAlign: 'center',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <Videocam sx={{ fontSize: 60, color: '#D51F9C', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                Composed Archive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Single video with all participants in one view
              </Typography>
              {(currentArchiveId || currentRenderId) && (
                <Chip
                  label={currentArchiveId ? "Archive in progress" : "Composer in progress"}
                  size="small"
                  color="warning"
                  sx={{ mb: 2 }}
                />
              )}
              <Button
                onClick={() => handleArchiveMode('composed')}
                disabled={currentArchiveId !== null || currentRenderId !== null}
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  bgcolor: '#D51F9C',
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Start Composed Archive
              </Button>
            </CardContent>
          </Card>

          <Card
            elevation={currentArchiveId || currentRenderId ? 1 : 4}
            sx={{
              opacity: currentArchiveId || currentRenderId ? 0.6 : 1,
              transition: 'all 0.3s ease',
              '&:hover': currentArchiveId || currentRenderId ? {} : {
                transform: 'translateY(-4px)',
                boxShadow: 8
              }
            }}
          >
            <CardContent sx={{
              textAlign: 'center',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <Movie sx={{ fontSize: 60, color: '#90929B', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                Individual Archive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Separate video files for each participant
              </Typography>
              {(currentArchiveId || currentRenderId) && (
                <Chip
                  label={currentArchiveId ? "Archive in progress" : "Composer in progress"}
                  size="small"
                  color="warning"
                  sx={{ mb: 2 }}
                />
              )}
              <Button
                onClick={() => handleArchiveMode('individual')}
                disabled={currentArchiveId !== null || currentRenderId !== null}
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  bgcolor: '#90929B',
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Start Individual Archive
              </Button>
            </CardContent>
          </Card>

          <Card
            elevation={currentArchiveId || currentRenderId ? 1 : 4}
            sx={{
              opacity: currentArchiveId || currentRenderId ? 0.6 : 1,
              transition: 'all 0.3s ease',
              '&:hover': currentArchiveId || currentRenderId ? {} : {
                transform: 'translateY(-4px)',
                boxShadow: 8
              }
            }}
          >
            <CardContent sx={{
              textAlign: 'center',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <Palette sx={{ fontSize: 60, color: '#86C7ED', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                Experience Composer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                Custom rendered video with interactive elements and branding
              </Typography>
              <TextField
                fullWidth
                label="Composer URL"
                placeholder="https://example.com"
                value={composerUrl}
                onChange={(e) => setComposerUrl(e.target.value)}
                disabled={currentArchiveId !== null || currentRenderId !== null}
                size="small"
                sx={{ mb: 2 }}
                helperText="Enter a publicly accessible URL (min. 15 characters)"
              />
              {(currentArchiveId || currentRenderId) && (
                <Chip
                  label={currentArchiveId ? "Archive in progress" : "Composer in progress"}
                  size="small"
                  color="warning"
                  sx={{ mb: 2 }}
                />
              )}
              <Button
                onClick={handleExperienceComposer}
                disabled={currentArchiveId !== null || currentRenderId !== null || !composerUrl || composerUrl.length < 15}
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  bgcolor: '#86C7ED',
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Start Experience Composer
              </Button>
            </CardContent>
          </Card>
        </Box>

        {(currentArchiveId || currentRenderId) && (
          <Alert
            severity="warning"
            sx={{
              mt: 4,
              maxWidth: '600px',
              mx: 'auto',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                <RecordVoiceOver sx={{ mr: 1, verticalAlign: 'middle' }} />
                {currentArchiveId ? 'Archive in progress...' : 'Experience Composer in progress...'}
              </Typography>
              <Button
                onClick={handleStop}
                variant="contained"
                color="error"
                size="large"
                startIcon={<Stop />}
                sx={{ mt: 1 }}
              >
                {currentArchiveId ? 'Stop Archive' : 'Stop Experience Composer'}
              </Button>
            </Box>
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default ArchiveManager;
