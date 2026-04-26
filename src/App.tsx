import { useState } from 'react';
import MusicPlayer from './components/MusicPlayer';
import SnakeGame from './components/SnakeGame';
import { Music } from 'lucide-react';

export default function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden p-6 relative">
      {/* Global Neon Glow Overlays */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header Section */}
      <header className="flex justify-between items-end border-b border-white/10 pb-6 mb-6 z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-cyan-400 neon-glow-cyan uppercase italic">SYNTH_STRIDE</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-1">Audio-Visual Reactive Terminal</p>
        </div>
        
        <div className="flex gap-12 text-right">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Current Score</p>
            <p className="text-4xl font-mono leading-none tracking-tighter italic">
              {score.toLocaleString().padStart(5, '0')}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Hi-Score</p>
            <p className="text-4xl font-mono leading-none text-purple-400 tracking-tighter italic">5,240</p>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split View */}
      <div className="flex flex-1 gap-6 z-10 overflow-hidden">
        {/* Left Sidebar: Playlist */}
        <div className="w-64 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">Audio Queue</h2>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40">3 TRKS</span>
          </div>
          
          <div className="space-y-2 overflow-hidden">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded flex items-baseline justify-center gap-0.5 pt-2 shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                <div className="w-1 h-3 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1 h-5 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-3 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <div>
                <p className="text-xs font-bold truncate">Cyber Pulse</p>
                <p className="text-[10px] text-cyan-400/70 uppercase">AI Synth</p>
              </div>
            </div>

            <div className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg flex items-center gap-3 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-white/20 group-hover:text-white/40">
                <Music size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Neon Nocturne</p>
                <p className="text-[10px] text-white/30 uppercase">Digital Dream</p>
              </div>
            </div>

            <div className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg flex items-center gap-3 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-white/20 group-hover:text-white/40">
                <Music size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Grid Runner</p>
                <p className="text-[10px] text-white/30 uppercase">Binary Beat</p>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 bg-gradient-to-t from-purple-900/10 to-transparent rounded-xl border border-white/5">
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter">System Intel</p>
            <p className="text-[11px] text-white/50 italic mt-1 leading-relaxed">Consume active cells to maintain core synchronization.</p>
          </div>
        </div>

        {/* Center: Snake Game Window */}
        <SnakeGame onScoreChange={setScore} />

        {/* Right Sidebar: Details */}
        <div className="w-48 flex flex-col gap-6 shrink-0">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4">Visualizer</h2>
            <div className="flex items-end gap-1 h-24 p-2 bg-white/2 rounded-lg border border-white/5">
              <div className="w-full bg-cyan-500/40 h-1/2 rounded-t-sm" />
              <div className="w-full bg-cyan-400/60 h-3/4 rounded-t-sm" />
              <div className="w-full bg-cyan-300 h-full rounded-t-sm" />
              <div className="w-full bg-purple-400 h-2/3 rounded-t-sm" />
              <div className="w-full bg-purple-500/60 h-1/3 rounded-t-sm" />
              <div className="w-full bg-purple-600/40 h-1/2 rounded-t-sm" />
              <div className="w-full bg-cyan-500 h-5/6 rounded-t-sm" />
              <div className="w-full bg-white/10 h-1/4 rounded-t-sm" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[10px] text-white/40 uppercase mb-3 tracking-widest">Interface</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center bg-black/40 p-2 rounded border border-white/5">
                  <span className="text-xs font-mono mb-1">ARROWS</span>
                  <span className="text-[8px] text-white/30 uppercase">NAV</span>
                </div>
                <div className="flex flex-col items-center bg-black/40 p-2 rounded border border-white/5">
                  <span className="text-xs font-mono mb-1">SPACE</span>
                  <span className="text-[8px] text-white/30 uppercase">BREAK</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] text-white/20 uppercase tracking-widest">
                  <span>Status</span>
                  <span className="text-green-500/60 animate-pulse">Online</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/20 w-3/4" />
              </div>
          </div>
        </div>
      </div>

      {/* Bottom Player Controls */}
      <MusicPlayer />
    </div>
  );
}
