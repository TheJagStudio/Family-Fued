
import React from 'react';
import { Answer, Question } from '../types';

interface BoardProps {
  question: Question | null;
  wrongAnswerCount?: number;
  isAdmin?: boolean;
  onReveal?: (answerIndex: number) => void;
  teamScores: number[];
}

export const AnswerBoard: React.FC<BoardProps> = ({ question, wrongAnswerCount = 0, isAdmin, onReveal, teamScores }) => {
  // Determine how many slots to show
  // If no question is active (e.g. idle state), show 8 placeholder slots
  // Otherwise, show exactly as many slots as there are answers
  const answerCount = question?.answers.length || 0;
  const totalSlots = question ? answerCount : 8;
  
  // Split answers into two columns
  const splitIndex = Math.ceil(totalSlots / 2);
  
  const renderSlot = (index: number) => {
    const answer = question?.answers[index];
    const isRevealed = answer?.revealed;
    const hasAnswer = !!answer;

    return (
      <div 
        key={index} 
        className={`
          relative w-full h-20 perspective-1000 
          ${isAdmin && hasAnswer && !isRevealed ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        `}
        onClick={() => {
          if (isAdmin && hasAnswer && !isRevealed && onReveal) {
            onReveal(index);
          }
        }}
      >
        <div className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${isRevealed ? 'rotate-y-180' : ''}`}>
          
          {/* Front (Hidden) */}
          <div className="absolute w-full h-full backface-hidden border-2 border-white bg-gradient-to-b from-blue-700 to-blue-900 shadow-lg flex items-center justify-center overflow-hidden rounded-md">
            <div className="absolute inset-1 border border-blue-400/30 rounded-sm"></div>
            <div className="w-12 h-10 rounded-full bg-blue-950 flex items-center justify-center border-2 border-blue-500 shadow-inner">
              <span className="text-white font-display text-xl">{index + 1}</span>
            </div>
          </div>

          {/* Back (Revealed) */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 border-2 border-white bg-gradient-to-b from-blue-100 to-blue-300 shadow-lg flex items-center justify-between px-4 overflow-hidden rounded-md">
             {hasAnswer ? (
               <>
                <div className="flex-1 bg-blue-900 h-14 flex items-center px-4 border border-white/50 shadow-inner mr-2">
                   <span className="text-white font-condensed text-xl md:text-2xl uppercase tracking-wider truncate">
                     {answer.text}
                   </span>
                </div>
                <div className="w-14 h-14 bg-blue-900 border border-white/50 shadow-inner flex items-center justify-center">
                  <span className="text-white font-display text-2xl">
                    {answer.points}
                  </span>
                </div>
               </>
             ) : (
               // Empty slot backface (if we flip an empty one, though we shouldn't)
               <div className="w-full h-full bg-blue-900"></div>
             )}
          </div>

        </div>
      </div>
    );
  };

  // Generate indices for left and right columns
  const leftIndices = Array.from({ length: splitIndex }).map((_, i) => i);
  const rightIndices = Array.from({ length: totalSlots - splitIndex }).map((_, i) => i + splitIndex);

  const leftCol = leftIndices.map(i => renderSlot(i));
  const rightCol = rightIndices.map(i => renderSlot(i));

  const currentRoundPoints = question 
    ? question.answers.filter(a => a.revealed).reduce((acc, curr) => acc + curr.points, 0)
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col h-full justify-center">
      {/* Question Header */}
      <div className="w-full bg-yellow-400 p-1 rounded-lg mb-6 shadow-xl">
         <div className="bg-blue-900 border-4 border-black p-6 rounded text-center min-h-[120px] flex items-center justify-center">
            <h2 className="text-white font-condensed text-2xl md:text-4xl uppercase tracking-wide leading-tight">
              {question ? question.text : "Waiting for Host..."}
            </h2>
         </div>
      </div>

      {/* Answers Grid */}
      <div className="bg-yellow-500 p-2 md:p-4 rounded-xl shadow-2xl border-4 border-yellow-600 mb-6">
        <div className="bg-black p-2 md:p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 border-4 border-blue-900">
          <div className="space-y-3">{leftCol}</div>
          <div className="space-y-3">{rightCol}</div>
        </div>
      </div>
      
      {/* Footer Info: Round Score and Strikes */}
      {question && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-8">
            {/* Spacer */}
            <div className="hidden md:block"></div>
            
            {/* Round Score - Centered */}
            <div className="flex justify-center">
              <div className="bg-blue-900 border-4 border-yellow-400 px-8 py-2 rounded-full shadow-lg whitespace-nowrap transform scale-90 md:scale-100">
                 <span className="text-yellow-400 font-display text-3xl tracking-widest">
                   ROUND: {currentRoundPoints}
                 </span>
              </div>
            </div>

            {/* Strikes - Right Aligned */}
            <div className="flex justify-center md:justify-end">
                <div className="flex gap-2 bg-black/40 p-2 rounded-xl border-2 border-blue-800">
                    {[1, 2, 3].map((num) => (
                        <div 
                            key={num} 
                            className={`w-10 h-10 flex items-center justify-center rounded border-2 transition-all duration-300
                                ${wrongAnswerCount >= num 
                                    ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.7)] scale-110' 
                                    : 'bg-blue-950/30 border-blue-900/50'}`}
                        >
                            {wrongAnswerCount >= num && (
                                <span className="text-white font-display text-2xl drop-shadow-md">X</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Team Scores List */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
         {teamScores.map((score, idx) => (
           <div key={idx} className="bg-blue-950 border-2 border-yellow-500/50 rounded flex flex-col items-center justify-center p-2 shadow-lg">
             <span className="text-yellow-400 font-condensed text-xs md:text-sm uppercase tracking-wider">Team {idx + 1}</span>
             <span className="text-white font-display text-xl md:text-2xl">{score}</span>
           </div>
         ))}
      </div>
    </div>
  );
};
