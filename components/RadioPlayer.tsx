"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Mic2 } from "lucide-react";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "#1f2937",
  color: "#fff",
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Example Stream URL - Replace with actual Shoutcast/Icecast URL
  const STREAM_URL = "https://radio.lanuevazimatlan1067fm.com.mx/stream/1/ ";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.error("Playback error:", e);
          Toast.fire({
            icon: "error",
            title: "No se pudo iniciar la radio. Verifique su conexión.",
          });
        });
      }
    }
  };

  const handleCreate = () => {
    // Logic managed by audio events
  };

  const onPlaying = () => {
    setIsPlaying(true);
    Toast.fire({
      icon: "success",
      title: "¡Conectado! Disfruta La Nueva 📻",
    });
  };

  const onPause = () => {
    setIsPlaying(false);
    Toast.fire({
      icon: "info",
      title: "Radio pausada",
    });
  };

  const onError = (e: Event) => {
    setIsPlaying(false);
    console.error("Audio error:", e);
    Toast.fire({
      icon: "error",
      title: "Se perdió la señal. Intentando reconectar...",
    });
  };

  const onWaiting = () => {
    // Optional: Don't spam if it's just a short buffer
    // Toast.fire({ icon: "warning", title: "Cargando..." });
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zim-blue/95 backdrop-blur-md text-white border-t border-white/10 shadow-2xl z-50 flex flex-col">
      {/* Audio Element with Event Listeners */}
      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="none"
        onPlaying={onPlaying}
        onPause={onPause}
        onWaiting={onWaiting}
      />

      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Helper/Now Playing Info */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 overflow-hidden">
          <div className="w-12 h-12 bg-zim-orange rounded-lg flex items-center justify-center shrink-0 animate-pulse">
            <Mic2 className="text-white" size={24} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs text-zim-green font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              En Vivo
            </span>
            <span className="font-display font-bold text-sm md:text-base truncate">
              La Nueva Zimatlán
            </span>
            <span className="text-xs text-white/70 truncate">
              106.7 FM - Siempre Contigo
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          {/* Main Play Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 md:w-14 md:h-14 bg-zim-green rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 hover:bg-lime-500 transition-all hover:shadow-zim-green/50"
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>

          {/* Volume Control (Hidden on small mobile) */}
          <div className="hidden md:flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-zim-green hover:accent-lime-400"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/20 text-[10px] text-white/50 text-center py-1 w-full border-t border-white/5">
        &copy; {new Date().getFullYear()} La Nueva. Creado con ❤️ por{" "}
        <span className="text-zim-orange font-medium hover:text-white transition-colors cursor-pointer">
          Totonix Soluciones Tecnológicas
        </span>
      </div>
    </div>
  );
}
