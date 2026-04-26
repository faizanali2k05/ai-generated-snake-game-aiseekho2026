import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Position, Direction } from '../types';
import { Trophy, RefreshCw, Play } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 80;

interface SnakeGameProps {
  onScoreChange?: (score: number) => void;
}

export default function SnakeGame({ onScoreChange }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    onScoreChange?.(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Border Collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food Collision
      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange?.(newScore);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generateFood, score, onScoreChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': // Space to pause
            if (!isGameOver) setIsPaused(p => !p);
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver]);

  useEffect(() => {
    if (!isPaused && !isGameOver) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, isPaused, isGameOver]);

  return (
    <div id="snake-game-wrapper" className="flex-1 flex flex-col bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl shadow-cyan-500/5">
      {/* Viewport Header */}
      <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
        <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Viewport: 0x400_AFFECTOR</span>
      </div>

      <div className="flex-1 p-8 flex items-center justify-center relative">
        <div 
          className="grid gap-1 bg-black overflow-hidden relative"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: '100%',
            aspectRatio: '1/1',
            maxWidth: '500px'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            
            const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
            const isSnake = snakeIndex !== -1;
            const isHead = snakeIndex === 0;
            const isFood = food.x === x && food.y === y;

            // Trail opacity calculation
            const opacity = isSnake ? Math.max(0.1, 1 - (snakeIndex / snake.length)) : 1;

            return (
              <div 
                key={i} 
                className={`aspect-square transition-all duration-75 ${
                  isHead 
                    ? 'bg-cyan-400 rounded-sm shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10' 
                    : isSnake 
                    ? 'bg-cyan-500 rounded-sm' 
                    : isFood 
                    ? 'bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,1)] animate-pulse'
                    : 'bg-white/[0.02] border-[0.5px] border-white/5'
                }`}
                style={{
                  opacity: isSnake && !isHead ? opacity : 1
                }}
              />
            );
          })}
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {(isGameOver || isPaused) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <h2 className={`text-4xl font-black mb-6 uppercase italic tracking-tighter ${isGameOver ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'text-white'}`}>
                {isGameOver ? 'Session Terminated' : 'System Paused'}
              </h2>
              
              <button
                onClick={isGameOver ? resetGame : () => setIsPaused(false)}
                className="group flex flex-col items-center gap-2 p-4 transition-transform hover:scale-110 bg-white/5 rounded-full w-24 h-24 justify-center border border-cyan-400/30"
              >
                {isGameOver ? (
                  <RefreshCw size={32} className="text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Play size={32} className="text-cyan-400 ml-1" />
                )}
              </button>
              
              <p className="mt-8 text-white/40 text-[10px] font-mono uppercase tracking-[0.3em]">
                {isGameOver ? 'Initialize New Session' : 'Press Space to Resume'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay Stats */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] text-cyan-400 font-mono">
          SPEED: <span className="text-white">{(150/GAME_SPEED).toFixed(2)}x</span>
        </div>
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] text-purple-400 font-mono">
          LENGTH: <span className="text-white">{snake.length} UNITS</span>
        </div>
      </div>
    </div>
  );
}
