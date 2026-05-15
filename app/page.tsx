'use client';

import { useState } from 'react';

const ROWS = 6;
const COLS = 7;

type Player = '🔴' | '🟡' | null;

export default function Page() {
  const createBoard = () =>
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null as Player)
    );

  const [board, setBoard] = useState(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('🔴');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);

  // Reiniciar juego
  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPlayer('🔴');
    setWinner(null);
    setIsDraw(false);
  };

  // Verificar ganador
  const checkWinner = (newBoard: Player[][]) => {
    // Horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const cell = newBoard[row][col];

        if (
          cell &&
          cell === newBoard[row][col + 1] &&
          cell === newBoard[row][col + 2] &&
          cell === newBoard[row][col + 3]
        ) {
          return cell;
        }
      }
    }

    // Vertical
    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = newBoard[row][col];

        if (
          cell &&
          cell === newBoard[row + 1][col] &&
          cell === newBoard[row + 2][col] &&
          cell === newBoard[row + 3][col]
        ) {
          return cell;
        }
      }
    }

    // Diagonal ↘
    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const cell = newBoard[row][col];

        if (
          cell &&
          cell === newBoard[row + 1][col + 1] &&
          cell === newBoard[row + 2][col + 2] &&
          cell === newBoard[row + 3][col + 3]
        ) {
          return cell;
        }
      }
    }

    // Diagonal ↗
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const cell = newBoard[row][col];

        if (
          cell &&
          cell === newBoard[row - 1][col + 1] &&
          cell === newBoard[row - 2][col + 2] &&
          cell === newBoard[row - 3][col + 3]
        ) {
          return cell;
        }
      }
    }

    return null;
  };

  // Insertar ficha
  const dropPiece = (col: number) => {
    if (winner || isDraw) return;

    const newBoard = board.map((row) => [...row]);

    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = currentPlayer;

        const gameWinner = checkWinner(newBoard);

        setBoard(newBoard);

        if (gameWinner) {
          setWinner(gameWinner);
        } else {
          const full = newBoard.every((row) =>
            row.every((cell) => cell !== null)
          );

          if (full) {
            setIsDraw(true);
          } else {
            setCurrentPlayer(currentPlayer === '🔴' ? '🟡' : '🔴');
          }
        }

        return;
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 text-white overflow-x-hidden">
      <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-center">Connect 4</h1>

      <div className="mb-6 text-lg sm:text-2xl font-semibold text-center">
        {winner
          ? `Ganador: ${winner}`
          : isDraw
            ? 'Empate'
            : `Turno: ${currentPlayer}`}
      </div>

      {/* Botones de columnas */}
      <div
        className="grid grid-cols-7 gap-1 sm:gap-2 mb-2"
        style={{
          width: "min(95vw, 520px)",
        }}
      >
        {Array.from({ length: COLS }).map((_, col) => (
          <button
            key={col}
            onClick={() => dropPiece(col)}
            className="bg-blue-500 hover:bg-blue-600 transition rounded-lg aspect-square w-full text-lg sm:text-2xl font-bold"
          >
            ↓
          </button>
        ))}
      </div>

      {/* Tablero */}
      <div
        className="bg-blue-700 p-2 sm:p-3 rounded-2xl shadow-2xl"
        style={{
          width: "min(95vw, 560px)",
        }}
      >
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="aspect-square w-full bg-slate-800 rounded-full flex items-center justify-center text-xl sm:text-4xl border-2 border-blue-300"
              >
                {cell}
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={resetGame}
        className="mt-6 px-5 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-base sm:text-xl font-bold transition w-full max-w-xs"
      >
        Reiniciar
      </button>
    </main>
  );
}