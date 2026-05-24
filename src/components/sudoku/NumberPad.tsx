'use client';

import React, { useMemo } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { countNumbers } from '@/lib/sudoku-engine';
import { Button } from '@/components/ui/button';
import { Pencil, Eraser, Lightbulb, Undo2 } from 'lucide-react';

const NumberPad: React.FC = () => {
  const enterNumber = useSudokuStore((s) => s.enterNumber);
  const eraseCell = useSudokuStore((s) => s.eraseCell);
  const toggleNotesMode = useSudokuStore((s) => s.toggleNotesMode);
  const notesMode = useSudokuStore((s) => s.notesMode);
  const useHint = useSudokuStore((s) => s.useHint);
  const undo = useSudokuStore((s) => s.undo);
  const undoStack = useSudokuStore((s) => s.undoStack);
  const board = useSudokuStore((s) => s.board);
  const isComplete = useSudokuStore((s) => s.isComplete);
  const isGameOver = useSudokuStore((s) => s.isGameOver);
  const isPaused = useSudokuStore((s) => s.isPaused);
  const selectedCell = useSudokuStore((s) => s.selectedCell);
  const playerProgress = useSudokuStore((s) => s.playerProgress);

  const hintsRemaining = playerProgress.hints;

  const numberCounts = useMemo(() => {
    if (!board || board.length === 0) return {} as Record<number, number>;
    return countNumbers(board);
  }, [board]);

  const isDisabled = isComplete || isPaused || isGameOver;
  const isHintDisabled = isDisabled || hintsRemaining <= 0;

  return (
    <div className="animate-slide-up flex flex-col gap-1.5 sm:gap-3 w-full max-w-[500px] mx-auto">
      {/* Number buttons - enhanced 3D with deeper shadows */}
      <div className="grid grid-cols-9 gap-0.5 sm:gap-1.5 md:gap-2">
        {Array.from({ length: 9 }, (_, i) => {
          const num = i + 1;
          const count = numberCounts[num] ?? 0;
          const numComplete = count >= 9;

          return (
            <button
              key={num}
              onClick={() => enterNumber(num)}
              disabled={isDisabled || numComplete}
              className={`
                num-pad-btn btn-3d-num relative flex flex-col items-center justify-center
                h-9 sm:h-14 md:h-16 rounded-lg sm:rounded-xl
                transition-all duration-200
                ${numComplete
                  ? 'bg-white/5 text-muted-foreground/20 cursor-not-allowed line-through'
                  : isDisabled
                    ? 'bg-white/5 text-muted-foreground/50 cursor-not-allowed'
                    : 'glass-card bg-gradient-to-b from-white/15 to-white/5 hover:bg-gradient-to-b hover:from-cyan-500/25 hover:to-cyan-600/15 hover:ring-2 hover:ring-cyan-400/40 hover:scale-110 hover:shadow-[0_0_20px_rgba(34,211,238,0.3),0_8px_24px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_0_4px_rgba(34,211,238,0.2)] active:scale-100 cursor-pointer text-foreground'
                }
              `}
            >
              <span className={`text-base sm:text-2xl md:text-3xl font-extrabold leading-none tabular-nums ${numComplete ? 'line-through opacity-40' : ''}`}>
                {num}
              </span>
              <span className={`text-[7px] sm:text-[10px] md:text-[11px] mt-0 font-medium ${numComplete ? 'text-transparent' : 'text-muted-foreground/50'}`}>
                {9 - count}
              </span>
              {/* Subtle bottom shine line */}
              {!numComplete && !isDisabled && (
                <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Separator line - enhanced gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-[2px] w-8 h-[5px] rounded-full bg-cyan-400/30 blur-[2px]" />
      </div>

      {/* Control buttons - enhanced 3D */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={isDisabled || undoStack.length === 0}
          className="num-pad-btn btn-3d glass-card h-9 sm:h-13 md:h-14 rounded-lg sm:rounded-xl hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-sm transition-all flex flex-col gap-0 sm:gap-0.5 items-center"
        >
          <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs text-muted-foreground">Undo</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={eraseCell}
          disabled={isDisabled || !selectedCell}
          className="num-pad-btn btn-3d glass-card h-9 sm:h-13 md:h-14 rounded-lg sm:rounded-xl hover:bg-red-500/10 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(239,68,68,0.15)] active:translate-y-[2px] active:shadow-sm transition-all flex flex-col gap-0 sm:gap-0.5 items-center"
        >
          <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs text-muted-foreground">Erase</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNotesMode}
          disabled={isDisabled}
          className={`num-pad-btn btn-3d glass-card h-9 sm:h-13 md:h-14 rounded-lg sm:rounded-xl hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-sm transition-all flex flex-col gap-0 sm:gap-0.5 items-center ${
            notesMode
              ? 'bg-cyan-500/20 ring-2 ring-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.3),0_4px_12px_rgba(34,211,238,0.15)]'
              : 'hover:bg-white/10'
          }`}
        >
          <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs text-muted-foreground">{notesMode ? 'Notes ON' : 'Notes'}</span>
        </Button>

        {/* Hint button - with prominent count and clear disabled state */}
        <Button
          variant="ghost"
          size="sm"
          onClick={useHint}
          disabled={isHintDisabled}
          className={`num-pad-btn btn-3d glass-card h-9 sm:h-13 md:h-14 rounded-lg sm:rounded-xl transition-all flex flex-col gap-0 sm:gap-0.5 items-center relative ${
            hintsRemaining <= 0
              ? 'opacity-35 cursor-not-allowed grayscale saturate-0 hover:opacity-35 hover:translate-y-0'
              : 'hover:bg-purple-500/15 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(168,85,247,0.2)] active:translate-y-[2px] active:shadow-sm'
          }`}
        >
          <div className="relative">
            <Lightbulb className={`w-4 h-4 sm:w-5 sm:h-5 ${hintsRemaining > 0 ? 'text-purple-400' : 'text-muted-foreground/40'}`} />
            {/* Badge with count on the icon */}
            <span className={`absolute -top-1.5 -right-2 min-w-[13px] h-[13px] flex items-center justify-center rounded-full text-[7px] font-extrabold leading-none px-0.5 ${
              hintsRemaining > 0
                ? 'bg-purple-500 text-white shadow-[0_0_4px_rgba(168,85,247,0.6)]'
                : 'bg-white/15 text-muted-foreground/40'
            }`}>
              {hintsRemaining}
            </span>
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold ${
            hintsRemaining > 0 ? 'text-purple-400' : 'text-muted-foreground/30'
          }`}>
            {hintsRemaining > 0 ? `Hint` : 'No Hints'}
          </span>
          {/* Pulse indicator when hints are available */}
          {hintsRemaining > 0 && !isDisabled && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)] animate-pulse" />
          )}
          {/* Zero-hint overlay X */}
          {hintsRemaining <= 0 && !isDisabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-full h-[2px] bg-red-400/30 rotate-45 rounded-full" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NumberPad;
