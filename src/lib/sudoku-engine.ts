/**
 * Sudoku Engine - Core puzzle generation, solving, and validation logic
 * Uses backtracking algorithm for generation and ensures unique solutions
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CellData {
  value: number;       // Current value (0 = empty)
  solution: number;    // Correct value
  notes: boolean[];    // Pencil marks [1-9], index 0 = number 1
  isGiven: boolean;    // Part of the original puzzle
  isError: boolean;    // Has a conflict
}

export interface UndoAction {
  row: number;
  col: number;
  prevValue: number;
  prevNotes: boolean[];
}

export type BoardState = CellData[][];

// Pre-allocated arrays for performance
const EMPTY_NOTES = Array(9).fill(false) as boolean[];
const CACHED_NUMS_ARRAY = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Create an empty 9x9 board */
export function createEmptyBoard(): BoardState {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      value: 0,
      solution: 0,
      notes: [...EMPTY_NOTES],
      isGiven: false,
      isError: false,
    }))
  );
}

/** Deep clone a board */
export function cloneBoard(board: BoardState): BoardState {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      notes: [...cell.notes],
    }))
  );
}

/** Check if placing num at (row, col) is valid on a number grid */
function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

/** Shuffle an array in place (Fisher-Yates) - optimized version */
function shuffleInPlace<T>(arr: T[], rng?: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng ? Math.floor(rng() * (i + 1)) : Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Generate a complete valid Sudoku grid using backtracking - optimized */
export function generateSolvedGrid(): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  const nums = [...CACHED_NUMS_ARRAY];

  function solve(pos: number): boolean {
    if (pos === 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;

    // Reuse nums array to avoid allocations
    nums[0] = 1; nums[1] = 2; nums[2] = 3; nums[3] = 4; nums[4] = 5;
    nums[5] = 6; nums[6] = 7; nums[7] = 8; nums[8] = 9;
    shuffleInPlace(nums);

    for (const num of nums) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        if (solve(pos + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0);
  return grid;
}

/** Generate a daily puzzle seed from date string */
export function getDailySeed(date: Date): number {
  const str = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Seeded random number generator (Mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Count solutions (up to limit) for a grid */
function countSolutions(grid: number[][], limit: number = 2): number {
  let count = 0;

  function solve(pos: number): boolean {
    if (count >= limit) return true;
    if (pos === 81) {
      count++;
      return count >= limit;
    }
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    if (grid[row][col] !== 0) return solve(pos + 1);

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        if (solve(pos + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0);
  return count;
}

/** Get number of clues to remove based on difficulty */
export function getCluesToRemove(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 41;   // ~40 clues left
    case 'medium': return 49; // ~32 clues left
    case 'hard': return 55;   // ~26 clues left
  }
}

/**
 * Generate a Sudoku puzzle with a unique solution
 * @param difficulty - Easy, Medium, or Hard
 * @param seed - Optional seed for daily puzzles
 * @param cluesToRemove - Optional override for number of cells to remove (for level-based puzzles)
 */
export function generatePuzzle(difficulty: Difficulty, seed?: number, cluesToRemove?: number): BoardState {
  const solvedGrid = generateSolvedGrid();
  const puzzleGrid = solvedGrid.map(row => [...row]);

  const removeCount = cluesToRemove ?? getCluesToRemove(difficulty);
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;

  // Create list of all cell positions and shuffle
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle positions using optimized in-place shuffle
  shuffleInPlace(positions, rng);

  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= removeCount) break;

    const backup = puzzleGrid[row][col];
    puzzleGrid[row][col] = 0;

    // Check uniqueness
    const testGrid = puzzleGrid.map(r => [...r]);
    if (countSolutions(testGrid, 2) !== 1) {
      puzzleGrid[row][col] = backup; // Restore - removing this would break uniqueness
    } else {
      removed++;
    }
  }

  // Build the board state
  const board: BoardState = puzzleGrid.map((row, r) =>
    row.map((val, c) => ({
      value: val,
      solution: solvedGrid[r][c],
      notes: [...EMPTY_NOTES],
      isGiven: val !== 0,
      isError: false,
    }))
  );

  return board;
}

/** Check if placing a value creates conflicts */
export function findConflicts(board: BoardState, row: number, col: number, value: number): [number, number][] {
  if (value === 0) return [];
  const conflicts: [number, number][] = [];

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === value) {
      conflicts.push([row, c]);
    }
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === value) {
      conflicts.push([r, col]);
    }
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === value) {
        conflicts.push([r, c]);
      }
    }
  }
  return conflicts;
}

/** Update all error flags on the board */
export function updateErrors(board: BoardState): BoardState {
  const newBoard = cloneBoard(board);

  // Reset all errors
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      newBoard[r][c].isError = false;
    }
  }

  // Mark conflicts
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (newBoard[r][c].value !== 0) {
        const conflicts = findConflicts(newBoard, r, c, newBoard[r][c].value);
        if (conflicts.length > 0) {
          newBoard[r][c].isError = true;
        }
      }
    }
  }

  return newBoard;
}

/** Check if the puzzle is completely and correctly solved */
export function isPuzzleSolved(board: BoardState): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value !== board[r][c].solution) return false;
    }
  }
  return true;
}

/** Count how many of each number are placed on the board */
export function countNumbers(board: BoardState): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = 0;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c].value;
      if (v >= 1 && v <= 9) counts[v]++;
    }
  }
  return counts;
}

/** Get a hint - returns the position and value of an unsolved cell */
export function getHint(board: BoardState): { row: number; col: number; value: number } | null {
  const unsolved: { row: number; col: number; value: number }[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value === 0 || board[r][c].value !== board[r][c].solution) {
        unsolved.push({ row: r, col: c, value: board[r][c].solution });
      }
    }
  }

  if (unsolved.length === 0) return null;
  return unsolved[Math.floor(Math.random() * unsolved.length)];
}

/** Auto-fill notes based on current board state */
export function autoFillNotes(board: BoardState): BoardState {
  const newBoard = cloneBoard(board);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (newBoard[r][c].value !== 0) {
        newBoard[r][c].notes = [...EMPTY_NOTES];
        continue;
      }

      const notes = [...EMPTY_NOTES];
      for (let num = 1; num <= 9; num++) {
        const conflicts = findConflicts(board, r, c, num);
        if (conflicts.length === 0) {
          notes[num - 1] = true;
        }
      }
      newBoard[r][c].notes = notes;
    }
  }

  return newBoard;
}

/** Solve the entire board (for cheat/testing) */
export function solveBoard(board: BoardState): BoardState {
  const newBoard = cloneBoard(board);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      newBoard[r][c].value = newBoard[r][c].solution;
      newBoard[r][c].isError = false;
      newBoard[r][c].notes = [...EMPTY_NOTES];
    }
  }
  return newBoard;
}
