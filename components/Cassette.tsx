import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tape } from '../types';
import { RotateCw } from 'lucide-react';

interface CassetteProps {
  tape: Tape;
  isPlaying?: boolean;
  onDragEnd?: (event: any, info: any) => void;
  isDraggable?: boolean;
  className?: string;
  onUpdate?: (tape: Tape) => void;
}

const Cassette: React.FC<CassetteProps> = ({ 
  tape, 
  isPlaying = false,
  onDragEnd,
  isDraggable = true,
  className = "absolute w-[416px] h-[270px]",
  onUpdate
}) => {
  // Generate unique IDs for this cassette's filters/gradients to prevent conflicts
  const safeId = tape.id.replace(/[^a-zA-Z0-9]/g, '');
  const grainId = `plastic-grain-${safeId}`;
  const gradientId = `body-gradient-${safeId}`;
  const paperId = `paper-texture-${safeId}`;
  
  // Text color to use on the label (Dark Teal/Zinc)
  const inkColor = "#0f766e"; 

  // Rotation State
  const [rotation, setRotation] = useState(tape.rotation);
  const [isRotating, setIsRotating] = useState(false);
  const rotationOffset = useRef(0);
  const cassetteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (!isRotating) setRotation(tape.rotation);
  }, [tape.rotation, isRotating]);

  // --- Rotation Logic ---
  const handleRotateDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!cassetteRef.current) return;

    setIsRotating(true);
    const element = e.currentTarget as Element;
    element.setPointerCapture(e.pointerId);

    const rect = cassetteRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    rotationOffset.current = startAngle - rotation;
  };

  const handleRotateMove = (e: React.PointerEvent) => {
    if (!isRotating || !cassetteRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = cassetteRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const newRotation = currentAngle - rotationOffset.current;
    
    setRotation(newRotation);
  };

  const handleRotateUp = (e: React.PointerEvent) => {
    if (!isRotating) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.currentTarget as Element;
    if (element.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
    }
    
    setIsRotating(false);
    
    // Sync with parent
    if (onUpdate) {
        onUpdate({ ...tape, rotation: rotation });
    }
  };

  return (
    <motion.div 
      ref={cassetteRef}
      drag={isDraggable && !isRotating}
      dragMomentum={false}
      dragElastic={0}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragEnd={onDragEnd}
      initial={isDraggable ? { x: tape.x, y: tape.y } : {}}
      whileDrag={{ scale: 1.08, zIndex: 50, cursor: 'grabbing' }}
      whileHover={isDraggable ? { scale: 1.03, zIndex: 40 } : {}}
      className={`${className} rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.4)] overflow-visible group cursor-grab`}
      style={{ x: tape.x, y: tape.y, rotate: rotation, touchAction: 'none' }} 
    >
      {/* Rotation Handle (Visible on Hover when Draggable) */}
      {isDraggable && (
        <div 
            className="absolute -top-8 -right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 hover:bg-white/25 hover:scale-110"
            onPointerDown={handleRotateDown}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateUp}
            onPointerCancel={handleRotateUp}
            style={{ touchAction: 'none' }}
            title="Rotate Tape"
        >
            <RotateCw className="w-6 h-6 text-white drop-shadow-md" />
        </div>
      )}

      {/* Inject CSS for robust rotation animation */}
      <style>{`
        @keyframes spin-reel {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .reel-spinning {
          animation: spin-reel 2s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>

      <svg viewBox="0 0 600 380" className="w-full h-full overflow-visible drop-shadow-xl select-none">
        <defs>
            <filter id={grainId} x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" result="noise"></feTurbulence>
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" in="noise" result="coloredNoise"></feColorMatrix>
                <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite"></feComposite>
                <feBlend mode="overlay" in="composite" in2="SourceGraphic"></feBlend>
            </filter>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={tape.color} stopOpacity="0.95"></stop>
                <stop offset="100%" stopColor={tape.color} stopOpacity="1"></stop>
            </linearGradient>
            <filter id={paperId}>
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"></feTurbulence>
                <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="1.2">
                    <feDistantLight azimuth="45" elevation="60"></feDistantLight>
                </feDiffuseLighting>
                <feComposite operator="in" in2="SourceGraphic"></feComposite>
                <feBlend mode="multiply" in="SourceGraphic"></feBlend>
            </filter>
        </defs>

        {/* Cassette Body Base */}
        <path d="M 20,20 H 580 A 15,15 0 0 1 595,35 V 345 A 15,15 0 0 1 580,360 H 540 L 530,370 H 70 L 60,360 H 20 A 15,15 0 0 1 5,345 V 35 A 15,15 0 0 1 20,20 Z" fill={`url(#${gradientId})`} stroke="#000" strokeOpacity="0.2" strokeWidth="1"></path>
        
        {/* Top Highlight Line */}
        <path d="M 20,22 H 580 A 12,12 0 0 1 592,34" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"></path>
        
        {/* Bottom Outline */}
        <path d="M 5,345 A 15,15 0 0 0 20,360 H 60 L 70,370 H 530 L 540,360 H 580" stroke="#000" strokeWidth="3" fill="none" opacity="0.2"></path>
        
        {/* Plastic Texture Overlay */}
        <path d="M 20,20 H 580 A 15,15 0 0 1 595,35 V 345 A 15,15 0 0 1 580,360 H 540 L 530,370 H 70 L 60,360 H 20 A 15,15 0 0 1 5,345 V 35 A 15,15 0 0 1 20,20 Z" fill={tape.color} filter={`url(#${grainId})`} opacity="0.3"></path>

        {/* Paper Label Area */}
        <g transform="translate(45, 55)">
            <rect width="510" height="200" rx="8" fill="#f0fdfa" filter={`url(#${paperId})`}></rect>
            <line x1="0" y1="40" x2="510" y2="40" stroke={inkColor} strokeWidth="2" opacity="0.4"></line>
            <line x1="0" y1="44" x2="510" y2="44" stroke={inkColor} strokeWidth="1" opacity="0.3"></line>
            
            {/* Side Indicator */}
            <text x="25" y="32" fontFamily="sans-serif" fontSize="24" fontWeight="900" fill={inkColor}>A</text>
            {/* Noise Reduction Indicator */}
            <text x="470" y="32" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill={inkColor} opacity="0.6">NR</text>
            
            {/* Dynamic Song Title */}
            <text x="60" y="32" fontFamily="'Permanent Marker', cursive" fontSize="20" fill={inkColor}>
                {tape.title.substring(0, 24)}
            </text>
        </g>

        {/* Central Window Dark Background */}
        <path d="M 130,110 H 470 L 490,240 H 110 Z" fill="#1a1a1a" opacity="0.9"></path>
        <path d="M 130,110 H 470 L 490,240 H 110 Z" fill="#fff" opacity="0.15"></path>

        {/* Left Reel */}
        <g transform="translate(185, 175)">
            {/* Reel Base Background */}
            <circle r="58" fill="#221d1d" stroke="#111" strokeWidth="1"></circle>
            
            {/* Spinning Group */}
            <g className={isPlaying ? "reel-spinning" : ""}>
                {/* Bounding box stabilizer */}
                <circle r="24" fill="none" />
                
                {/* White Hub */}
                <circle r="22" fill="#fff" stroke="#d1d5db" strokeWidth="1"></circle>
                
                {/* High Contrast Gear Teeth (Dark Grey) */}
                <path 
                    d="M -22,-4 L -15,-4 L -15,4 L -22,4 Z  
                       M 22,-4 L 15,-4 L 15,4 L 22,4 Z
                       M -4,-22 L -4,-15 L 4,-15 L 4,-22 Z
                       M -4,22 L -4,15 L 4,15 L 4,22 Z
                       M -14,-14 L -10,-10 L -7,-13 L -11,-17 Z
                       M 14,-14 L 10,-10 L 7,-13 L 11,-17 Z
                       M -14,14 L -10,10 L -7,13 L -11,17 Z
                       M 14,14 L 10,10 L 7,13 L 11,17 Z" 
                    fill="#374151"
                />
                
                {/* Center Spindle Hole */}
                <circle r="8" fill="#1a1a1a"></circle>
                
                {/* Drive Spindle Engagement Notches (White) */}
                <path d="M -2,-8 L 2,-8 L 2,-12 L -2,-12 Z" fill="#fff"></path>
                <path d="M -2,-8 L 2,-8 L 2,-12 L -2,-12 Z" fill="#fff" transform="rotate(120)"></path>
                <path d="M -2,-8 L 2,-8 L 2,-12 L -2,-12 Z" fill="#fff" transform="rotate(240)"></path>
            </g>
        </g>

        {/* Right Reel */}
        <g transform="translate(415, 175)">
            <circle r="45" fill="#221d1d" stroke="#111" strokeWidth="1"></circle>
            
            <g className={isPlaying ? "reel-spinning" : ""}>
                <circle r="24" fill="none" />
                <circle r="22" fill="#fff" stroke="#d1d5db" strokeWidth="1"></circle>
                
                {/* High Contrast Gear Teeth */}
                <path 
                    d="M -22,-4 L -15,-4 L -15,4 L -22,4 Z  
                       M 22,-4 L 15,-4 L 15,4 L 22,4 Z
                       M -4,-22 L -4,-15 L 4,-15 L 4,-22 Z
                       M -4,22 L -4,15 L 4,15 L 4,22 Z
                       M -14,-14 L -10,-10 L -7,-13 L -11,-17 Z
                       M 14,-14 L 10,-10 L 7,-13 L 11,-17 Z
                       M -14,14 L -10,10 L -7,13 L -11,17 Z
                       M 14,14 L 10,10 L 7,13 L 11,17 Z" 
                    fill="#374151"
                />
                
                <circle r="8" fill="#1a1a1a"></circle>
                
                <path d="M -2,-8 L 2,-8 L 2,-12 L -2,-12 Z" fill="#fff"></path>
                <path d="M -2,-8 L 2,-8 L 2,-12 L -2,-12 Z" fill="#fff" transform="rotate(120)"></path>
                <path d="M -2,-8 L 2,-8 L 2,-12 L -2,-12 Z" fill="#fff" transform="rotate(240)"></path>
            </g>
        </g>

        {/* Tape Bridge */}
        <path d="M 243,185 Q 300,188 370,185" fill="none" stroke="#3a2f2f" strokeWidth="45" strokeLinecap="butt"></path>
        
        {/* Window Gloss Overlay */}
        <path d="M 130,110 L 160,240 L 200,240 L 170,110 Z" fill="#fff" opacity="0.05" pointerEvents="none"></path>

        {/* Bottom Head Area */}
        <g transform="translate(0, 260)">
            <path d="M 130,0 H 470 L 460,60 H 140 Z" fill="#000" opacity="0.2"></path>
            <rect x="280" y="30" width="40" height="25" fill="#c0a060" rx="2"></rect>
            <rect x="285" y="35" width="30" height="15" fill="#5d4037" rx="1"></rect>
            <circle cx="180" cy="30" r="8" fill="#000"></circle>
            <circle cx="420" cy="30" r="8" fill="#000"></circle>
        </g>

        {/* Type Indicator */}
        <text x="520" y="330" fill={inkColor} opacity="0.7" fontFamily="monospace" fontSize="10" fontWeight="bold">TYPE I</text>
        
        {/* Dynamic Artist Signature */}
        <text x="540" y="240" textAnchor="end" fontFamily="'Permanent Marker', cursive" fontSize="10" fill={inkColor} opacity="0.7">
            {tape.artist}
        </text>
      </svg>
    </motion.div>
  );
};

export default Cassette;