import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';
import OpenTok from 'opentok';
import jwt from 'jsonwebtoken';
import { getRandomFact } from './randomFacts';

config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = parseInt(process.env.VCR_PORT || process.env.PORT || '3345', 10);

const apiKey = process.env.OPENTOK_API_KEY || process.env.VONAGE_APP_ID || 'your_api_key';
const apiSecret = process.env.OPENTOK_API_SECRET || 'your_api_secret';

const opentok = new OpenTok(apiKey, apiSecret);

const generateJWT = () => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    ist: 'project',
    iat: now,
    exp: now + 180 // 3 minutes
  };
  return jwt.sign(payload, apiSecret);
};

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

const extractedPath = path.join(__dirname, '../extracted');
if (!fs.existsSync(extractedPath)) {
  fs.mkdirSync(extractedPath, { recursive: true });
}
app.use('/extracted', express.static(extractedPath));

const renderArchiveMap = new Map<string, string>();

app.get('/_/health', (req, res) => {
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/sessions', async (req, res) => {
  try {
    opentok.createSession({ mediaMode: 'routed' }, (error: Error | null, session?: any) => {
      if (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ 
          error: 'Failed to create session',
          success: false
        });
      }
      res.json({ 
        sessionId: session?.sessionId,
        success: true
      });
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      success: false
    });
  }
});

app.post('/sessions/:sessionId/tokens', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role = 'publisher', data = '', expireTime } = req.body;
    
    const tokenOptions: any = { role };
    if (data) tokenOptions.data = data;
    if (expireTime) tokenOptions.expireTime = expireTime;
    
    const token = opentok.generateToken(sessionId, tokenOptions);
    res.json({ 
      token,
      success: true
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      success: false
    });
  }
});

app.get('/archives', async (req, res) => {
  try {
    const { offset = 0, count = 50, sessionId } = req.query;
    
    const options: any = {
      offset: parseInt(offset as string),
      count: parseInt(count as string)
    };
    
    if (sessionId) {
      options.sessionId = sessionId as string;
    }
    
    opentok.listArchives(options, (error: Error | null, archives?: any, totalCount?: number) => {
      if (error) {
        console.error('Error listing archives:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: 'Failed to list archives',
          message: error.message || 'Unknown error',
          success: false
        });
      }
      res.json({
        archives: archives || [],
        totalCount: totalCount || 0,
        success: true
      });
    });
  } catch (error: any) {
    console.error('Error listing archives:', error);
    res.status(500).json({ 
      error: 'Failed to list archives',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

app.post('/archives/start/audio-only', async (req, res) => {
  try {
    const { sessionId, name = 'Audio Only Archive' } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required',
        success: false
      });
    }
    
    opentok.startArchive(sessionId, {
      name,
      hasAudio: true,
      hasVideo: false,
      outputMode: 'composed'
    }, (error: Error | null, archive?: any) => {
      if (error) {
        console.error('Error starting audio-only archive:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: 'Failed to start audio-only archive',
          message: error.message || 'Unknown error',
          details: (error as any).message || String(error),
          success: false
        });
      }
      res.json({
        archiveId: archive?.id,
        archive,
        success: true
      });
    });
  } catch (error: any) {
    console.error('Error starting audio-only archive:', error);
    res.status(500).json({ 
      error: 'Failed to start audio-only archive',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

app.post('/archives/start/composed', async (req, res) => {
  try {
    const { sessionId, name = 'Composed Archive', layout, resolution = '1280x720' } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required',
        success: false
      });
    }
    
    const archiveOptions: any = {
      name,
      hasAudio: true,
      hasVideo: true,
      outputMode: 'composed',
      resolution
    };
    
    if (layout) {
      archiveOptions.layout = layout;
    }
    
    opentok.startArchive(sessionId, archiveOptions, (error: Error | null, archive?: any) => {
      if (error) {
        console.error('Error starting composed archive:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: 'Failed to start composed archive',
          message: error.message || 'Unknown error',
          details: (error as any).message || String(error),
          success: false
        });
      }
      res.json({
        archiveId: archive?.id,
        archive,
        success: true
      });
    });
  } catch (error: any) {
    console.error('Error starting composed archive:', error);
    res.status(500).json({ 
      error: 'Failed to start composed archive',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

app.post('/archives/start/individual', async (req, res) => {
  try {
    const { sessionId, name = 'Individual Archive' } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required',
        success: false
      });
    }
    
    opentok.startArchive(sessionId, {
      name,
      hasAudio: true,
      hasVideo: true,
      outputMode: 'individual'
    }, (error: Error | null, archive?: any) => {
      if (error) {
        console.error('Error starting individual archive:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: 'Failed to start individual archive',
          message: error.message || 'Unknown error',
          details: (error as any).message || String(error),
          success: false
        });
      }
      res.json({
        archiveId: archive?.id,
        archive,
        success: true
      });
    });
  } catch (error: any) {
    console.error('Error starting individual archive:', error);
    res.status(500).json({ 
      error: 'Failed to start individual archive',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

app.post('/archives/:archiveId/stop', async (req, res) => {
  try {
    const { archiveId } = req.params;
    
    opentok.stopArchive(archiveId, (error: Error | null, archive?: any) => {
      if (error) {
        console.error('Error stopping archive:', error);
        return res.status(500).json({ 
          error: 'Failed to stop archive',
          success: false
        });
      }
      res.json({
        archiveId: archive?.id,
        archive,
        success: true
      });
    });
  } catch (error) {
    console.error('Error stopping archive:', error);
    res.status(500).json({ 
      error: 'Failed to stop archive',
      success: false
    });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});


app.post('/composer/start', async (req, res) => {
  try {
    const { sessionId, url } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required',
        success: false
      }); 
    }

    if (!url) {
      return res.status(400).json({
        error: 'url is required - must be a web application that renders Vonage Video session',
        success: false
      });
    }

    const token = opentok.generateToken(sessionId, {
      role: 'moderator'
    });
    
    const randomFact = getRandomFact();

    const jwtToken = generateJWT();
    const renderResponse = await axios.post(
      `https://api.opentok.com/v2/project/${apiKey}/render`,
      {
        sessionId,
        token,
        url,
        maxDuration: 1800,
        resolution: '1280x720',
        properties: {
          name: `${randomFact} - Experience Composer Render`
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-OPENTOK-AUTH': jwtToken
        }
      }
    );

    const render = renderResponse.data;

    opentok.startArchive(sessionId, {
      name: `${randomFact} - Experience Composer Archive`,
      hasAudio: true,
      hasVideo: true,
      outputMode: 'composed'
    }, (archiveError: Error | null, archive?: any) => {
      if (archiveError) {
        console.error('Error starting archive:', archiveError);
        return res.status(500).json({ 
          error: `Failed to start archive: ${archiveError.message || archiveError}`,
          success: false
        });
      }

      renderArchiveMap.set(render.id, archive?.id || '');

      res.json({
        render,
        archive,
        archiveId: archive?.id,
        success: true
      });
    });

  } catch (error: any) {
    console.error('Error starting Experience Composer:', error);
    const errorMessage = error.response?.data?.message || error.message;
    res.status(500).json({ 
      error: `Failed to start Experience Composer: ${errorMessage}`,
      success: false
    });
  }
});

app.post('/composer/:renderId/stop', async (req, res) => {
  try {
    const { renderId } = req.params;
    
    const archiveId = renderArchiveMap.get(renderId);
    
    const jwtToken = generateJWT();
    const renderResponse = await axios.delete(
      `https://api.opentok.com/v2/project/${apiKey}/render/${renderId}`,
      {
        headers: {
          'X-OPENTOK-AUTH': jwtToken
        }
      }
    );

    const render = renderResponse.data;

    if (archiveId) {
      opentok.stopArchive(archiveId, (archiveError: Error | null, archive?: any) => {
        if (archiveError) {
          console.error('Error stopping associated archive:', archiveError);
        }
        renderArchiveMap.delete(renderId);
        
        res.json({
          render,
          archive: archive || null,
          success: true
        });
      });
    } else {
      renderArchiveMap.delete(renderId);
      res.json({
        render,
        archive: null,
        success: true
      });
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      renderArchiveMap.delete(req.params.renderId);
      return res.status(404).json({ 
        error: 'Experience Composer render not found. It may have already been stopped or expired.',
        success: false
      });
    }
    
    const errorMessage = error.response?.data?.message || error.message;
    res.status(500).json({ 
      error: `Failed to stop Experience Composer: ${errorMessage}`,
      success: false
    });
  }
});

app.post('/archives/extract', async (req, res) => {
  try {
    const { url, archiveId } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'Archive URL is required',
        success: false
      });
    }
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer'
    });

    const archiveFolderName = archiveId || `archive_${Date.now()}`;
    const archiveFolder = path.join(extractedPath, archiveFolderName);
    
    if (fs.existsSync(archiveFolder)) {
      fs.rmSync(archiveFolder, { recursive: true });
    }
    fs.mkdirSync(archiveFolder, { recursive: true });

    const zip = new AdmZip(Buffer.from(response.data));
    zip.extractAllTo(archiveFolder, true);

    const findWebmFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findWebmFiles(fullPath));
        } else if (item.toLowerCase().endsWith('.webm')) {
          const relativePath = path.relative(extractedPath, fullPath);
          console.warn()
          files.push(relativePath.replace(/\\/g, '/'));
        }
      }
      
      return files;
    };

    const webmFiles = findWebmFiles(archiveFolder);

    if (webmFiles.length === 0) {
      return res.status(404).json({
        error: 'No .webm files found in archive',
        success: false
      });
    }

    const fileUrls = webmFiles.map(file => ({
      filename: path.basename(file),
      url: `/extracted/${file}`
    }));

    res.json({
      success: true,
      files: fileUrls,
      count: fileUrls.length
    });

  } catch (error: any) {
    console.error('Error extracting archive:', error);
    res.status(500).json({ 
      error: `Failed to extract archive: ${error.message || error}`,
      success: false
    });
  }
});
