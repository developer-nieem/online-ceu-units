'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mediaUrl } from '@/lib/media-url';

export function LessonVideoPlayer({
  src,
  poster,
  title,
  captionsNote,
  onEnded,
  onVideoPlayingChange,
}: {
  src: string;
  poster?: string | null;
  title?: string;
  captionsNote?: string;
  onEnded?: () => void;
  onVideoPlayingChange?: (playing: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxWatchedRef = useRef(0);
  const reportedPlayingRef = useRef(false);
  const onVideoPlayingChangeRef = useRef(onVideoPlayingChange);
  onVideoPlayingChangeRef.current = onVideoPlayingChange;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const reportPlaying = useCallback((next: boolean) => {
    if (reportedPlayingRef.current === next) return;
    reportedPlayingRef.current = next;
    onVideoPlayingChangeRef.current?.(next);
  }, []);

  const clampPlayback = useCallback(() => {
    const node = videoRef.current;
    if (!node) return;
    if (node.currentTime > maxWatchedRef.current + 0.25) {
      node.currentTime = maxWatchedRef.current;
    }
  }, []);

  useEffect(() => {
    maxWatchedRef.current = 0;
    setPlaying(false);
    reportPlaying(false);
    return () => reportPlaying(false);
  }, [src, reportPlaying]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !onEnded) return;

    function handleEnded() {
      onEnded?.();
    }

    node.addEventListener('ended', handleEnded);
    return () => node.removeEventListener('ended', handleEnded);
  }, [onEnded, src]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    function handleTimeUpdate() {
      const el = videoRef.current;
      if (!el) return;
      if (!el.paused && !el.seeking) {
        maxWatchedRef.current = Math.max(maxWatchedRef.current, el.currentTime);
      }
      clampPlayback();
    }

    function handleSeeking() {
      clampPlayback();
    }

    node.addEventListener('timeupdate', handleTimeUpdate);
    node.addEventListener('seeking', handleSeeking);
    return () => {
      node.removeEventListener('timeupdate', handleTimeUpdate);
      node.removeEventListener('seeking', handleSeeking);
    };
  }, [clampPlayback, src]);

  function togglePlay() {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const node = videoRef.current;
    if (!node) return;
    node.muted = !node.muted;
    setMuted(node.muted);
  }

  function handleVolumeChange(next: number) {
    const node = videoRef.current;
    if (!node) return;
    const clamped = Math.min(1, Math.max(0, next));
    node.volume = clamped;
    node.muted = clamped === 0;
    setVolume(clamped);
    setMuted(clamped === 0);
  }

  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black"
          playsInline
          preload="metadata"
          poster={poster ? mediaUrl(poster) : undefined}
          aria-label={title ?? 'Lesson video'}
          disablePictureInPicture
          controlsList="nodownload noremoteplayback"
          onContextMenu={(event) => event.preventDefault()}
          onPlay={() => {
            setPlaying(true);
            reportPlaying(true);
          }}
          onPause={() => {
            setPlaying(false);
            reportPlaying(false);
          }}
          onEnded={() => {
            setPlaying(false);
            reportPlaying(false);
          }}
        >
          <source src={mediaUrl(src)} type="video/mp4" />
          Your browser does not support embedded video playback.
        </video>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-slate-950 px-3 py-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 bg-white/10 text-white hover:bg-white/20"
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/10 text-white hover:bg-white/20"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" aria-hidden />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-teal-500"
            aria-label="Volume"
          />
        </div>
      </div>
      {title ? <figcaption className="text-sm font-medium">{title}</figcaption> : null}
      {captionsNote ? (
        <p className="text-xs text-muted-foreground">{captionsNote}</p>
      ) : null}
    </figure>
  );
}
