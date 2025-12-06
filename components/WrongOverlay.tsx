import React from 'react';
import { XCircle } from 'lucide-react';

interface Props {
  visible: boolean;
}

export const WrongOverlay: React.FC<Props> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative animate-pop-in">
        <XCircle className="w-64 h-64 text-red-600 fill-red-200 border-4 border-white rounded-full bg-white drop-shadow-2xl" />
        {/* Secondary Xs to mimic the show style usually having multiple or graphical Xs, keeping it clean here with one big one */}
      </div>
    </div>
  );
};
