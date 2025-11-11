export interface Archive {
  id: string;
  name: string;
  sessionId: string;
  status: string;
  outputMode: string;
  url?: string; // Download URL when archive is available
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export type ArchiveType = 'audio-only' | 'composed' | 'individual';

export type LoadingState = string | '';

export interface VideoSession {
  sessionId: string;
  token: string;
}

export interface PublisherOptions {
  insertMode: 'append' | 'before' | 'after' | 'replace';
  width: string;
  height: string;
  name?: string;
  audioSource?: boolean | MediaTrackConstraints;
  videoSource?: boolean | MediaTrackConstraints;
  publishAudio?: boolean;
  publishVideo?: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isPublishing: boolean;
  connectionId?: string;
  publisherId?: string;
}
