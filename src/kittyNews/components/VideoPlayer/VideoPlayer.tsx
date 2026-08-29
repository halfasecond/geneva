import * as React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoJS: React.FC<{ options: any }> = ({ options }) => {
  const videoRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<any | null>(null);

  React.useEffect(() => {
    const videoElement = document.createElement('video-js');
    videoElement.className = 'video-js vjs-default-skin';
    videoRef.current?.appendChild(videoElement);

    if (!playerRef.current) {
      playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');
      });
    } else {
      playerRef.current.autoplay(options.autoplay ?? false);
      playerRef.current.src(options.sources ?? []);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options]);

  return (
    <div data-vjs-player className="has-video">
      <div ref={videoRef} />
    </div>
  );
}

export default VideoJS;
