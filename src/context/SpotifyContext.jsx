import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for Spotify player state
const SpotifyContext = createContext();

export const SpotifyProvider = ({ children }) => {
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize Spotify iframe API once
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      IFrameAPI.createController(
        document.getElementById('spotify-embed'),
        { uri: 'spotify:album:5mfI5AkO87KIPhddNvhBnO', width: '100%', height: '352', theme: '0' },
        (controller) => {
          controller.addListener('playback_update', (e) => {
            setIsPlaying(!e.data.isPaused && !e.data.isBuffering);
          });
        }
      );
    };
  }, []);

  const toggleSpotifyOpen = () => {
    setIsSpotifyOpen((prev) => !prev);
  };

  return (
    <SpotifyContext.Provider value={{ isSpotifyOpen, toggleSpotifyOpen, isPlaying }}>
      {children}
    </SpotifyContext.Provider>
  );
};

// custom hook for consuming context
export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
