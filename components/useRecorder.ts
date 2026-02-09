'use client';

import { useRef, useCallback, type RefObject } from 'react';

const EXPORT_W = 3840;
const EXPORT_H = 2160;

interface UseRecorderReturn {
  startRecording: () => void;
  stopRecording: () => Promise<void>;
}

export function useRecorder(svgRef: RefObject<SVGSVGElement | null>): UseRecorderReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const startRecording = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    canvasRef.current = canvas;
    chunksRef.current = [];

    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 24000000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();
    recorderRef.current = recorder;
    recordingRef.current = true;

    const drawFrame = () => {
      if (!recordingRef.current) return;
      const svg = svgRef.current;
      if (!svg) {
        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgStr], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return;
        }
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
        ctx.drawImage(img, 0, 0, EXPORT_W, EXPORT_H);
        URL.revokeObjectURL(url);
        if (recordingRef.current) {
          rafRef.current = requestAnimationFrame(drawFrame);
        }
      };
      
      img.src = url;
    };

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [svgRef]);

  const stopRecording = useCallback(() => {
    recordingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'graphic-4k.webm';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      };
      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording };
}
