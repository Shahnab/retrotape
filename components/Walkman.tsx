import React, { useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Tape, PlayerState } from '../types';
import Cassette from './Cassette';
import { RotateCw } from 'lucide-react';

interface WalkmanProps {
  loadedTape: Tape | null;
  playerState: PlayerState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onEject: () => void;
  walkmanRef: React.RefObject<HTMLDivElement | null>;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const Walkman: React.FC<WalkmanProps> = ({ 
  loadedTape, 
  playerState, 
  onPlay, 
  onPause, 
  onStop, 
  onEject,
  walkmanRef,
  volume,
  onVolumeChange
}) => {
  const sliderTrackRef = useRef<SVGRectElement>(null);
  const dragControls = useDragControls();

  // Rotation State
  const [rotation, setRotation] = useState(5); // Initial tilt reduced to 5 degrees
  const [isRotating, setIsRotating] = useState(false);
  const rotationOffset = useRef(0);

  // Start drag manually on the parent container
  const startDrag = (e: React.PointerEvent) => {
    // Only drag if we aren't rotating
    if (!isRotating) {
        dragControls.start(e);
    }
  };

  // Stop drag propagation on controls so buttons work smoothly and don't drag player
  const handleControlPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  // --- Rotation Logic ---
  const handleRotateDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!walkmanRef.current) return;

    setIsRotating(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    // Calculate current angle of mouse relative to center
    const rect = walkmanRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    // Store the difference between mouse angle and object rotation
    // so we can maintain relative offset (no snapping)
    rotationOffset.current = startAngle - rotation;
  };

  const handleRotateMove = (e: React.PointerEvent) => {
    if (!isRotating || !walkmanRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = walkmanRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    setRotation(currentAngle - rotationOffset.current);
  };

  const handleRotateUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(false);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  };

  // --- Volume Logic ---
  const updateVolumeFromClientY = (clientY: number) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const height = rect.height;
    // Calculate relative position inside the track
    const relativeY = clientY - rect.top;
    
    // Normalize 0 to 1.
    let newVolume = 1 - (relativeY / height);
    
    // Clamp values
    if (newVolume < 0) newVolume = 0;
    if (newVolume > 1) newVolume = 1;
    
    onVolumeChange(newVolume);
  };

  const handleVolumePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Prevent Walkman drag start
    
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    updateVolumeFromClientY(e.clientY);
  };

  const handleVolumePointerMove = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) {
          updateVolumeFromClientY(e.clientY);
      }
  };

  const handleVolumePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  };

  // Knob position calculation: Track height 80, Knob height 10. Max offset 70.
  const knobY = (1 - volume) * 70;

  return (
    <motion.div 
      ref={walkmanRef}
      drag
      dragListener={false} // Disable default listeners to control drag manually
      dragControls={dragControls}
      onPointerDown={startDrag}
      dragMomentum={false}
      initial={{ x: window.innerWidth - 600, y: window.innerHeight - 750 }}
      style={{ rotate: rotation }} // Controlled rotation
      whileDrag={{ scale: 1.02, cursor: 'grabbing', zIndex: 60 }}
      whileHover={{ cursor: 'grab' }}
      className="absolute w-[450px] h-[720px] z-30 group bg-transparent"
    >
        {/* Rotation Handle (Visible on Hover) */}
        <div 
            className="absolute -top-8 -right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 hover:bg-white/20"
            onPointerDown={handleRotateDown}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateUp}
            title="Rotate Walkman"
        >
            <RotateCw className="w-6 h-6 text-white/90" />
        </div>

        <svg viewBox="0 0 300 480" className="w-full h-full select-none overflow-visible" style={{ filter: 'drop-shadow(rgba(10, 5, 30, 0.7) 0px 20px 30px) drop-shadow(rgba(20, 10, 50, 0.6) 5px 5px 5px)', transition: 'filter 0.5s' }}>
            <defs>
                <filter id="body-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"></feTurbulence>
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.1 0" in="noise" result="coloredNoise"></feColorMatrix>
                    <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite"></feComposite>
                    <feBlend mode="multiply" in="composite" in2="SourceGraphic"></feBlend>
                </filter>
                <linearGradient id="body-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2e3e52"></stop>
                    <stop offset="50%" stopColor="#44566c"></stop>
                    <stop offset="100%" stopColor="#2e3e52"></stop>
                </linearGradient>
                <linearGradient id="metal-silver" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9ca3af"></stop>
                    <stop offset="20%" stopColor="#cbd5e1"></stop>
                    <stop offset="50%" stopColor="#6b7280"></stop>
                    <stop offset="80%" stopColor="#94a3b8"></stop>
                    <stop offset="100%" stopColor="#6b7280"></stop>
                </linearGradient>
                <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)"></stop>
                    <stop offset="50%" stopColor="rgba(255,255,255,0.05)"></stop>
                    <stop offset="100%" stopColor="rgba(255,255,255,0.2)"></stop>
                </linearGradient>
                <filter id="window-inset-soft">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4"></feGaussianBlur>
                    <feOffset dx="0" dy="4" result="offsetblur"></feOffset>
                    <feFlood floodColor="#000" floodOpacity="0.4"></feFlood>
                    <feComposite in2="offsetblur" operator="in"></feComposite>
                    <feComposite in2="SourceAlpha" operator="in"></feComposite>
                    <feMerge>
                        <feMergeNode in="SourceGraphic"></feMergeNode>
                        <feMergeNode></feMergeNode>
                    </feMerge>
                </filter>
                <radialGradient id="window-vignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                    <stop offset="80%" stopColor="#000" stopOpacity="0"></stop>
                    <stop offset="100%" stopColor="#000" stopOpacity="0.8"></stop>
                </radialGradient>
                <radialGradient id="screw-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff"></stop>
                    <stop offset="100%" stopColor="#333"></stop>
                </radialGradient>
                <filter id="button-bevel" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"></feGaussianBlur>
                    <feOffset in="blur" dx="0" dy="1" result="shadow"></feOffset>
                    <feSpecularLighting in="blur" surfaceScale="2" specularConstant="1" specularExponent="10" lightingColor="#fff" result="specular">
                        <fePointLight x="-5000" y="-10000" z="20000"></fePointLight>
                    </feSpecularLighting>
                    <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular"></feComposite>
                    <feComposite in="SourceGraphic" in2="shadow" operator="over"></feComposite>
                </filter>
                <clipPath id="window-clip">
                    <rect x="0" y="0" width="170" height="250" rx="2"></rect>
                </clipPath>
            </defs>
            
            {/* Main Body */}
            <path d="M 20,20 H 220 V 460 H 20 A 10,10 0 0 1 10,450 V 30 A 10,10 0 0 1 20,20 Z" fill="url(#body-blue)" filter="url(#body-noise)" stroke="#1e293b" strokeWidth="1"></path>
            <path d="M 220,20 H 280 A 10,10 0 0 1 290,30 V 450 A 10,10 0 0 1 280,460 H 220 V 20 Z" fill="url(#metal-silver)" stroke="#6b7280" strokeWidth="1"></path>
            <line x1="220" y1="20" x2="220" y2="460" stroke="#000" strokeOpacity="0.3" strokeWidth="1"></line>
            
            {/* Branding */}
            <text x="30" y="60" fontFamily="serif" fontWeight="bold" fontSize="22" fill="#e2e8f0" letterSpacing="1" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 1px 1px 2px' }}>SONY</text>
            <text x="30" y="430" fontFamily="sans-serif" fontWeight="bold" fontSize="16" fill="#fff" letterSpacing="2">WALKMAN</text>
            <text x="30" y="442" fontFamily="sans-serif" fontSize="8" fill="#cbd5e1">STEREO CASSETTE PLAYER</text>
            
            {/* Custom Signature */}
            <text x="210" y="442" textAnchor="end" fontFamily="sans-serif" fontSize="5" fill="#64748b" opacity="0.7" letterSpacing="1" style={{ textTransform: 'uppercase' }}>SHAHNAB</text>
            
            {/* Tape Window */}
            <g transform="translate(30, 100)">
                <rect x="-5" y="-5" width="180" height="260" rx="4" fill="#050505"></rect>
                <rect x="0" y="0" width="170" height="250" rx="2" fill="#0a0a0a" filter="url(#window-inset-soft)"></rect>
                
                {/* Loaded Tape or Empty Spindles */}
                <foreignObject x="0" y="0" width="170" height="250" clipPath="url(#window-clip)">
                    {loadedTape ? (
                         <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <motion.div 
                                key={loadedTape.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1.35, rotate: 90 }}
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="origin-center"
                            >
                                <Cassette 
                                    tape={{...loadedTape, x: 0, y: 0, rotation: 0}}
                                    isPlaying={playerState === PlayerState.PLAYING}
                                    isDraggable={false}
                                    className="w-80 h-52 !shadow-none"
                                />
                            </motion.div>
                         </div>
                    ) : <div className="w-full h-full" />}
                </foreignObject>

                {/* Empty State Spindles (SVG Native) */}
                {!loadedTape && (
                    <g clipPath="url(#window-clip)">
                        <g opacity="0.5" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                             <motion.g 
                                initial={false}
                                animate={playerState === PlayerState.PLAYING ? { rotate: -360 } : { rotate: 0 }}
                                transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                style={{ originX: '85px', originY: '55px' }}
                             >
                                <circle cx="85" cy="55" r="15" fill="#333" stroke="#555"></circle>
                                <path d="M 80,55 L 90,55 M 85,50 L 85,60" stroke="#999" strokeWidth="2"></path>
                                {/* 3-Wing Spindle Shape */}
                                <path d="M 85,55 L 85,40 L 92,42 Z" fill="#555" transform="rotate(0 85 55)"></path>
                                <path d="M 85,55 L 85,40 L 92,42 Z" fill="#555" transform="rotate(120 85 55)"></path>
                                <path d="M 85,55 L 85,40 L 92,42 Z" fill="#555" transform="rotate(240 85 55)"></path>
                             </motion.g>
                        </g>
                        <g opacity="0.5" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                             <motion.g 
                                initial={false}
                                animate={playerState === PlayerState.PLAYING ? { rotate: -360 } : { rotate: 0 }}
                                transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                style={{ originX: '85px', originY: '195px' }}
                             >
                                <circle cx="85" cy="195" r="15" fill="#333" stroke="#555"></circle>
                                <path d="M 80,195 L 90,195 M 85,190 L 85,200" stroke="#999" strokeWidth="2"></path>
                                {/* 3-Wing Spindle Shape */}
                                <path d="M 85,195 L 85,180 L 92,182 Z" fill="#555" transform="rotate(0 85 195)"></path>
                                <path d="M 85,195 L 85,180 L 92,182 Z" fill="#555" transform="rotate(120 85 195)"></path>
                                <path d="M 85,195 L 85,180 L 92,182 Z" fill="#555" transform="rotate(240 85 195)"></path>
                            </motion.g>
                        </g>
                    </g>
                )}

                <rect x="0" y="0" width="170" height="250" rx="2" fill="#000" opacity="0.3" pointerEvents="none"></rect>
                <rect x="0" y="0" width="170" height="250" rx="2" fill="url(#window-vignette)" pointerEvents="none" style={{ mixBlendMode: 'multiply' }}></rect>
                <rect x="0" y="0" width="170" height="250" rx="2" fill="none" stroke="#000" strokeWidth="12" opacity="0.4" filter="blur(6px)"></rect>
                
                <path d="M 0,250 L 60,0 L 100,0 L 40,250 Z" fill="#fff" opacity="0.03" pointerEvents="none"></path>
                <rect x="0" y="0" width="170" height="250" rx="2" fill="url(#glass-gradient)" opacity="0.15" pointerEvents="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"></rect>
                <path d="M 150,200 L 150,170 L 145,175 M 150,170 L 155,175" stroke="#64748b" strokeWidth="2" fill="none"></path>
            </g>
            
            {/* Battery Light */}
            <circle cx="190" cy="55" r="3" fill={playerState === PlayerState.PLAYING ? "#ef4444" : "#333"} stroke="#111" className={playerState === PlayerState.PLAYING ? "animate-pulse" : ""}></circle>
            <text x="195" y="58" fontSize="6" fill="#94a3b8">BATT</text>
            
            {/* Controls Sidebar */}
            <g transform="translate(220, 80)">
                <rect x="15" y="0" width="6" height="80" rx="3" fill="#111"></rect>
                
                {/* Interactive Volume Slider */}
                <g 
                    className="cursor-ns-resize" 
                    onPointerDown={handleVolumePointerDown}
                    onPointerMove={handleVolumePointerMove}
                    onPointerUp={handleVolumePointerUp}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Invisible larger hit area */}
                    <rect x="-10" y="-10" width="50" height="100" fill="transparent" />
                    
                    {/* Track */}
                    <rect ref={sliderTrackRef} x="15" y="0" width="6" height="80" rx="3" fill="transparent"></rect>
                    
                    {/* Knob */}
                    <g transform={`translate(0, ${knobY})`}>
                        <rect x="12" y="0" width="12" height="10" rx="1" fill="#333" stroke="#555" strokeWidth="0.5"></rect>
                        <line x1="14" y1="5" x2="22" y2="5" stroke="black" strokeWidth="1" opacity="0.5" />
                    </g>
                </g>

                <text x="35" y="45" fontSize="6" fill="#222" transform="rotate(90 35,45)">VOLUME</text>
                
                {/* Buttons Container */}
                <rect x="2" y="140" width="36" height="185" rx="4" fill="#1a1a1a" stroke="#4b5563" strokeWidth="0.5"></rect>
                
                <g transform="translate(0, 150)">
                    
                    {/* Stop Button */}
                    <g 
                        className="cursor-pointer" 
                        onPointerDown={handleControlPointerDown} 
                        onClick={onStop}
                    >
                        <rect x="5" y="0" width="30" height="50" rx="2" fill="#333" stroke="#111" strokeWidth="0.5" filter="url(#button-bevel)" className="transition-transform duration-75 active:translate-y-[1px]"></rect>
                        <rect x="15" y="20" width="10" height="10" fill="#9ca3af" className="pointer-events-none"></rect>
                    </g>

                    {/* Play Button */}
                    <g 
                        className="cursor-pointer" 
                        transform="translate(0, 60)"
                        onPointerDown={handleControlPointerDown} 
                        onClick={playerState === PlayerState.PLAYING ? onPause : onPlay}
                    >
                        <motion.g animate={playerState === PlayerState.PLAYING ? { y: 2 } : { y: 0 }}>
                            <rect x="5" y="0" width="30" height="50" rx="2" fill="#f97316" stroke="#c2410c" strokeWidth="0.5" filter="url(#button-bevel)"></rect>
                            <path d="M 15,20 L 25,25 L 15,30 Z" fill="#fff" className="pointer-events-none"></path>
                        </motion.g>
                    </g>

                    {/* Eject Button */}
                    <g 
                        className="cursor-pointer" 
                        transform="translate(0, 120)"
                        onPointerDown={handleControlPointerDown} 
                        onClick={onEject}
                    >
                        <rect x="5" y="0" width="30" height="50" rx="2" fill="#333" stroke="#111" strokeWidth="0.5" filter="url(#button-bevel)" className="transition-transform duration-75 active:translate-y-[1px]"></rect>
                        <path d="M 15,30 L 25,30 L 20,23 Z" fill="#9ca3af" className="pointer-events-none"></path>
                        <rect x="15" y="32" width="10" height="2" fill="#9ca3af" className="pointer-events-none"></rect>
                    </g>
                </g>
            </g>
            
            {/* Screws */}
            <g transform="translate(25, 25)">
                <circle r="3" fill="url(#screw-gradient)" stroke="#111" strokeWidth="0.2"></circle>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#111" strokeWidth="0.5" transform="rotate(0)"></line>
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#111" strokeWidth="0.5" transform="rotate(0)"></line>
            </g>
            <g transform="translate(215, 25)">
                <circle r="3" fill="url(#screw-gradient)" stroke="#111" strokeWidth="0.2"></circle>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#111" strokeWidth="0.5" transform="rotate(45)"></line>
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#111" strokeWidth="0.5" transform="rotate(45)"></line>
            </g>
            <g transform="translate(25, 455)">
                <circle r="3" fill="url(#screw-gradient)" stroke="#111" strokeWidth="0.2"></circle>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#111" strokeWidth="0.5" transform="rotate(90)"></line>
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#111" strokeWidth="0.5" transform="rotate(90)"></line>
            </g>
            <g transform="translate(215, 455)">
                <circle r="3" fill="url(#screw-gradient)" stroke="#111" strokeWidth="0.2"></circle>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#111" strokeWidth="0.5" transform="rotate(135)"></line>
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#111" strokeWidth="0.5" transform="rotate(135)"></line>
            </g>
            <g transform="translate(250, 30)">
                <circle r="3" fill="url(#screw-gradient)" stroke="#111" strokeWidth="0.2"></circle>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#111" strokeWidth="0.5" transform="rotate(180)"></line>
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#111" strokeWidth="0.5" transform="rotate(180)"></line>
            </g>
            <g transform="translate(250, 450)">
                <circle r="3" fill="url(#screw-gradient)" stroke="#111" strokeWidth="0.2"></circle>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#111" strokeWidth="0.5" transform="rotate(225)"></line>
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#111" strokeWidth="0.5" transform="rotate(225)"></line>
            </g>
            
            {/* Top Tab */}
            <rect x="40" y="12" width="40" height="6" fill="#f97316" rx="1" stroke="#c2410c" strokeWidth="0.5"></rect>
        </svg>
    </motion.div>
  );
};

export default Walkman;