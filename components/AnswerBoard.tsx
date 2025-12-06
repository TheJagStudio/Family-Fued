import React from 'react';
import { Answer, Question } from '../types';

interface BoardProps {
  question: Question | null;
  isAdmin?: boolean;
  onReveal?: (answerIndex: number) => void;
}

export const AnswerBoard: React.FC<BoardProps> = ({ question, isAdmin, onReveal }) => {
  // Standard Family Feud board has 8 slots (4 left, 4 right) usually
  const TOTAL_SLOTS = 8;
  
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

  // Split into left and right columns
  const leftCol = Array.from({ length: 4 }).map((_, i) => renderSlot(i));
  const rightCol = Array.from({ length: 4 }).map((_, i) => renderSlot(i + 4));

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Question Header */}
      <div className="w-full bg-yellow-400 p-1 rounded-lg mb-8 shadow-xl">
         <div className="bg-blue-900 border-4 border-black p-6 rounded text-center min-h-[120px] flex items-center justify-center">
            <h2 className="text-white font-condensed text-2xl md:text-4xl uppercase tracking-wide leading-tight">
              {question ? question.text : "Waiting for Host..."}
            </h2>
         </div>
      </div>

      {/* Answers Grid */}
      <div className="bg-yellow-500 p-2 md:p-4 rounded-xl shadow-2xl border-4 border-yellow-600">
        <div className="bg-black p-2 md:p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 border-4 border-blue-900">
          <div className="space-y-3">{leftCol}</div>
          <div className="space-y-3">{rightCol}</div>
        </div>
      </div>
      
      {/* Total Score (Optional visual filler) */}
      {question && (
        <div className="mt-8 flex justify-center">
          <div className="bg-blue-900 border-4 border-yellow-400 px-12 py-4 rounded-full shadow-lg">
             <span className="text-yellow-400 font-display text-4xl tracking-widest">
               TOTAL: {question.answers.filter(a => a.revealed).reduce((acc, curr) => acc + curr.points, 0)}
             </span>
          </div>
        </div>
      )}
    </div>
  );
};
