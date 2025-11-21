
export interface AIAnalysis {
  title: string;
  summary: string;
  mood: string[];
  colorHex: string;
}

export interface Tape {
  id: string;
  artist: string;
  title: string;
  previewUrl: string; // URL to the audio file
  duration: number; // in seconds (usually 30s for previews)
  
  // Visual properties
  color: string; 
  rotation: number;
  x: number; // Canvas position X
  y: number; // Canvas position Y

  // Optional metadata
  analysis?: AIAnalysis;
  date?: string;
}

export enum PlayerState {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export const TAPE_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#64748b', // Slate
  '#a1a1aa', // Zinc
];
