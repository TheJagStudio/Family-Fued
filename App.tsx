import React, { useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { Display } from './components/Display';
import { Monitor, Users } from 'lucide-react';

const App: React.FC = () => {
  // Simple view routing state
  const [view, setView] = useState<'HOME' | 'ADMIN' | 'DISPLAY'>('HOME');

  if (view === 'ADMIN') return <AdminPanel />;
  if (view === 'DISPLAY') return <Display />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
           <h1 className="text-6xl md:text-8xl font-display text-yellow-400 drop-shadow-xl tracking-wider mb-4">
             FAMILY FEUD
           </h1>
           <p className="text-blue-200 text-xl font-condensed tracking-widest uppercase">Live Quiz System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Admin Card */}
           <button 
             onClick={() => setView('ADMIN')}
             className="group bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-yellow-400 p-8 rounded-xl transition-all duration-300 backdrop-blur-sm flex flex-col items-center text-center"
           >
             <div className="bg-blue-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Monitor className="w-12 h-12 text-white" />
             </div>
             <h2 className="text-3xl font-condensed text-white mb-2">HOST A GAME</h2>
             <p className="text-gray-400 group-hover:text-gray-300">Create a room, control the board, and manage questions.</p>
           </button>

           {/* User Card */}
           <button 
             onClick={() => setView('DISPLAY')}
             className="group bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-yellow-400 p-8 rounded-xl transition-all duration-300 backdrop-blur-sm flex flex-col items-center text-center"
           >
             <div className="bg-green-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-12 h-12 text-white" />
             </div>
             <h2 className="text-3xl font-condensed text-white mb-2">JOIN DISPLAY</h2>
             <p className="text-gray-400 group-hover:text-gray-300">Join a room as the main display board for the audience.</p>
           </button>
        </div>
        
        <div className="mt-12 text-center text-white/20 text-sm">
           Family Feud style quiz app v1.0
        </div>
      </div>
    </div>
  );
};

export default App;
