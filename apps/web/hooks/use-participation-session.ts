'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  devFastForwardParticipation,
  sendParticipationHeartbeat,
  type ParticipationComplianceStatus,
  type ParticipationHeartbeatPayload,
} from '@/lib/participation';

const HEARTBEAT_INTERVAL_MS = 30_000;
/** Visible pause after 6 minutes with no interaction. Credit stops on the server at the last interaction. */
const IDLE_MS = 360_000;

function createSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useParticipationSession(params: {
  courseSlug: string;
  lessonId?: string;
  lessonSlug?: string;
  initialStatus?: ParticipationComplianceStatus;
  enabled?: boolean;
  scrollRootRef?: React.RefObject<HTMLElement | null>;
}) {
  const { courseSlug, lessonId, lessonSlug, initialStatus, enabled = true, scrollRootRef } =
    params;

  const [status, setStatus] = useState<ParticipationComplianceStatus | null>(
    initialStatus ?? null,
  );
  const [isPaused, setIsPaused] = useState(false);
  const [lastHeartbeatVisibility, setLastHeartbeatVisibility] = useState({
    tabVisible: true,
    documentFocused: true,
  });

  const sessionIdRef = useRef(createSessionId());
  const sequenceRef = useRef(0);
  const interactionDeltaRef = useRef(0);
  const idleRef = useRef(false);
  const tabVisibleRef = useRef(true);
  const focusedRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const lastScrollBumpRef = useRef(0);
  const videoPlayingRef = useRef(false);
  const audioPlayingRef = useRef(false);

  const isVideoPlaying = useCallback(() => videoPlayingRef.current, []);
  const isAudioPlaying = useCallback(() => audioPlayingRef.current, []);

  const bumpInteraction = useCallback(() => {
    interactionDeltaRef.current += 1;
    lastActivityRef.current = Date.now();
    idleRef.current = false;
  }, []);

  const getScrollDepth = useCallback(() => {
    const el = scrollRootRef?.current ?? document.documentElement;
    const scrollTop = el.scrollTop ?? window.scrollY;
    const scrollHeight = (el.scrollHeight ?? document.documentElement.scrollHeight) - el.clientHeight;
    if (scrollHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
  }, [scrollRootRef]);

  const sendHeartbeat = useCallback(async () => {
    if (!enabled) return;

    const videoPlaying = isVideoPlaying();
    const audioPlaying = isAudioPlaying();
    const payload: ParticipationHeartbeatPayload = {
      sessionId: sessionIdRef.current,
      clientSequence: ++sequenceRef.current,
      clientTimestamp: new Date().toISOString(),
      lessonId,
      lessonSlug,
      tabVisible: tabVisibleRef.current,
      documentFocused: focusedRef.current,
      idle: videoPlaying || audioPlaying ? false : idleRef.current,
      interactionDelta: Math.min(interactionDeltaRef.current, 1000),
      scrollDepthPct: getScrollDepth(),
      videoPlaying,
      audioPlaying,
    };

    interactionDeltaRef.current = 0;

    const res = await sendParticipationHeartbeat(courseSlug, payload);
    if (res.data) {
      setStatus(res.data.compliance);
      setIsPaused(res.data.isPaused);
      setLastHeartbeatVisibility({
        tabVisible: payload.tabVisible,
        documentFocused: payload.documentFocused,
      });
    }
  }, [courseSlug, enabled, getScrollDepth, isAudioPlaying, isVideoPlaying, lessonId, lessonSlug]);

  const setVideoPlaying = useCallback(
    (playing: boolean) => {
      if (videoPlayingRef.current === playing) return;
      videoPlayingRef.current = playing;
      if (playing) {
        idleRef.current = false;
        lastActivityRef.current = Date.now();
      }
      void sendHeartbeat();
    },
    [sendHeartbeat],
  );

  const setAudioPlaying = useCallback(
    (playing: boolean) => {
      if (audioPlayingRef.current === playing) return;
      audioPlayingRef.current = playing;
      if (playing) {
        idleRef.current = false;
        lastActivityRef.current = Date.now();
      }
      void sendHeartbeat();
    },
    [sendHeartbeat],
  );

  useEffect(() => {
    videoPlayingRef.current = false;
    audioPlayingRef.current = false;
  }, [lessonId, lessonSlug]);

  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => bumpInteraction();

    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollBumpRef.current < 1000) return;
      lastScrollBumpRef.current = now;
      bumpInteraction();
    };

    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    for (const ev of events) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    const onVisibility = () => {
      tabVisibleRef.current = document.visibilityState === 'visible';
      if (tabVisibleRef.current) bumpInteraction();
      void sendHeartbeat();
    };

    const onFocus = () => {
      focusedRef.current = true;
      bumpInteraction();
    };

    const onBlur = () => {
      focusedRef.current = false;
      void sendHeartbeat();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    const idleTimer = window.setInterval(() => {
      idleRef.current =
        !isVideoPlaying() &&
        !isAudioPlaying() &&
        Date.now() - lastActivityRef.current > IDLE_MS;
    }, 5000);

    const heartbeatTimer = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    void sendHeartbeat();

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, onActivity);
      }
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.clearInterval(idleTimer);
      window.clearInterval(heartbeatTimer);
    };
  }, [bumpInteraction, enabled, isAudioPlaying, isVideoPlaying, sendHeartbeat]);

  const devFastForward = useCallback(async () => {
    if (process.env.NODE_ENV !== 'development') return false;

    const res = await devFastForwardParticipation(courseSlug);
    if (res.data) {
      setStatus(res.data);
      setIsPaused(res.data.isPaused);
      return true;
    }
    return false;
  }, [courseSlug]);

  return {
    status,
    isPaused,
    tabVisible: lastHeartbeatVisibility.tabVisible,
    documentFocused: lastHeartbeatVisibility.documentFocused,
    bumpInteraction,
    setVideoPlaying,
    setAudioPlaying,
    refresh: sendHeartbeat,
    devFastForward,
  };
}
