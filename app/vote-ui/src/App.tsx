import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteResults, ToastMessage } from './types';

const App = () => {
  const [results, setResults] = useState<VoteResults>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const password = window.prompt("Enter Admin Password:");
    if (!password) return;

    setLoading(true);
    try {
      await axios.post('/api/reset', {}, {
        headers: { 'X-Admin-Key': password }
      });
      setToast({ type: 'success', text: 'Votes reset!' });
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setToast({ type: 'error', text: 'Unauthorized: Wrong Password.' });
      } else {
        setToast({ type: 'error', text: 'Reset failed.' });
      }
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
      glow: 'shadow-[0_0_45px_rgba(255,40,40,0.85)]',
    },
    {
      id: 'b',
      name: 'Lamborghini',
      color: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-black',
      glow: 'shadow-[0_0_45px_rgba(255,230,0,0.85)]',
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

  useEffect(() => {
    // Generate or retrieve Voter ID
    let voterId = localStorage.getItem('voter_id');
    if (!voterId) {
      // Fallback for environments where crypto.randomUUID is not available (e.g. non-secure contexts)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        voterId = crypto.randomUUID();
      } else {
        // Simple UUID v4 generator fallback
        voterId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      localStorage.setItem('voter_id', voterId);
    }
  }, []);

  const handleVote = async (candidate: string) => {
    setLoading(true);
    const voterId = localStorage.getItem('voter_id');
    try {
      await axios.post(voteApiUrl, { candidate, voter_id: voterId });
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

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[450px] h-[450px] bg-red-700/20 rounded-full blur-[120px] top-10 left-0"></div>
        <div className="absolute w-[450px] h-[450px] bg-yellow-500/20 rounded-full blur-[120px] bottom-10 right-0"></div>
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
          <h1 className="text-4xl font-extrabold text-center mb-3">
            🏎️ Vote Your Favorite Supercar
          </h1>
          <p className="text-center text-gray-300 mb-12">Choose your champion.</p>

          {/* ========== BUTTONS ========== */}

          {/* TOP ROW: Ferrari & Lamborghini */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            {candidates.map(c => (
              <motion.button
                key={c.id}
                onClick={() => handleVote(c.id)}
                disabled={loading}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.90 }}
                animate={{
                  y: [0, -3, 0],
                  boxShadow: [
                    "0 0 25px rgba(255,255,255,0.15)",
                    c.glow.replace("45px", "65px"),
                    "0 0 25px rgba(255,255,255,0.15)"
                  ]
                }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className={`
                  p-6 rounded-2xl text-center text-2xl font-extrabold 
                  transition-all duration-300 disabled:opacity-50
                  border border-white/20 backdrop-blur-xl
                  ${c.color} ${c.glow}
                `}
              >
                {c.name}
              </motion.button>
            ))}
          </div>

          {/* CENTER RESET BUTTON */}
          <motion.button
            onClick={handleReset}
            disabled={loading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="
              mx-auto block mt-2 mb-12
              p-5 w-48 rounded-2xl text-center text-xl font-bold 
              border border-white/20 backdrop-blur-xl shadow-lg
              bg-gradient-to-br from-gray-300 via-gray-400 to-gray-700
              text-black
              hover:brightness-110 transition-all
            "
          >
            Reset
          </motion.button>

          {/* ========== RESULTS ========== */}

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