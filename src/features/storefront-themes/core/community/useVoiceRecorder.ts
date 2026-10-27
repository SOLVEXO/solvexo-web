import { useEffect, useRef, useState } from 'react';

/** Headless voice-note recorder (microphone -> File). Themes only draw the buttons. */
export function useVoiceRecorder(onReady: (file: File) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const start = async () => {
    if (recording || typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        stream.getTracks().forEach(track => track.stop());
        onReadyRef.current(new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType }));
      };
      mr.start(100);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      // microphone permission denied or no microphone: nothing to record
    }
  };

  const stop = () => {
    clearTimer();
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
    setSeconds(0);
  };

  const cancel = () => {
    clearTimer();
    const mr = mrRef.current;
    if (mr) {
      mr.ondataavailable = null;
      const tracks = (mr as MediaRecorder & { stream?: MediaStream }).stream?.getTracks() ?? [];
      mr.onstop = () => tracks.forEach(track => track.stop());
      mr.stop();
      mrRef.current = null;
    }
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  };

  useEffect(() => () => { clearTimer(); mrRef.current?.stream.getTracks().forEach(track => track.stop()); }, []);

  const formattedTime = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return { recording, seconds, formattedTime, start, stop, cancel };
}
