
import React, { useState, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameState, INITIAL_STATE, QuizData, Question } from '../types';
import { AnswerBoard } from './AnswerBoard';
import { Upload, MonitorPlay, Users, X, ChevronRight, PlayCircle, Eye, RefreshCw, Trophy, Trash2 } from 'lucide-react';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const PEER_PREFIX = 'ff-quiz-';

export const AdminPanel: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [jsonError, setJsonError] = useState<string>('');

  // Initialize Peer
  useEffect(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    
    const fullId = `${PEER_PREFIX}${code}`;
    const newPeer = new Peer(fullId);

    newPeer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      // We rely on our local 'code' state for display, assuming registration succeeded
    });

    newPeer.on('connection', (conn) => {
      conn.on('open', () => {
        setConnections((prev) => [...prev, conn]);
        // Send immediate sync upon connection
        conn.send({ type: 'SYNC_STATE', payload: gameState });
      });
      
      conn.on('close', () => {
        setConnections(prev => prev.filter(c => c.peer !== conn.peer));
      });
    });

    newPeer.on('error', (err) => {
        console.error("Peer error:", err);
        if (err.type === 'unavailable-id') {
            alert('Room Code collision. Please refresh to generate a new code.');
        }
    });

    setPeer(newPeer);
    return () => newPeer.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Broadcast state changes
  useEffect(() => {
    if (connections.length > 0) {
      connections.forEach(conn => {
        if(conn.open) conn.send({ type: 'SYNC_STATE', payload: gameState });
      });
    }
  }, [gameState, connections]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as QuizData;
        if (!json.questions || !Array.isArray(json.questions)) {
          throw new Error("Invalid format: 'questions' array missing");
        }
        
        // Normalize data
        const questions: Question[] = json.questions.map(q => ({
          text: q.text,
          answers: q.answers.map(a => ({ ...a, revealed: false }))
        }));

        setGameState(prev => ({
          ...prev,
          status: 'WAITING',
          questions: questions,
          currentQuestionIndex: 0,
          wrongAnswerCount: 0,
          teamScores: [0, 0, 0, 0, 0, 0]
        }));
        setJsonError('');
      } catch (err: any) {
        setJsonError(err.message || 'Failed to parse JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleReveal = (index: number) => {
    setGameState(prev => {
      const newQuestions = [...prev.questions];
      const currentQ = newQuestions[prev.currentQuestionIndex];
      currentQ.answers[index].revealed = true;
      return { ...prev, questions: newQuestions };
    });
  };

  const triggerWrongAnswer = () => {
    // Show X overlay and increment count
    setGameState(prev => ({ ...prev, showWrongOverlay: true, wrongAnswerCount: prev.wrongAnswerCount + 1 }));
    
    // Broadcast specialized message for immediate animation trigger
    connections.forEach(conn => {
       if(conn.open) conn.send({ type: 'SHOW_WRONG', payload: true });
    });

    // Reset overlay state after duration
    setTimeout(() => {
      setGameState(prev => ({ ...prev, showWrongOverlay: false }));
    }, 2500);
  };

  // Assign points to a team AND move to next
  const assignPointsAndNext = (teamIndex: number | null) => {
    setGameState(prev => {
        const currentQ = prev.questions[prev.currentQuestionIndex];
        const roundPoints = currentQ.answers
            .filter(a => a.revealed)
            .reduce((acc, curr) => acc + curr.points, 0);
        
        const newTeamScores = [...prev.teamScores];
        if (teamIndex !== null) {
            newTeamScores[teamIndex] += roundPoints;
        }

        const nextIndex = prev.currentQuestionIndex + 1;
        const isFinished = nextIndex >= prev.questions.length;

        return {
            ...prev,
            teamScores: newTeamScores,
            currentQuestionIndex: isFinished ? prev.currentQuestionIndex : nextIndex,
            status: isFinished ? 'FINISHED' : 'ACTIVE',
            wrongAnswerCount: 0,
            showWrongOverlay: false
        };
    });
  };
  
  const resetGame = () => {
      if(window.confirm("Are you sure you want to reset?")) {
          setGameState({
              ...INITIAL_STATE,
              status: 'IDLE'
          });
      }
  };

  const currentQ = gameState.questions[gameState.currentQuestionIndex];
  
  // Calculate current round total for display
  const currentRoundTotal = currentQ?.answers
    .filter(a => a.revealed)
    .reduce((acc, curr) => acc + curr.points, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-display tracking-wider flex items-center gap-2">
            <MonitorPlay size={24} /> HOST PANEL
          </h1>
          <div className="flex items-center gap-4 text-sm font-condensed">
             <div className="bg-blue-800 px-3 py-1 rounded border border-blue-600">
               ROOM CODE: <span className="text-yellow-400 font-mono text-xl ml-2 select-all font-bold tracking-widest">{roomCode || '...'}</span>
             </div>
             <div className="flex items-center gap-2">
               <Users size={16} />
               <span>{connections.length} Connected</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Status Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
             <h3 className="font-bold text-gray-700 mb-4 uppercase">Game Setup</h3>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Questions JSON</label>
                    <div className="flex items-center gap-2">
                         <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2">
                            <Upload size={18} /> Choose File
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                        </label>
                        {gameState.questions.length > 0 && <span className="text-green-600 text-sm font-bold">Loaded!</span>}
                    </div>
                    {jsonError && <p className="text-red-500 text-xs mt-1">{jsonError}</p>}
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <button 
                        onClick={() => setGameState(prev => ({...prev, status: 'ACTIVE'}))}
                        disabled={gameState.questions.length === 0 || gameState.status === 'ACTIVE'}
                        className={`w-full py-3 rounded font-bold uppercase tracking-wider shadow transition flex justify-center items-center gap-2
                            ${gameState.questions.length > 0 && gameState.status !== 'ACTIVE'
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                       <PlayCircle size={20} /> Start Game
                    </button>
                </div>
             </div>
          </div>

          {/* Gameplay Controls */}
          {gameState.status === 'ACTIVE' && (
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <h3 className="font-bold text-gray-700 mb-2 uppercase">Round Controls</h3>
                  
                  <button 
                    onClick={triggerWrongAnswer}
                    className="w-full mb-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg shadow font-bold flex items-center justify-center gap-2 transition active:scale-95"
                  >
                        <X size={24} /> STRIKE ({gameState.wrongAnswerCount})
                  </button>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-bold text-blue-900 mb-2 uppercase flex justify-between items-center">
                        Assign Points & Next
                        <span className="text-yellow-600 text-lg">{currentRoundTotal} pts</span>
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">Click a team to give them {currentRoundTotal} points and start the next round.</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {gameState.teamScores.map((score, idx) => (
                            <button
                                key={idx}
                                onClick={() => assignPointsAndNext(idx)}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-1 rounded shadow text-sm font-bold transition active:scale-95"
                            >
                                Team {idx + 1}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => assignPointsAndNext(null)}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded shadow text-sm font-bold flex justify-center items-center gap-2"
                    >
                        <Trash2 size={16} /> No Points / Next Question
                    </button>
                  </div>

                  <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase font-bold mb-2">Cheat Sheet</div>
                      <ul className="space-y-2">
                          {currentQ?.answers.map((ans, idx) => (
                              <li 
                                key={idx} 
                                onClick={() => !ans.revealed && handleReveal(idx)}
                                className={`flex justify-between items-center p-2 rounded cursor-pointer border
                                    ${ans.revealed 
                                        ? 'bg-green-50 border-green-200 text-green-700 opacity-60' 
                                        : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                              >
                                  <span className="font-medium truncate mr-2">{idx + 1}. {ans.text}</span>
                                  <span className="font-mono font-bold">{ans.points}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
          )}
          
          <button onClick={resetGame} className="text-red-500 text-sm flex items-center gap-1 hover:underline"><RefreshCw size={14}/> Reset Everything</button>
        </div>

        {/* Right Column: Live Board Preview */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl p-4 shadow-inner flex flex-col">
            <div className="flex items-center justify-between text-gray-400 mb-4 px-2">
                <span className="flex items-center gap-2 font-bold uppercase text-sm"><Eye size={16}/> Audience View</span>
                {gameState.status === 'FINISHED' && <span className="text-yellow-400 font-bold">GAME OVER</span>}
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg p-2 md:p-8 overflow-hidden relative">
               {gameState.status === 'IDLE' || gameState.status === 'WAITING' ? (
                   <div className="text-white text-opacity-50 text-center">
                       <h2 className="text-3xl font-display mb-2">FAMILY FEUD LIVE</h2>
                       <p>Waiting to start...</p>
                   </div>
               ) : (
                   <div className="w-full transform scale-75 md:scale-90 origin-top">
                       <AnswerBoard 
                          question={gameState.questions[gameState.currentQuestionIndex]} 
                          wrongAnswerCount={gameState.wrongAnswerCount}
                          isAdmin={true}
                          onReveal={handleReveal}
                          teamScores={gameState.teamScores}
                       />
                   </div>
               )}
            </div>
        </div>

      </main>
    </div>
  );
};
