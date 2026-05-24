'use client';

import React, { useCallback, useState } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';

const SudokuGrid: React.FC = () => {
  const board = useSudokuStore((s) => s.board);
  const selectedCell = useSudokuStore((s) => s.selectedCell);
  const selectCell = useSudokuStore((s) => s.selectCell);
  const settings = useSudokuStore((s) => s.settings);
  const selectedNumber = useSudokuStore((s) => s.selectedNumber);
  const isPaused = useSudokuStore((s) => s.isPaused);
  const isComplete = useSudokuStore((s) => s.isComplete);
  const isGameOver = useSudokuStore((s) => s.isGameOver);

  // Ripple state
  const [ripple, setRipple] = useState<{ row: number; col: number; id: number } | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    selectCell(row, col);
    setRipple({ row, col, id: Date.now() });
    setTimeout(() => setRipple(null), 500);
  }, [selectCell]);

  if (!board || board.length === 0) {
    return (
      <div className="flex items-center justify-center w-full aspect-square max-w-[500px] mx-auto">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Generating puzzle...</p>
        </div>
      </div>
    );
  }

  if (isPaused && !isComplete && !isGameOver) {
    return (
      <div className="flex items-center justify-center w-full aspect-square max-w-[500px] mx-auto">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="text-4xl mb-4">⏸️</div>
          <p className="text-lg font-semibold mb-2">Game Paused</p>
          <p className="text-muted-foreground text-sm">Resume to continue playing</p>
        </div>
      </div>
    );
  }

  const getCellClasses = (row: number, col: number): string => {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
    const cell = board[row][col];

    const isSameRow = selectedCell?.[0] === row;
    const isSameCol = selectedCell?.[1] === col;
    const isSameBox =
      selectedCell &&
      Math.floor(row / 3) === Math.floor(selectedCell[0] / 3) &&
      Math.floor(col / 3) === Math.floor(selectedCell[1] / 3);

    const isHighlighted = (isSameRow || isSameCol || isSameBox) && !isSelected;

    const isSameNumber =
      settings.highlightSameNumbers &&
      selectedNumber !== null &&
      cell.value === selectedNumber &&
      cell.value !== 0 &&
      !isSelected;

    const isError =
      cell.isError && settings.highlightConflicts && cell.value !== 0;

    // Base classes with sudoku-cell + cell-3d for deeper inset emboss + hover/active interactions
    let classes =
      'sudoku-cell cell-3d relative flex items-center justify-center cursor-pointer transition-all duration-150 select-none overflow-hidden';

    // Hover lift effect (desktop) with subtle glow, and active push-down
    classes +=
      ' hover:-translate-y-[1px] hover:shadow-lg hover:shadow-[0_0_12px_rgba(34,211,238,0.15)] active:translate-y-[1px] active:shadow-sm';

    // Thick borders for 3x3 subgrids - right borders
    if ((col + 1) % 3 === 0 && col < 8) {
      classes += ' border-r-[3px] border-r-cyan-400/50 dark:border-r-cyan-400/40';
    } else if (col < 8) {
      classes += ' border-r border-r-white/5 dark:border-r-white/5';
    }

    // Thick borders for 3x3 subgrids - bottom borders
    if ((row + 1) % 3 === 0 && row < 8) {
      classes += ' border-b-[3px] border-b-cyan-400/50 dark:border-b-cyan-400/40';
    } else if (row < 8) {
      classes += ' border-b border-b-white/5 dark:border-b-white/5';
    }

    // Apply CSS classes from globals.css based on cell state
    if (isSelected) {
      classes +=
        ' sudoku-cell-selected cell-3d-selected animate-cell-glow bg-cyan-500/25 ring-[3px] ring-cyan-400/50';
    } else if (isError) {
      classes += ' sudoku-cell-error bg-red-500/20';
    } else if (isSameNumber) {
      classes += ' sudoku-cell-same-number bg-cyan-500/15';
    } else if (isHighlighted) {
      classes += ' sudoku-cell-highlighted cell-3d-highlighted bg-white/[0.04] dark:bg-white/[0.04]';
    }

    return classes;
  };

  const getCellTextClasses = (row: number, col: number): string => {
    const cell = board[row][col];
    const isError =
      cell.isError && settings.highlightConflicts && cell.value !== 0;

    // BIGGER numbers for mobile: text-3xl base, text-4xl sm, text-5xl md
    let classes = 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none';

    if (isError) {
      classes += ' text-red-400 dark:text-red-400';
    } else if (cell.isGiven) {
      classes += ' text-foreground sudoku-cell-given';
    } else if (cell.value !== 0) {
      classes += ' text-cyan-500 dark:text-cyan-400 sudoku-cell-user';
    } else {
      classes = ''; // No text classes for empty cells
    }

    return classes;
  };

  return (
    <div className="w-full max-w-[500px] mx-auto animate-grid-enter">
      {/* Animated gradient border wrapper - colors flow along the border */}
      <div className="relative rounded-xl p-[2px] sm:p-[3px] shadow-[0_0_40px_rgba(34,211,238,0.2),0_0_80px_rgba(168,85,247,0.1)]">
        {/* Flowing gradient border - uses CSS @property to animate the gradient angle */}
        <div
          className="absolute inset-0 rounded-xl animate-border-flow"
          style={{
            background: 'conic-gradient(from var(--border-angle), rgba(34,211,238,0.5), rgba(168,85,247,0.4), rgba(34,211,238,0.3), rgba(168,85,247,0.5), rgba(34,211,238,0.5))',
          }}
        />
        <div
          className={`sudoku-grid-3d relative grid grid-cols-9 rounded-xl overflow-hidden border-2 sm:border-[3px] border-cyan-400/30 dark:border-cyan-400/20 aspect-square bg-white/[0.03] dark:bg-white/[0.02] shadow-2xl`}
        >
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={getCellClasses(rowIdx, colIdx)}
                onClick={() => handleCellClick(rowIdx, colIdx)}
                role="button"
                tabIndex={0}
                aria-label={`Row ${rowIdx + 1}, Column ${colIdx + 1}${cell.value ? `, value ${cell.value}` : ', empty'}${cell.isGiven ? ', given' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    selectCell(rowIdx, colIdx);
                  }
                }}
              >
                {/* Ripple effect overlay */}
                {ripple?.row === rowIdx && ripple?.col === colIdx && (
                  <span key={ripple.id} className="absolute inset-0 animate-cell-ripple rounded-sm bg-cyan-400/30 pointer-events-none" />
                )}

                {cell.value !== 0 ? (
                  <span
                    className={`${getCellTextClasses(rowIdx, colIdx)} ${
                      !cell.isGiven
                        ? 'animate-number-pop transition-transform duration-200'
                        : ''
                    }`}
                  >
                    {cell.value}
                  </span>
                ) : (
                  <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0 sm:p-[1px]">
                    {cell.notes.map((note, noteIdx) => (
                      <span
                        key={noteIdx}
                        className={`flex items-center justify-center text-[7px] sm:text-[10px] md:text-[12px] leading-none ${
                          note
                            ? 'text-muted-foreground/70 font-medium'
                            : 'text-transparent'
                        }`}
                      >
                        {noteIdx + 1}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SudokuGrid;
