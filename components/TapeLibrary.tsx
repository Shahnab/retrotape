
import React from 'react';
import { Tape } from '../types';
import Cassette from './Cassette';

interface TapeLibraryProps {
  tapes: Tape[];
  onSelect: (tape: Tape) => void;
}

const TapeLibrary: React.FC<TapeLibraryProps> = ({ tapes, onSelect }) => {
  return (
    <div className="relative w-full h-full min-h-[400px] p-10">
        {tapes.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 font-hand text-4xl rotate-[-10deg] pointer-events-none">
                Desk is empty...
            </div>
        )}
        
        <div className="flex flex-wrap content-start gap-8 justify-center lg:justify-start">
            {tapes.map((tape) => (
                <div key={tape.id} className="relative group w-64 h-40" onClick={() => onSelect(tape)}>
                    <Cassette 
                        // Override position for grid view and use analysis title if available
                        tape={{
                            ...tape, 
                            x: 0, 
                            y: 0, 
                            rotation: 0,
                            title: tape.analysis?.title || tape.title
                        }}
                        isDraggable={false}
                    />
                    {/* Hover Tooltip */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {tape.analysis?.summary ? tape.analysis.summary.substring(0, 30) + '...' : tape.date}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default TapeLibrary;
