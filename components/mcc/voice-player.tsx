"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Square } from "lucide-react";

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`key-${i}-${`item-${i}`}`}
          className={`w-[3px] rounded-full transition-all ${
            active ? "bg-violet-400" : "bg-zinc-700"
          }`}
          style={{
            height: active ? `${8 + Math.sin(Date.now() / 200 + i * 1.2) * 6}px` : "4px",
            animation: active ? `waveform-bar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

export function VoicePlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number>(0);
  const [, setTick] = useState(0);

  const animate = useCallback(() => {
    if (playing) {
      setTick((t) => t + 1);
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, [playing]);

  useEffect(() => {
    if (playing) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing, animate]);

  const play = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "de-DE";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utteranceRef.current = utter;
    setPlaying(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <button
      onClick={play}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
        playing
          ? "bg-violet-500/15 text-violet-400 border border-violet-500/30"
          : "bg-zinc-800/40 text-zinc-500 border border-zinc-800/60 hover:text-zinc-300 hover:border-zinc-700"
      }`}
    >
      {playing ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      <WaveformBars active={playing} />
    </button>
  );
}