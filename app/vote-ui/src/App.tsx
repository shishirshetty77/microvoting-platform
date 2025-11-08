import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteResults, ToastMessage } from './types';

const App = () => {
  const [results, setResults] = useState<VoteResults>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const voteApiUrl = '/api/vote';
  const resultApiUrl = '/api/results';

  const candidates = [
    { id: 'a', name: 'Ferrari', color: 'bg-red-600', hoverColor: 'hover:bg-red-700' },
    { id: 'b', name: 'Lamborghini', color: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500' },
  ];

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(resultApiUrl);
        setResults(res.data);
      } catch (error) {
        console.error("Could not fetch results.", error);
        setToast({ type: 'error', text: 'Unable to fetch results. Please try again later.' });
      }
    };

    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [resultApiUrl]);

  const handleVote = async (candidate: string) => {
    setLoading(true);
    try {
      await axios.post(voteApiUrl, { candidate });
      setToast({ type: 'success', text: `Successfully voted for ${candidates.find(c => c.id === candidate)?.name}!` });
    } catch (error) {
      setToast({ type: 'error', text: 'Could not submit vote.' });
      console.error("Could not submit vote.", error);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 text-white font-sans">
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-2">
              🏎️ Vote for Your Dream Supercar
            </h1>
            <p className="text-center text-gray-400 mb-8">
              Choose between two legends of the road.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {candidates.map((candidate) => (
                <motion.button
                  key={candidate.id}
                  onClick={() => handleVote(candidate.id)}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-6 rounded-xl text-center font-bold text-xl ${candidate.color} ${candidate.hoverColor} transition-colors duration-300 disabled:opacity-50`}
                >
                  {candidate.name}
                </motion.button>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">Live Results</h2>
              {candidates.map((candidate) => {
                const votes = results[candidate.id] || 0;
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                return (
                  <div key={candidate.id}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{candidate.name}</span>
                      <span>{votes} Votes ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <motion.div
                        className={`${candidate.color} h-4 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
        <footer className="text-center text-gray-500 mt-8">
          Powered by MicroVoting Platform
        </footer>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 right-10 p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
