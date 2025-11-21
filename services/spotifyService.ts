import { Tape, TAPE_COLORS } from "../types";

// NOTE: You must add this ID to your environment variables or replace it here.
// You must also add your app's URL (e.g. http://localhost:5173) to the Redirect URIs in Spotify Dashboard.
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''; 

const REDIRECT_URI = window.location.origin; 
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = ["user-read-private", "user-read-email"];

const STORAGE_KEY = 'retro_tape_spotify_token';
const EXPIRY_KEY = 'retro_tape_spotify_expiry';

export const isSpotifyConfigured = (): boolean => {
    return !!CLIENT_ID && CLIENT_ID !== 'YOUR_SPOTIFY_CLIENT_ID_HERE';
};

export const loginToSpotify = () => {
  if (!isSpotifyConfigured()) {
    alert("Please configure your SPOTIFY_CLIENT_ID in the environment variables or services/spotifyService.ts");
    return;
  }
  window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join("%20")}&show_dialog=true`;
};

export const getTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (hash) {
    const token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token"));
    if (token) {
        const accessToken = token.split("=")[1];
        // Store it with expiry (1 hour approx)
        const now = new Date().getTime();
        localStorage.setItem(STORAGE_KEY, accessToken);
        localStorage.setItem(EXPIRY_KEY, (now + 3600 * 1000).toString());
        return accessToken;
    }
  }
  return null;
};

export const getStoredToken = (): string | null => {
    const token = localStorage.getItem(STORAGE_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (token && expiry) {
        if (new Date().getTime() > parseInt(expiry)) {
            logoutSpotify();
            return null;
        }
        return token;
    }
    return null;
}

export const logoutSpotify = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
}

export const searchSpotifyArtistAndTracks = async (token: string, artistName: string): Promise<Tape[]> => {
  try {
    // 1. Search for Artist ID to get the exact artist the user wants
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (searchResponse.status === 401) {
        // Token expired
        logoutSpotify();
        window.location.reload();
        throw new Error("Token expired");
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.artists || searchData.artists.items.length === 0) {
        return [];
    }

    const artistId = searchData.artists.items[0].id;
    const realArtistName = searchData.artists.items[0].name;

    // 2. Get Artist's Top Tracks
    // Note: Spotify requires a 'market' parameter for top tracks. 'US' is a safe default.
    const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const tracksData = await tracksResponse.json();

    const shuffledColors = [...TAPE_COLORS].sort(() => 0.5 - Math.random());

    // 3. Map to Tape format
    // NOTE: Spotify has deprecated preview_urls for many tracks. We filter for valid ones.
    const tapes: Tape[] = tracksData.tracks
        .filter((t: any) => t.preview_url) 
        .slice(0, 10) // Limit to Top 10
        .map((track: any, index: number) => {
            const color = shuffledColors[index % shuffledColors.length];
            
            return {
                id: `spotify-${track.id}`,
                artist: realArtistName,
                title: track.name,
                previewUrl: track.preview_url,
                duration: 30, // Spotify previews are 30s
                color: color,
                rotation: 0, // Will be set by app
                x: 0, // Will be set by app
                y: 0, // Will be set by app
                date: "Spotify Top 10"
            };
        });

    return tapes;

  } catch (e) {
    console.error("Spotify Error", e);
    throw e;
  }
};