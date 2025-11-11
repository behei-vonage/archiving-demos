# Full-Stack React + Express App

A modern full-stack web application with React + Vite TypeScript frontend and Node.js Express backend.

## Project Structure

```
├── frontend/           # React + Vite TypeScript app
├── backend/            # Node.js Express server
├── package.json        # Root package.json with workspace scripts
└── README.md          # This file
```

## Getting Started

### Prerequisites
- Node.js (v20.19+ or v22.12+ recommended for Vite)
- npm

### Installation

1. Install dependencies for both frontend and backend:
```bash
npm install
```

### Development

#### Option 1: Run both servers simultaneously (Recommended)
```bash
npm run dev
```
This starts both frontend (http://localhost:5173) and backend (http://localhost:3001) servers concurrently.

#### Option 2: Run servers separately

**Frontend:**
```bash
npm run dev:frontend
```
- Runs on http://localhost:5173
- Hot reload enabled

**Backend:**
```bash
npm run dev:backend
```
- Runs on http://localhost:3001
- Auto-restart on file changes

### Building for Production

Build both projects:
```bash
npm run build
```

Or build individually:
```bash
npm run build:frontend
npm run build:backend
```

## API Endpoints

- `GET /api` - Test endpoint returning a welcome message
- `GET /api/health` - Health check endpoint

## Testing the Connection

1. Start both servers using `npm run dev`
2. Open http://localhost:5173 in your browser
3. Click "Test Backend Connection" button
4. You should see "Hello from the backend!" message

## VS Code Tasks

The following VS Code tasks are available:
- **Frontend Dev Server**: Starts the React development server
- **Backend Dev Server**: Starts the Express development server
- **Run Full Stack Dev**: Starts both servers simultaneously

Access tasks via `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) → "Tasks: Run Task"

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS3

### Backend
- Node.js
- Express
- TypeScript
- CORS enabled

## Development Notes

- Frontend proxy is not configured; the app makes direct API calls to `http://localhost:3001`
- CORS is enabled on the backend for development
- Both servers support hot reload/auto-restart during development
