import { type ReactElement } from 'react';

interface ResultsPanelProps {
  results: string;
  onClearResults: () => void;
}

const ResultsPanel = ({ results, onClearResults }: ResultsPanelProps): ReactElement => {
  return (
    <div>
      <h2>API Results</h2>
      <div style={{ 
        height: '600px', 
        overflow: 'auto', 
        padding: '1rem', 
        backgroundColor: '#f8f8f8', 
        borderRadius: '8px', 
        fontFamily: 'monospace', 
        fontSize: '0.8rem',
        whiteSpace: 'pre-wrap'
      }}>
        {results || 'API results will appear here...'}
      </div>
      <button 
        onClick={onClearResults}
        style={{ marginTop: '1rem' }}
      >
        Clear Results
      </button>
    </div>
  );
};

export default ResultsPanel;
