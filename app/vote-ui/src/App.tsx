import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [results, setResults] = useState<{ [key: string]: number }>({});
  const [message, setMessage] = useState('');

  const voteApiUrl = '/api/vote'; // Proxied by Vite/Nginx
  const resultApiUrl = '/api/results'; // This will need to be configured in Nginx/Ingress

  // Fetch results periodically
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // This is a placeholder URL that needs to be correctly routed.
        // In a real K8s setup, you'd have an Ingress routing /api/results to the result-api service.
        // For local dev, we might need another proxy entry or a different setup.
        // For now, we will assume it can be reached.
        const res = await axios.get(resultApiUrl);
        setResults(res.data);
      } catch (error) {
        console.error("Could not fetch results.", error);
      }
    };

    const interval = setInterval(fetchResults, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [resultApiUrl]);

  const handleVote = async (candidate: string) => {
    try {
      const res = await axios.post(voteApiUrl, { candidate });
      setMessage(res.data.message || `Voted for ${candidate}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error: ${error.response.data.message || 'Could not submit vote.'}`);
      } else {
        setMessage('An unexpected error occurred.');
      }
      console.error("Could not submit vote.", error);
    }
  };

  const getVotePercentage = (candidate: string) => {
    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
    if (totalVotes === 0) return 0;
    const candidateVotes = results[candidate] || 0;
    return ((candidateVotes / totalVotes) * 100).toFixed(1);
  };

  const candidateA = 'A';
  const candidateB = 'B';
  const votesA = results[candidateA] || 0;
  const votesB = results[candidateB] || 0;
  const percentA = getVotePercentage(candidateA);
  const percentB = getVotePercentage(candidateB);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vote for Your Favorite!</h1>
      </header>
      <main className="voting-container">
        <div className="vote-options">
          <button className="vote-button button-a" onClick={() => handleVote(candidateA)}>
            Vote for {candidateA}
          </button>
          <button className="vote-button button-b" onClick={() => handleVote(candidateB)}>
            Vote for {candidateB}
          </button>
        </div>
        {message && <p className="vote-message">{message}</p>}
      </main>
      <section className="results-container">
        <h2>Live Results</h2>
        <div className="results-bar">
          <div
            className="result-a"
            style={{ width: `${percentA}%` }}
          >
            {percentA}%
          </div>
          <div
            className="result-b"
            style={{ width: `${percentB}%` }}
          >
            {percentB}%
          </div>
        </div>
        <div className="results-summary">
          <span>{candidateA}: {votesA} votes</span>
          <span>{candidateB}: {votesB} votes</span>
        </div>
      </section>
    </div>
  );
}

export default App;
