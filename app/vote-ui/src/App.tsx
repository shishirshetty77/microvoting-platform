import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteResults, ToastMessage } from './types';

const App = () => {
  const [results, setResults] = useState<VoteResults>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await axios.post('/api/reset');
      setToast({ type: 'success', text: 'Votes reset!' });
    } catch {
      setToast({ type: 'error', text: 'Reset failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const voteApiUrl = '/api/vote';
  const resultApiUrl = '/api/results';

  const candidates = [
    {
      id: 'a',
      name: 'Ferrari',
      color: 'bg-gradient-to-br from-red-600 via-red-700 to-black',
      glow: 'shadow-[0_0_40px_rgba(255,50,50,0.9)]',
    },
    {
      id: 'b',
      name: 'Lamborghini',
      color: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-black',
      glow: 'shadow-[0_0_40px_rgba(255,240,0,0.9)]',
    },
  ];

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(resultApiUrl);
        setResults(res.data);
      } catch {
        setToast({ type: 'error', text: 'Failed to fetch results.' });
      }
    };

    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [resultApiUrl]);

  const handleVote = async (candidate: string) => {
    setLoading(true);
    try {
      await axios.post(voteApiUrl, { candidate });
      setToast({
        type: 'success',
        text: `Voted for ${candidates.find(c => c.id === candidate)?.name}`,
      });
    } catch {
      setToast({ type: 'error', text: 'Vote failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-gray-900 text-white font-sans relative overflow-hidden">

      {/* glowing background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-red-700/20 rounded-full blur-3xl top-10 left-0"></div>
        <div className="absolute w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-3xl bottom-10 right-0"></div>
      </div>

      <main className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="
            w-full max-w-2xl mx-auto
            bg-white/10 backdrop-blur-2xl
            border border-white/10 
            rounded-3xl shadow-2xl p-10"
        >

          {/* Header */}
          <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight">
            🏎️ Vote Your Favorite Supercar
          </h1>
          <p className="text-center text-gray-300 mb-10">
            Ferrari vs Lamborghini — choose your legend.
          </p>

          {/* Button Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

            {candidates.map(c => (
              <motion.button
                key={c.id}
                onClick={() => handleVote(c.id)}
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                animate={{
                  y: [0, -2, 0],
                  boxShadow: [
                    `0 0 20px rgba(255,255,255,0.2)`,
                    c.glow.replace("40px", "60px"),
                    `0 0 20px rgba(255,255,255,0.2)`
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`
                  p-6 rounded-xl text-center text-2xl font-bold 
                  transition-all duration-300 disabled:opacity-50
                  ${c.color} ${c.glow}
                  border border-white/20 backdrop-blur-xl
                `}
              >
                {c.name}
              </motion.button>
            ))}

            {/* Reset Button – now symmetrical */}
            <motion.button
              onClick={handleReset}
              disabled={loading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              animate={{
                y: [0, -1, 0],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="
                p-6 rounded-xl text-center text-2xl font-bold 
                bg-gray-600/40 hover:bg-gray-600/60
                border border-white/10
                backdrop-blur-xl shadow-xl transition-all
              "
            >
              Reset
            </motion.button>
          </div>

          {/* Results */}
          <h2 className="text-2xl font-bold text-center mb-6">Live Results</h2>
          <div className="space-y-6">
            {candidates.map(candidate => {
              const votes = results[candidate.id] || 0;
              const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

              return (
                <div key={candidate.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold">{candidate.name}</span>
                    <span>{votes} votes ({pct.toFixed(1)}%)</span>
                  </div>

                  <div className="w-full bg-gray-700/40 rounded-full h-5 overflow-hidden">
                    <motion.div
                      className={`${candidate.color} h-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`
              fixed bottom-10 right-10 px-5 py-4 text-lg rounded-lg shadow-xl
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
            `}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;