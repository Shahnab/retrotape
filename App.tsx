import React, { useState, useRef, useEffect } from 'react';
import Walkman from './components/Walkman';
import Notepad from './components/Notepad';
import Cassette from './components/Cassette';
import { Tape, PlayerState } from './types';
import { generateRetroBackground } from './services/geminiService';
import { fetchSongsByArtist } from './services/musicService';
import { getTokenFromUrl, getStoredToken, loginToSpotify, searchSpotifyArtistAndTracks, isSpotifyConfigured } from './services/spotifyService';
import { Sparkles, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.STOPPED);
  const [loadedTape, setLoadedTape] = useState<Tape | null>(null);
  const [looseTapes, setLooseTapes] = useState<Tape[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // Spotify State
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  
  // Background Gen State
  const [bgImage, setBgImage] = useState<string | null>('./image/img1.png');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [staticBgIndex, setStaticBgIndex] = useState(1); // Start with img1

  // Environment Configuration Check
  const hasGeminiKey = !!process.env.API_KEY;
  const hasSpotifyKey = isSpotifyConfigured();

  // Refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const walkmanRef = useRef<HTMLDivElement>(null);

  // State Refs to avoid stale closures in audio callbacks
  const looseTapesRef = useRef(looseTapes);
  const loadedTapeRef = useRef(loadedTape);
  const shouldAutoPlayRef = useRef(false);

  // Sync Refs
  useEffect(() => { looseTapesRef.current = looseTapes; }, [looseTapes]);
  useEffect(() => { loadedTapeRef.current = loadedTape; }, [loadedTape]);

  // --- Spotify Auth Check ---
  useEffect(() => {
    // 1. Check URL for fresh login
    const urlToken = getTokenFromUrl();
    if (urlToken) {
        setSpotifyToken(urlToken);
        window.location.hash = ""; // Clear hash to clean URL
    } else {
        // 2. Check local storage for existing session
        const storedToken = getStoredToken();
        if (storedToken) {
            setSpotifyToken(storedToken);
        }
    }
  }, []);

  // --- Audio Logic ---
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (loadedTape && shouldAutoPlayRef.current) {
        const timer = setTimeout(() => {
            playAudio();
            shouldAutoPlayRef.current = false;
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [loadedTape]);

  const handleSongEnd = () => {
    setPlayerState(PlayerState.STOPPED);
    
    const currentTape = loadedTapeRef.current;
    const deskTapes = looseTapesRef.current;

    if (!currentTape) return;

    // Eject current tape
    const ejectedTape = {
        ...currentTape,
        x: 700 + (Math.random() * 100), 
        y: 400 + (Math.random() * 100),
        rotation: Math.random() * 20 - 10
    };

    if (deskTapes.length > 0) {
        const nextTape = deskTapes[0];
        const remainingTapes = deskTapes.slice(1);

        setLooseTapes([...remainingTapes, ejectedTape]);
        setLoadedTape(nextTape);
        shouldAutoPlayRef.current = true;
    } else {
        setLooseTapes(prev => [...prev, ejectedTape]);
        setLoadedTape(null);
    }
  };

  const playAudio = () => {
    if (!loadedTape) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    
    const player = audioPlayerRef.current;
    if (player.src !== loadedTape.previewUrl) {
        player.src = loadedTape.previewUrl;
    }
    player.volume = volume;
    player.onended = handleSongEnd;

    player.play().catch(e => console.error("Playback failed", e));
    setPlayerState(PlayerState.PLAYING);
  };

  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayerState(PlayerState.PAUSED);
    }
  };

  const stopPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setPlayerState(PlayerState.STOPPED);
    }
  };

  const ejectTape = () => {
    stopPlayback();
    shouldAutoPlayRef.current = false;
    if (loadedTape) {
        const ejectedTape = {
            ...loadedTape,
            x: 750 + (Math.random() * 50),
            y: 450 + (Math.random() * 50),
            rotation: Math.random() * 30 - 15
        };
        setLooseTapes(prev => [...prev, ejectedTape]);
        setLoadedTape(null);
    }
  };

  // --- Search Logic ---
  const handleSearch = async (artist: string) => {
    // Normalize artist name for comparison (lowercase, trim)
    const normalizedArtist = artist.toLowerCase().trim();
    
    // Check if artist already exists in loose tapes or loaded tape
    const allTapes = [...looseTapes, ...(loadedTape ? [loadedTape] : [])];
    const artistExists = allTapes.some(tape => 
      tape.artist.toLowerCase().trim() === normalizedArtist
    );
    
    if (artistExists) {
      alert(`You already have songs from "${artist}" on your desk! Try a different artist.`);
      return;
    }
    
    setIsSearching(true);
    try {
        let newTapes: Tape[] = [];

        // Only try Spotify if token exists (implies configured & logged in)
        if (spotifyToken) {
            try {
                newTapes = await searchSpotifyArtistAndTracks(spotifyToken, artist);
            } catch (e) {
                // If spotify fails, fall through to iTunes
                console.warn("Spotify search failed, falling back to iTunes");
            }
        }
        
        // Fallback to iTunes if Spotify returned nothing or wasn't used
        if (newTapes.length === 0) {
            if (spotifyToken) {
                 // Only alert if user THOUGHT they were searching Spotify
                 alert("No songs found on Spotify with preview URLs. trying iTunes fallback...");
            }
            newTapes = await fetchSongsByArtist(artist);
        }
        
        // Position Strategy: Better distributed across desk area
        // Walkman is on left (0-500px), Notepad is top-right (~right-10)
        // Create more natural scattered distribution using varied clustering
        
        const scatteredTapes = newTapes.map((t, index) => {
            // Create multiple cluster zones for more natural distribution
            const zone = index % 3;
            let baseX, baseY;
            
            if (zone === 0) {
                // Top-center zone
                baseX = 600 + (Math.random() * 450);
                baseY = 80 + (Math.random() * 250);
            } else if (zone === 1) {
                // Middle-right zone
                baseX = 750 + (Math.random() * 400);
                baseY = 300 + (Math.random() * 280);
            } else {
                // Bottom-center zone
                baseX = 600 + (Math.random() * 450);
                baseY = 520 + (Math.random() * 200);
            }
            
            return {
                ...t,
                x: baseX,
                y: baseY,
                rotation: (Math.random() * 60 - 30)   // Rotation between -30° and +30° for angled but not upside down
            };
        });
        
        setLooseTapes(prev => [...prev, ...scatteredTapes]);
    } catch (error) {
        console.error(error);
        alert("Could not find songs for that artist.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!hasGeminiKey) {
      alert("Gemini key not set, so use the static background");
      return;
    }
    
    setIsGeneratingBg(true);
    try {
        const imageBase64 = await generateRetroBackground();
        setBgImage(imageBase64);
    } catch (e) {
        alert("Failed to generate background.");
    } finally {
        setIsGeneratingBg(false);
    }
  };

  const handleStaticBackground = () => {
    // Cycle through img1 to img6
    const nextIndex = staticBgIndex >= 6 ? 1 : staticBgIndex + 1;
    setStaticBgIndex(nextIndex);
    setBgImage(`./image/img${nextIndex}.png`);
  };

  const handleTapeDragEnd = (tape: Tape, info: any) => {
    if (!walkmanRef.current) return;

    const walkmanRect = walkmanRef.current.getBoundingClientRect();
    const dropPoint = info.point; 

    // Check if dropped on walkman
    if (
        dropPoint.x >= walkmanRect.left &&
        dropPoint.x <= walkmanRect.right &&
        dropPoint.y >= walkmanRect.top &&
        dropPoint.y <= walkmanRect.bottom
    ) {
        if (loadedTape) return;
        
        setLooseTapes(prev => prev.filter(t => t.id !== tape.id));
        setLoadedTape(tape);
        shouldAutoPlayRef.current = false; 
    } else {
        // Update tape position after drag
        const updatedTape = {
            ...tape,
            x: tape.x + info.offset.x,
            y: tape.y + info.offset.y
        };
        setLooseTapes(prev => prev.map(t => t.id === tape.id ? updatedTape : t));
    }
  };

  const handleTapeUpdate = (updatedTape: Tape) => {
    setLooseTapes(prev => prev.map(t => t.id === updatedTape.id ? updatedTape : t));
  };

  return (
    <div 
        className={`h-screen w-screen overflow-hidden relative transition-all duration-1000 ${!bgImage ? 'bg-desk' : ''}`}
        style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {!bgImage && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 to-black/40 pointer-events-none z-0"></div>}

      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <button 
            onClick={handleGenerateBackground}
            disabled={true}
            className="px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 text-xs font-mono-tech text-white/40 cursor-not-allowed opacity-50"
        >
            <Sparkles className="w-3 h-3 text-yellow-300/40" />
            NEW DESK THEME
        </button>
        
        <button 
            onClick={handleStaticBackground}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-2 text-xs font-mono-tech text-white/80 hover:bg-white/20 transition-colors"
        >
            <Sparkles className="w-3 h-3 text-cyan-300" />
            STATIC BACKGROUND
        </button>
      </div>

      <Notepad 
        onSearch={handleSearch} 
        isSearching={isSearching} 
        onConnectSpotify={loginToSpotify}
        isSpotifyConnected={false}
        isSpotifyConfigured={true}
      />

      <Walkman 
        walkmanRef={walkmanRef}
        loadedTape={loadedTape}
        playerState={playerState}
        onPlay={playAudio}
        onPause={pauseAudio}
        onStop={stopPlayback}
        onEject={ejectTape}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {looseTapes.map((tape) => (
        <Cassette 
            key={tape.id} 
            tape={tape} 
            onDragEnd={(e, info) => handleTapeDragEnd(tape, info)}
            onUpdate={handleTapeUpdate}
        />
      ))}
      
      {looseTapes.length === 0 && !loadedTape && !isSearching && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
              <p className="font-hand text-4xl text-white rotate-[-5deg]">Search for an Artist to start...</p>
          </div>
      )}
    </div>
  );
};

export default App;