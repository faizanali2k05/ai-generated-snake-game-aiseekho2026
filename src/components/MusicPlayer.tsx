import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';

const DUMMY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Cyber Pulse',
    artist: 'AI Synth',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/cyber/400/400'
  },
  {
    id: '2',
    title: 'Neon Nocturne',
    artist: 'Digital Dream',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/nocturne/400/400'
  },
  {
    id: '3',
    title: 'Grid Runner',
    artist: 'Binary Beat',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/grid/400/400'
  }
];

export default function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentTrack = DUMMY_TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100 || 0);
    }
  };

  const handleEnded = () => {
    handleNext();
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % DUMMY_TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + DUMMY_TRACKS.length) % DUMMY_TRACKS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (percent: number) => {
    const duration = audioRef.current?.duration || 235; // default to 3:55
    const seconds = Math.floor((percent / 100) * duration);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-24 mt-auto bg-[#111] border-t border-white/10 flex items-center px-8 gap-12 z-10 w-full relative">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-64 shrink-0">
        <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-purple-900/40" />
           <img 
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
           />
        </div>
        <div>
          <h3 className="text-sm font-bold truncate w-40">{currentTrack.title}</h3>
          <p className="text-[10px] text-cyan-400 tracking-wider uppercase">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Main Controls & Progress */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-8">
          <button 
            onClick={handlePrev}
            className="text-white/40 hover:text-white transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          
          <button 
            onClick={handleNext}
            className="text-white/40 hover:text-white transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>
        
        <div className="w-full max-w-md flex items-center gap-3">
          <span className="text-[10px] text-white/30 font-mono">{formatTime(progress)}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            />
          </div>
          <span className="text-[10px] text-white/30 font-mono">03:55</span>
        </div>
      </div>

      {/* Volume / Extra Settings */}
      <div className="w-64 flex items-center justify-end gap-4 shrink-0">
        <Volume2 className="text-white/40" size={16} />
        <div className="w-24 h-1 bg-white/10 rounded-full">
          <div className="w-3/4 h-full bg-white/60 rounded-full"></div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </footer>
  );
}
