// src/components/SpotifyPlayer.jsx
import React, { useEffect, useState } from 'react';

export default function SpotifyPlayer({ onPlayStatusChange }) {
  const [controller, setController] = useState(null);

  useEffect(() => {
    let embedController = null;

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      IFrameAPI.createController(
        document.getElementById('spotify-embed'),
        {
          uri: 'spotify:album:5mfI5AkO87KIPhddNvhBnO',
          width: '100%',
          height: '80',        // whatever size you need
          theme: '0',
        },
        (ctrl) => {
          embedController = ctrl;
          setController(ctrl);

          ctrl.addListener('playback_update', (e) => {
            const isPlaying = !e.data.isPaused && !e.data.isBuffering;
            onPlayStatusChange(isPlaying);
          });
        }
      );
    };

    return () => embedController?.destroy();
  }, [onPlayStatusChange]);

  return (
    <div
      id="spotify-embed"
      style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 999 }}
    />
  );
}
