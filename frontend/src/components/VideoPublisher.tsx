import { useEffect, useRef, useState, useCallback, type ReactElement } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  StopCircle,
  LinkOff,
  Circle
} from '@mui/icons-material';
import * as OT from '@vonage/client-sdk-video';
import type { ConnectionState, VideoSession } from '../types';

interface VideoPublisherProps {
  session: VideoSession | null;
  onConnectionChange: (state: ConnectionState) => void;
  onReady?: (connectAndPublish: () => Promise<void>, cleanup: () => void, getSession: () => OT.Session | null) => void;
}

const VideoPublisher = ({
  session,
  onConnectionChange,
  onReady
}: VideoPublisherProps): ReactElement => {
  const [otSession, setOtSession] = useState<OT.Session | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string>('');

  const publisherRef = useRef<HTMLDivElement>(null);
  const publisherInstanceRef = useRef<OT.Publisher | null>(null);

  const handleStopPublishing = useCallback(() => {
    if (publisherInstanceRef.current && otSession) {
      otSession.unpublish(publisherInstanceRef.current);
      publisherInstanceRef.current.destroy();
      publisherInstanceRef.current = null;
      setIsPublishing(false);

      if (publisherRef.current) {
        publisherRef.current.innerHTML = '';
      }

      onConnectionChange({
        isConnected: true,
        isPublishing: false,
        publisherId: undefined
      });
    }
  }, [otSession, onConnectionChange]);

  const handleDisconnect = useCallback(() => {
    if (otSession) {
      if (publisherInstanceRef.current) {
        otSession.unpublish(publisherInstanceRef.current);
        publisherInstanceRef.current.destroy();
        publisherInstanceRef.current = null;
      }

      // Clear the container
      if (publisherRef.current) {
        publisherRef.current.innerHTML = '';
      }

      otSession.disconnect();
      setOtSession(null);
      setIsPublishing(false);
      onConnectionChange({
        isConnected: false,
        isPublishing: false
      });
    }
  }, [otSession, onConnectionChange]);

  const connectAndPublish = useCallback(async () => {
    if (!session) {
      return;
    }

    if (isConnecting || isPublishing) {
      return;
    }

    try {
      setIsConnecting(true);
      setError('');

      // Step 1: Connect to session if not already connected
      let activeSession = otSession;

      if (!activeSession) {
        const apiKey = import.meta.env.VITE_OPENTOK_API_KEY;
        const newSession = OT.initSession(apiKey, session.sessionId);

        // Set up event listeners (simplified)
        newSession.on('connected', () => {
          // Don't call onConnectionChange here to avoid state conflicts
        });

        newSession.on('disconnected', () => {
          // Don't call onConnectionChange here during active publishing
        });

        // Connect to session
        await new Promise<void>((resolve, reject) => {
          newSession.connect(session.token, (error) => {
            if (error) {
              console.error('Connection failed:', error);
              reject(new Error(`Failed to connect: ${error.message}`));
            } else {
              resolve();
            }
          });
        });

        setOtSession(newSession);
        activeSession = newSession;
      }

      // Step 2: Create and publish video stream
      if (activeSession && publisherRef.current && !publisherInstanceRef.current) {
        // Clear container
        publisherRef.current.innerHTML = '';

        // Create publisher
        const publisher = OT.initPublisher(publisherRef.current, {
          insertMode: 'append',
          width: '320px',
          height: '240px',
          name: 'Archive Publisher',
          publishAudio: true,
          publishVideo: true,
          fitMode: 'cover'
        });

        // Store reference immediately
        publisherInstanceRef.current = publisher;

        // Set up publisher event listener for when stream is created
        publisher.on('streamCreated', (event) => {
          setIsPublishing(true);
          onConnectionChange({
            isConnected: true,
            isPublishing: true,
            publisherId: event.target.id
          });
        });

        // Add error handling for publisher
        publisher.on('streamDestroyed', () => {
          // Stream destroyed
        });

        publisher.on('accessDenied', () => {
          console.error('Publisher access denied - camera/microphone permissions');
        });

        // Publish to session
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Publish timeout'));
          }, 10000); // 10 second timeout

          activeSession.publish(publisher, (error) => {
            clearTimeout(timeout);
            if (error) {
              console.error('Publish failed:', error);
              reject(new Error(`Failed to publish: ${error.message}`));
            } else {
              resolve();
            }
          });
        });
      }

    } catch (error) {
      console.error('connectAndPublish error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect and publish');

      // Cleanup on error
      if (publisherInstanceRef.current) {
        try {
          publisherInstanceRef.current.destroy();
        } catch (destroyError) {
          console.warn('Error destroying publisher:', destroyError);
        }
        publisherInstanceRef.current = null;
      }

      // Don't call onConnectionChange here to avoid premature state resets
    } finally {
      setIsConnecting(false);
    }
  }, [session, isConnecting, otSession, isPublishing, onConnectionChange]);

  const cleanup = useCallback(() => {
    handleStopPublishing();
    handleDisconnect();
  }, [handleStopPublishing, handleDisconnect]);

  const getSession = useCallback(() => {
    return otSession;
  }, [otSession]);

  useEffect(() => {
    if (onReady && session) {
      onReady(connectAndPublish, cleanup, getSession);
    }
  }, [session, onReady, connectAndPublish, cleanup, getSession]);

  useEffect(() => {
    const currentContainer = publisherRef.current;
    return () => {
      if (publisherInstanceRef.current) {
        publisherInstanceRef.current.destroy();
        publisherInstanceRef.current = null;
      }
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, []); 

  const isConnected = !!otSession;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          Video Publisher
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            onClick={handleStopPublishing}
            disabled={!isPublishing}
            variant="contained"
            color="error"
            startIcon={<StopCircle />}
          >
            Stop Video
          </Button>

          <Button
            onClick={handleDisconnect}
            disabled={!isConnected}
            variant="contained"
            color="secondary"
            startIcon={<LinkOff />}
          >
            Disconnect
          </Button>
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<Circle />}
            label={`${isConnected ? 'Connected' : 'Not Connected'}${isPublishing ? ' | Publishing' : ''}`}
            color={isConnected ? 'success' : 'default'}
            variant={isPublishing ? 'filled' : 'outlined'}
          />
        </Box>

        {!session && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Create a session and generate a token first to enable video connection.
          </Alert>
        )}

        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Box
            ref={publisherRef}
            sx={{
              width: '320px',
              height: '240px',
              bgcolor: isPublishing ? '#000' : 'grey.100',
              border: 1,
              borderColor: 'grey.300',
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          />
          {!isPublishing && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'grey.600',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <Typography variant="body2">
                Video will appear here when publishing
              </Typography>
            </Box>
          )}
          {isPublishing && publisherInstanceRef.current && (
            <Chip
              label="LIVE"
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                left: 4,
                fontSize: '0.6rem',
                height: 'auto',
                '& .MuiChip-label': {
                  px: 0.5,
                  py: 0.25
                }
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VideoPublisher;
