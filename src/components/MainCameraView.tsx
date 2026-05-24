import { useRef, useEffect } from 'react';

interface MainCameraViewProps {
  streamUrl?: string;
}

export default function MainCameraView({ streamUrl }: MainCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // For HLS streams (common with Raspberry Pi + camera)
    if (streamUrl.endsWith('.m3u8') && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else {
      video.src = streamUrl;
    }

    video.play().catch(() => {
      // Autoplay may be blocked; component still shows the placeholder
    });
  }, [streamUrl]);

  return (
    <div className="relative flex-1 mx-6 mb-6 rounded-xl overflow-hidden border border-slate-700/40 bg-slate-900">
      {/* Placeholder background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />

      {/* Grid overlay for tech feel */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyber-cyan/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyber-cyan/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyber-cyan/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyber-cyan/30 rounded-br-lg" />

      {/* Video element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />

      {/* Center placeholder when no stream */}
      {!streamUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-cyber-cyan/10 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-cyber-cyan/25"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-mono tracking-wider">
            CAMERA FEED
          </p>
          <p className="text-slate-600 text-xs mt-1 font-mono">
            {streamUrl ? 'Connecting...' : 'No signal'}
          </p>
        </div>
      )}

      {/* Bottom info bar overlay */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-400 font-mono border border-slate-700/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
          REC
        </span>
        <span className="text-xs text-slate-600 font-mono">
          {streamUrl || 'Stream URL not configured'}
        </span>
      </div>
    </div>
  );
}

// Expose ref type for parent access
export type { MainCameraViewProps };
