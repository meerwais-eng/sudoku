'use client';

import React, { useCallback, useRef, memo } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import type { CellData } from '@/lib/sudoku-engine';

interface CellProps {
  row: number;
  col: number;
  cell: CellData;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isError: boolean;
  selectCell: (row: number, col: number) => void;
  onKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
  showNotes: boolean;
}

const MemoizedCell = memo<CellProps>(({
  row,
  col,
  cell,
  isSelected,
  isHighlighted,
  isSameNumber,
  isError,
  selectCell,
  onKeyDown,
  showNotes,
}) => {
  const rippleRef = useRef<HTMLSpanElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    selectCell(row, col);
    if (rippleRef.current) {
      rippleRef.current.classList.remove('animate-cell-ripple');
      void rippleRef.current.offsetWidth;
      rippleRef.current.classList.add('animate-cell-ripple');
    }
  }, [selectCell, row, col]);

  let classes = 'sudoku-cell cell-3d relative flex items-center justify-center cursor-pointer select-none overflow-hidden';
  // Removed hover/active transform classes — on mobile touch devices there is no
  // hover state, and active:transform creates perceived tap lag. The cell-3d and
  // sudoku-cell CSS now only transitions background-color (cheapest property),
  // giving instant visual feedback on touch. Selection transforms come from
  // .cell-3d-selected / .sudoku-cell-selected which apply immediately (no transition).

  if ((col + 1) % 3 === 0 && col < 8) {
    classes += ' border-r-[3px] border-r-cyan-400/90 dark:border-r-cyan-400/70';
  } else if (col < 8) {
    classes += ' border-r border-r-white/5 dark:border-r-white/5';
  }

  if ((row + 1) % 3 === 0 && row < 8) {
    classes += ' border-b-[3px] border-b-cyan-400/90 dark:border-b-cyan-400/70';
  } else if (row < 8) {
    classes += ' border-b border-b-white/5 dark:border-b-white/5';
  }

  if (isSelected) {
    classes += ' sudoku-cell-selected cell-3d-selected animate-cell-glow bg-cyan-500/25 ring-[3px] ring-cyan-400/50';
  } else if (isError) {
    classes += ' sudoku-cell-error bg-red-500/20';
  } else if (isSameNumber) {
    classes += ' sudoku-cell-same-number bg-cyan-500/15';
  } else if (isHighlighted) {
    classes += ' sudoku-cell-highlighted cell-3d-highlighted bg-white/[0.04] dark:bg-white/[0.04]';
  }

  let textClasses = 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none';
  if (isError) {
    textClasses += ' text-red-400 dark:text-red-400';
  } else if (cell.isGiven) {
    textClasses += ' text-foreground sudoku-cell-given';
  } else if (cell.value !== 0) {
    textClasses += ' text-cyan-500 dark:text-cyan-400 sudoku-cell-user';
  } else {
    textClasses = '';
  }

  return (
    <div
      className={classes}
      onPointerDown={handlePointerDown}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Row ${row + 1}, Column ${col + 1}${cell.value ? `, value ${cell.value}` : ', empty'}${cell.isGiven ? ', given' : ''}`}
      onKeyDown={(e) => onKeyDown(e, row, col)}
    >
      <span ref={rippleRef} className="absolute inset-0 rounded-sm bg-cyan-400/30 pointer-events-none" />
      {cell.value !== 0 ? (
        <span className={`${textClasses} ${!cell.isGiven ? 'animate-number-pop transition-transform duration-200' : ''}`}>
          {cell.value}
        </span>
      ) : (
        showNotes && (
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0 sm:p-[1px]">
            {cell.notes.map((note, noteIdx) => (
              <span key={noteIdx} className={`flex items-center justify-center text-[7px] sm:text-[10px] md:text-[12px] leading-none ${note ? 'text-muted-foreground/70 font-medium' : 'text-transparent'}`}>
                {noteIdx + 1}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  );
});

MemoizedCell.displayName = 'MemoizedCell';

const SudokuGrid: React.FC = () => {
  const board = useSudokuStore((s) => s.board);
  const selectedCell = useSudokuStore((s) => s.selectedCell);
  const selectCell = useSudokuStore((s) => s.selectCell);
  const settings = useSudokuStore((s) => s.settings);
  const selectedNumber = useSudokuStore((s) => s.selectedNumber);
  const isPaused = useSudokuStore((s) => s.isPaused);
  const isComplete = useSudokuStore((s) => s.isComplete);
  const isGameOver = useSudokuStore((s) => s.isGameOver);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      selectCell(row, col);
    }
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

  const selRow = selectedCell?.[0] ?? -1;
  const selCol = selectedCell?.[1] ?? -1;
  const selBoxRow = Math.floor(selRow / 3) * 3;
  const selBoxCol = Math.floor(selCol / 3) * 3;
  const highlightSameNumbers = settings.highlightSameNumbers;
  const highlightConflicts = settings.highlightConflicts;
  const showNotes = !isPaused;

  return (
    <div className="w-full max-w-[500px] mx-auto animate-grid-enter">
      <div className="relative rounded-xl p-[2px] sm:p-[3px] shadow-[0_0_40px_rgba(34,211,238,0.2),0_0_80px_rgba(168,85,247,0.1)]">
        <div className="absolute inset-0 rounded-xl animate-border-flow" style={{ background: 'conic-gradient(from var(--border-angle), rgba(34,211,238,0.5), rgba(168,85,247,0.4), rgba(34,211,238,0.3), rgba(168,85,247,0.5), rgba(34,211,238,0.5))' }} />
        <div className={`sudoku-grid-3d relative grid grid-cols-9 rounded-xl overflow-hidden border-2 sm:border-[3px] border-cyan-400/70 dark:border-cyan-400/50 aspect-square bg-white/[0.03] dark:bg-white/[0.02] shadow-2xl`} style={{ touchAction: 'manipulation' }}>
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const isSelected = selRow === rowIdx && selCol === colIdx;
              const isSameRow = selRow === rowIdx;
              const isSameCol = selCol === colIdx;
              const isSameBox = selRow >= 0 && Math.floor(rowIdx / 3) === selBoxRow && Math.floor(colIdx / 3) === selBoxCol;
              const isHighlighted = (isSameRow || isSameCol || isSameBox) && !isSelected;
              const isSameNumber = highlightSameNumbers && selectedNumber !== null && cell.value === selectedNumber && cell.value !== 0 && !isSelected;
              const isError = cell.isError && highlightConflicts && cell.value !== 0;
              return (
                <MemoizedCell key={`${rowIdx}-${colIdx}`} row={rowIdx} col={colIdx} cell={cell} isSelected={isSelected} isHighlighted={isHighlighted} isSameNumber={isSameNumber} isError={isError} selectCell={selectCell} onKeyDown={handleKeyDown} showNotes={showNotes} />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SudokuGrid;