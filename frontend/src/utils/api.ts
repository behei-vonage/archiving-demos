import axios from 'axios';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3345' : window.location.origin;

export const getBackendUrl = (): string => API_BASE;

export const apiCall = async (
  endpoint: string, 
  method = 'GET', 
  body?: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axios({
      url: `${API_BASE}${endpoint}`,
      method,
      headers: { 'Content-Type': 'application/json' },
      data: body
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.details || 
                          error.response?.data?.error || 
                          error.message;
      const enhancedError = new Error(`API Error: ${errorMessage}`) as Error & { response?: typeof error.response };
      enhancedError.response = error.response;
      throw enhancedError;
    }
    throw new Error(`API Error: ${error}`);
  }
};

export interface ExtractedFile {
  filename: string;
  url: string;
}

export interface ExtractArchiveResponse {
  success: boolean;
  files: ExtractedFile[];
  count: number;
  error?: string;
}

export const extractArchive = async (
  url: string, 
  archiveId: string
): Promise<ExtractArchiveResponse> => {
  const response = await apiCall('/archives/extract', 'POST', { url, archiveId });
  return response as ExtractArchiveResponse;
};
