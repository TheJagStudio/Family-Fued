
import React, { useState, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameState, INITIAL_STATE, PeerMessage } from '../types';
import { AnswerBoard } from './AnswerBoard';
import { WrongOverlay } from './WrongOverlay';
import { Wifi, WifiOff, Trophy } from 'lucide-react';

const PEER_PREFIX = 'ff-quiz-';

export const Display: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [showWrong, setShowWrong] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const connectToRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    setErrorMsg('');

    const newPeer = new Peer();
    
    newPeer.on('open', () => {
      // User types "ABCDEF", we connect to "ff-quiz-ABCDEF"
      const fullId = `${PEER_PREFIX}${roomId.toUpperCase()}`;
      console.log('Connecting to:', fullId);
      
      const connection = newPeer.connect(fullId);
      
      connection.on('open', () => {
        setIsConnected(true);
        setConn(connection);
      });

      connection.on('data', (data: any) => {
        const msg = data as PeerMessage;
        
        if (msg.type === 'SYNC_STATE') {
          setGameState(msg.payload);
        } else if (msg.type === 'SHOW_WRONG') {
          triggerWrong();
        } else if (msg.type === 'RESET') {
            setGameState(INITIAL_STATE);
        }
      });

      connection.on('close', () => {
        setIsConnected(false);
        setErrorMsg('Host disconnected');
      });
      
      connection.on('error', (err) => {
          console.error(err);
          setErrorMsg('Connection error');
      });
    });

    newPeer.on('error', (err) => {
        console.error("Peer error", err);
        setErrorMsg('Could not connect to peer network');
    });

    setPeer(newPeer);
  };

  const triggerWrong = () => {
      setShowWrong(true);
      setTimeout(() => setShowWrong(false), 2000);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (peer) peer.destroy();
    };
  }, [peer]);

  // Determine Winner
  const getWinner = () => {
      const maxScore = Math.max(...gameState.teamScores);
      // Determine indices of all teams with maxScore
      const winners = gameState.teamScores
        .map((score, index) => score === maxScore ? index + 1 : null)
        .filter((val) => val !== null);
      
      return { winners, maxScore };
  };

  const renderVictory = () => {
    const { winners, maxScore } = getWinner();
    const isDraw = winners.length > 1;

    // Create 50 confetti particles
    const confettiParticles = Array.from({ length: 50 }).map((_, i) => (
       <div 
         key={i}
         className="confetti-piece"
         style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            backgroundColor: ['#facc15', '#ef4444', '#3b82f6', '#ffffff'][Math.floor(Math.random() * 4)]
         }}
       />
    ));

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-950 overflow-hidden z-20">
            {confettiParticles}
            <div className="animate-pop-in text-center relative z-10 p-8 border-8 border-yellow-400 bg-blue-900 rounded-3xl shadow-2xl max-w-2xl mx-4">
                 <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6 drop-shadow-lg" />
                 <h1 className="text-6xl md:text-8xl font-display text-white mb-2 tracking-widest uppercase">
                    {isDraw ? "DRAW!" : "WINNER!"}
                 </h1>
                 <div className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl inline-block mt-4 transform -rotate-2">
                     <span className="text-4xl md:text-6xl font-condensed font-bold uppercase">
                         {isDraw ? "TEAMS " + winners.join(" & ") : "TEAM " + winners[0]}
                     </span>
                 </div>
                 <p className="text-blue-200 mt-8 text-2xl font-condensed">TOTAL SCORE: {maxScore}</p>
            </div>
        </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-2xl border-4 border-yellow-400">
           <h1 className="text-4xl font-display text-blue-900 text-center mb-2">FAMILY FEUD</h1>
           <p className="text-center text-gray-500 mb-8 font-condensed tracking-wide">DISPLAY BOARD</p>
           
           <form onSubmit={connectToRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ROOM CODE</label>
                <input 
                  type="text" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full text-4xl font-mono text-center p-3 border-2 border-gray-300 rounded focus:border-blue-600 outline-none uppercase tracking-widest placeholder:text-gray-300 placeholder:text-2xl"
                  placeholder="6-DIGIT CODE"
                />
              </div>
              {errorMsg && <p className="text-red-500 text-center text-sm font-bold">{errorMsg}</p>}
              <button 
                type="submit" 
                disabled={roomId.length < 6}
                className={`w-full font-bold py-4 rounded text-xl uppercase tracking-widest shadow-lg transition-transform active:scale-95
                   ${roomId.length < 6 ? 'bg-gray-400 cursor-not-allowed text-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                Connect
              </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-feud-blue flex flex-col relative overflow-hidden">
      <WrongOverlay visible={showWrong} />
      
      {/* Connection Indicator */}
      <div className="absolute top-4 right-4 z-10 opacity-50 hover:opacity-100 transition-opacity">
         {isConnected ? <Wifi className="text-green-400" /> : <WifiOff className="text-red-400" />}
      </div>

      <div className="flex-1 flex items-center justify-center p-2 md:p-8">
        {gameState.status === 'IDLE' || gameState.status === 'WAITING' ? (
          <div className="text-center animate-pulse">
            <h1 className="text-6xl md:text-9xl font-display text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-widest">
              FAMILY<br/>FEUD
            </h1>
            <p className="text-white text-xl md:text-2xl mt-8 font-condensed tracking-widest uppercase">
              Waiting for Host to Start...
            </p>
          </div>
        ) : gameState.status === 'FINISHED' ? (
           renderVictory()
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AnswerBoard 
                question={gameState.questions[gameState.currentQuestionIndex]} 
                wrongAnswerCount={gameState.wrongAnswerCount}
                teamScores={gameState.teamScores}
            />
          </div>
        )}
      </div>
    </div>
  );
};
