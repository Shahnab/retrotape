import { Tape, TAPE_COLORS } from "../types";

interface ITunesResult {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl: string;
  trackTimeMillis: number;
}

export const fetchSongsByArtist = async (artist: string): Promise<Tape[]> => {
  // Using iTunes Search API
  const term = encodeURIComponent(artist);
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Create a shuffled copy of colors to ensure uniqueness in this batch
    const shuffledColors = [...TAPE_COLORS].sort(() => 0.5 - Math.random());

    // Map results to Tape objects
    return data.results.map((track: ITunesResult, index: number) => {
      // Pick a unique color for each of the 5 tapes
      const color = shuffledColors[index % shuffledColors.length];
      
      const randomRotation = Math.floor(Math.random() * 40) - 20; // -20 to 20 deg
      
      // Random scatter position
      const randomX = Math.random() * 300 + 50; // Offset from left
      const randomY = Math.random() * 300 + 50; // Offset from top

      return {
        id: track.trackId.toString(),
        artist: track.artistName,
        title: track.trackName,
        previewUrl: track.previewUrl,
        duration: track.trackTimeMillis / 1000,
        color: color,
        rotation: randomRotation,
        x: randomX,
        y: randomY
      };
    });
  } catch (error) {
    console.error("Failed to fetch songs:", error);
    throw new Error("Could not load songs.");
  }
};