import React, { useState } from 'react';
import { Loader2, Music2, Link as LinkIcon, Check } from 'lucide-react';

interface NotepadProps {
  onSearch: (artist: string) => void;
  isSearching: boolean;
  onConnectSpotify: () => void;
  isSpotifyConnected: boolean;
  isSpotifyConfigured: boolean;
}

const Notepad: React.FC<NotepadProps> = ({
  onSearch,
  isSearching,
  onConnectSpotify,
  isSpotifyConnected,
  isSpotifyConfigured
}) => {
  const [artist, setArtist] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (artist.trim()) {
        onSearch(artist);
    }
  };

  return (
    <div className="absolute top-10 right-10 z-40 w-72 bg-[#fefce8] shadow-[5px_5px_15px_rgba(0,0,0,0.3)] transform rotate-2 hover:rotate-0 transition-transform duration-300 p-6 flex flex-col">
      <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-24 h-8 bg-pink-400/50 backdrop-blur-sm shadow-sm transform -rotate-1"></div>
      
      <h2 className="font-hand text-2xl text-zinc-800 mb-4 border-b-2 border-pink-200 pb-2">
        Request Mix
      </h2>

      {isSpotifyConfigured && (
          <button 
            onClick={onConnectSpotify}
            disabled={true}
            className="w-full mb-4 py-2 px-3 rounded text-xs font-mono-tech flex items-center justify-center gap-2 border bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-50"
          >
            <LinkIcon className="w-3 h-3" />
            CONNECT SPOTIFY
          </button>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div>
            <label className="font-mono-tech text-xs text-zinc-500 uppercase">Artist Name</label>
            <input 
                type="text" 
                placeholder="e.g. Queen"
                className="w-full bg-transparent border-b-2 border-zinc-300 focus:border-pink-500 outline-none font-hand text-xl text-zinc-800 placeholder:text-zinc-300 mt-1"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
            />
        </div>

        <button 
            type="submit"
            disabled={isSearching || !artist.trim()}
            className="w-full py-3 bg-zinc-800 text-white font-mono-tech text-sm rounded shadow-md hover:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 group"
        >
            {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Music2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            )}
            {isSearching ? 'DIGGING CRATES...' : 'CREATE MIX'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="font-hand text-zinc-400 text-sm rotate-[-2deg]">
            "Music creates memories..."
        </p>
      </div>
      
      <div className="absolute bottom-2 right-2 text-[10px] font-mono-tech text-zinc-400">
        RetroTape Music
      </div>
    </div>
  );
};

export default Notepad;