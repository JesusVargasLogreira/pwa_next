'use client';

import { useState } from 'react';

const ROWS = 6;
const COLS = 7;
const CENTER_COL = Math.floor(COLS / 2);

type Player = '🔴' | '🟡' | null;
type RewardType = 'remove2' | 'extraTurn';
type Phase = 'playing' | 'removing' | 'gameOver';

interface Mission {
    id: string;
    name: string;
    description: string;
    flavor: string;
    check: (board: Player[][], player: Player) => boolean;
    reward: RewardType;
    rewardText: string;
    rewardIcon: string;
}

const ALL_MISSIONS: Mission[] = [
    {
        id: 'square2x2',
        name: '⬛ Cuadrado Táctico',
        description: 'Forma un cuadrado 2×2 con tus fichas',
        flavor: '"El poder en bloque"',
        check: (board, player) => {
            for (let r = 0; r < ROWS - 1; r++) {
                for (let c = 0; c < COLS - 1; c++) {
                    if (
                        board[r][c] === player && board[r][c + 1] === player &&
                        board[r + 1][c] === player && board[r + 1][c + 1] === player
                    ) return true;
                }
            }
            return false;
        },
        reward: 'remove2',
        rewardText: 'Elimina 2 fichas del rival',
        rewardIcon: '💣',
    },
    {
        id: 'bottomCorners',
        name: '🏛️ Esquinas Inferiores',
        description: 'Ocupa ambas esquinas del fondo del tablero',
        flavor: '"Controla los extremos"',
        check: (board, player) =>
            board[ROWS - 1][0] === player && board[ROWS - 1][COLS - 1] === player,
        reward: 'extraTurn',
        rewardText: 'Gana un turno extra',
        rewardIcon: '⚡',
    },
    {
        id: 'center3',
        name: '🎯 Columna Central',
        description: 'Coloca 3 fichas en la columna del centro',
        flavor: '"El corazón del tablero"',
        check: (board, player) =>
            board.filter(row => row[CENTER_COL] === player).length >= 3,
        reward: 'remove2',
        rewardText: 'Elimina 2 fichas del rival',
        rewardIcon: '💣',
    },
    {
        id: 'bottomRow4',
        name: '🪨 Base Sólida',
        description: 'Coloca 4 fichas en la fila inferior',
        flavor: '"Los cimientos del triunfo"',
        check: (board, player) =>
            board[ROWS - 1].filter(c => c === player).length >= 4,
        reward: 'extraTurn',
        rewardText: 'Gana un turno extra',
        rewardIcon: '⚡',
    },
    {
        id: 'diagonal3',
        name: '📐 Diagonal Maestra',
        description: 'Forma 3 fichas tuyas en diagonal',
        flavor: '"El ángulo de ataque perfecto"',
        check: (board, player) => {
            for (let r = 0; r < ROWS - 2; r++) {
                for (let c = 0; c < COLS - 2; c++) {
                    if (board[r][c] === player && board[r + 1][c + 1] === player && board[r + 2][c + 2] === player) return true;
                }
            }
            for (let r = 2; r < ROWS; r++) {
                for (let c = 0; c < COLS - 2; c++) {
                    if (board[r][c] === player && board[r - 1][c + 1] === player && board[r - 2][c + 2] === player) return true;
                }
            }
            return false;
        },
        reward: 'extraTurn',
        rewardText: 'Gana un turno extra',
        rewardIcon: '⚡',
    },
    {
        id: 'midRow4',
        name: '🌊 Línea Media',
        description: `Coloca 4 fichas en la fila del medio (fila ${Math.floor(ROWS / 2) + 1})`,
        flavor: '"Divide y vencerás"',
        check: (board, player) =>
            board[Math.floor(ROWS / 2)].filter(c => c === player).length >= 4,
        reward: 'remove2',
        rewardText: 'Elimina 2 fichas del rival',
        rewardIcon: '💣',
    },
];

function getRandomMission(excludeId?: string): Mission {
    const pool = ALL_MISSIONS.filter(m => m.id !== excludeId);
    return pool[Math.floor(Math.random() * pool.length)];
}

function createBoard(): Player[][] {
    return Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => null as Player)
    );
}

function checkWinner(board: Player[][]): Player {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r][c + 1] && cell === board[r][c + 2] && cell === board[r][c + 3]) return cell;
        }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r + 1][c] && cell === board[r + 2][c] && cell === board[r + 3][c]) return cell;
        }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r + 1][c + 1] && cell === board[r + 2][c + 2] && cell === board[r + 3][c + 3]) return cell;
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r - 1][c + 1] && cell === board[r - 2][c + 2] && cell === board[r - 3][c + 3]) return cell;
        }
    }
    return null;
}

export default function BountyPage() {
    const [board, setBoard] = useState<Player[][]>(createBoard);
    const [currentPlayer, setCurrentPlayer] = useState<Player>('🔴');
    const [winner, setWinner] = useState<Player>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [phase, setPhase] = useState<Phase>('playing');
    const [pendingRemovals, setPendingRemovals] = useState(0);
    const [bountyWinner, setBountyWinner] = useState<Player>(null);
    const [currentMission, setCurrentMission] = useState<Mission>(() => getRandomMission());
    const [bountyScores, setBountyScores] = useState<Record<string, number>>({ '🔴': 0, '🟡': 0 });
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'bomb' } | null>(null);
    const [missionFlash, setMissionFlash] = useState(false);

    const showToast = (msg: string, type: 'success' | 'info' | 'bomb' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const flashMission = () => {
        setMissionFlash(true);
        setTimeout(() => setMissionFlash(false), 700);
    };

    const resetGame = () => {
        setBoard(createBoard());
        setCurrentPlayer('🔴');
        setWinner(null);
        setIsDraw(false);
        setPhase('playing');
        setPendingRemovals(0);
        setBountyWinner(null);
        setCurrentMission(getRandomMission());
        setBountyScores({ '🔴': 0, '🟡': 0 });
        setToast(null);
    };

    const dropPiece = (col: number) => {
        if (phase !== 'playing' || winner || isDraw) return;

        const newBoard = board.map(r => [...r]);
        let placed = false;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (!newBoard[row][col]) {
                newBoard[row][col] = currentPlayer;
                placed = true;

                const gameWinner = checkWinner(newBoard);
                setBoard(newBoard);

                if (gameWinner) {
                    setWinner(gameWinner);
                    setPhase('gameOver');
                    return;
                }

                const full = newBoard.every(r => r.every(c => c !== null));
                if (full) {
                    setIsDraw(true);
                    setPhase('gameOver');
                    return;
                }

                // Check bounty mission
                if (currentMission.check(newBoard, currentPlayer)) {
                    setBountyScores(s => ({ ...s, [currentPlayer as string]: s[currentPlayer as string] + 1 }));
                    flashMission();

                    const nextMission = getRandomMission(currentMission.id);

                    if (currentMission.reward === 'extraTurn') {
                        showToast(`${currentPlayer} completó la misión! ⚡ ¡Turno EXTRA!`, 'success');
                        setCurrentMission(nextMission);
                        // Extra turn: do NOT switch player
                    } else {
                        // remove2
                        const opponentPiece: Player = currentPlayer === '🔴' ? '🟡' : '🔴';
                        const hasOpponentPieces = newBoard.some(r => r.some(c => c === opponentPiece));
                        if (hasOpponentPieces) {
                            setBountyWinner(currentPlayer);
                            setPendingRemovals(2);
                            setPhase('removing');
                            showToast(`${currentPlayer} completó la misión! 💣 ¡Elige 2 fichas para destruir!`, 'bomb');
                        } else {
                            showToast(`${currentPlayer} completó la misión! (Sin fichas del rival)`, 'info');
                            setCurrentPlayer(currentPlayer === '🔴' ? '🟡' : '🔴');
                        }
                        setCurrentMission(nextMission);
                    }
                    return;
                }

                setCurrentPlayer(currentPlayer === '🔴' ? '🟡' : '🔴');
                return;
            }
        }
        // Column full — do nothing
    };

    const removePiece = (row: number, col: number) => {
        if (phase !== 'removing' || !bountyWinner) return;
        const opponentPiece: Player = bountyWinner === '🔴' ? '🟡' : '🔴';
        if (board[row][col] !== opponentPiece) return;

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = null;
        setBoard(newBoard);

        const remaining = pendingRemovals - 1;
        const hasMore = newBoard.some(r => r.some(c => c === opponentPiece));

        if (remaining === 0 || !hasMore) {
            setPendingRemovals(0);
            setPhase('playing');
            const nextPlayer: Player = bountyWinner === '🔴' ? '🟡' : '🔴';
            setBountyWinner(null);
            setCurrentPlayer(nextPlayer);
            showToast('💥 ¡Fichas destruidas! El turno pasa al rival.', 'info');
        } else {
            setPendingRemovals(remaining);
        }
    };

    const isGameOver = winner !== null || isDraw;
    const opponentPiece: Player = bountyWinner === '🔴' ? '🟡' : '🔴';

    const getStatusText = () => {
        if (winner) return `🏆 ¡Ganador: ${winner}!`;
        if (isDraw) return '🤝 ¡Empate!';
        if (phase === 'removing') return `${bountyWinner} elimina ${pendingRemovals} ficha${pendingRemovals > 1 ? 's' : ''} del rival 💣`;
        return `Turno: ${currentPlayer}`;
    };
    const CELL_SIZE =
        typeof window !== 'undefined' && window.innerWidth < 640 ? 42 : 64;
    return (
        <main style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            overflowX: 'hidden',
        }}>

            {/* Dot-grid background */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.04,
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                pointerEvents: 'none',
            }} />

            {/* Title */}
            <h1 style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.75rem)',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
                fontFamily: 'Georgia, serif',
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                ⚔️ Connect 4: Mission Mode
            </h1>

            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'bomb'
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : toast.type === 'success'
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'rgba(99,102,241,0.95)',
                    color: toast.type === 'info' ? '#fff' : '#0f0c29',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    zIndex: 200,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    whiteSpace: 'normal',
                    maxWidth: '90vw',
                    textAlign: 'center',
                    fontFamily: 'Georgia, serif',
                    animation: 'toastIn 0.3s ease',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Three-column layout */}
            <div
                style={{
                    display: 'flex',
                    gap: '1.75rem',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                {/* ── LEFT: Bounty Panel ── */}
                <div style={{
                    width: '100%',
                    maxWidth: '230px',
                    background: 'rgba(0,0,0,0.55)',
                    border: `2px solid ${missionFlash ? '#fbbf24' : 'rgba(251,191,36,0.35)'}`,
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    fontFamily: 'Georgia, serif',
                    boxShadow: missionFlash
                        ? '0 0 50px rgba(251,191,36,0.7), 0 4px 24px rgba(0,0,0,0.6)'
                        : '0 4px 24px rgba(0,0,0,0.5)',
                    transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                }}>

                    {/* Header badge */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-block',
                            background: 'linear-gradient(90deg, #d97706, #fbbf24, #d97706)',
                            color: '#1a0a00',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            letterSpacing: '0.2em',
                            padding: '0.3rem 1rem',
                            borderRadius: '4px',
                        }}>
                            ★ MISIÓN ACTIVA ★
                        </div>
                    </div>

                    {/* Mission details */}
                    <div style={{ borderTop: '1px solid rgba(251,191,36,0.2)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                            {currentMission.name}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#e5e7eb', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                            {currentMission.description}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#9ca3af' }}>
                            {currentMission.flavor}
                        </div>
                    </div>

                    {/* Reward box */}
                    <div style={{
                        background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: '10px',
                        padding: '0.7rem 0.9rem',
                    }}>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.3rem' }}>
                            Recompensa
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24' }}>
                            {currentMission.rewardIcon} {currentMission.rewardText}
                        </div>
                    </div>

                    {/* Active removal alert */}
                    {phase === 'removing' && (
                        <div style={{
                            background: 'rgba(239,68,68,0.18)',
                            border: '2px solid rgba(239,68,68,0.7)',
                            borderRadius: '10px',
                            padding: '0.75rem',
                            textAlign: 'center',
                            animation: 'pulseBorder 1.2s ease-in-out infinite',
                        }}>
                            <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>💣</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5', lineHeight: 1.4 }}>
                                {bountyWinner} elige<br />
                                <span style={{ fontSize: '1.1rem', color: '#ef4444' }}>{pendingRemovals}</span> ficha{pendingRemovals > 1 ? 's' : ''} del rival<br />
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>(haz clic en el tablero)</span>
                            </div>
                        </div>
                    )}

                    {/* Bounty scoreboard */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.6rem' }}>
                            Misiones completadas
                        </div>
                        {(['🔴', '🟡'] as Player[]).map(p => (
                            <div key={p!} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.3rem 0',
                            }}>
                                <span style={{ fontSize: '0.88rem', color: '#d1d5db' }}>
                                    {p} Jugador {p === '🔴' ? '1' : '2'}
                                </span>
                                <span style={{
                                    background: 'rgba(251,191,36,0.15)',
                                    border: '1px solid rgba(251,191,36,0.35)',
                                    borderRadius: '6px',
                                    padding: '0.1rem 0.55rem',
                                    fontWeight: 800,
                                    color: '#fbbf24',
                                    fontSize: '0.95rem',
                                    minWidth: '28px',
                                    textAlign: 'center',
                                }}>
                                    {bountyScores[p as string]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CENTER: Game Board ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>

                    {/* Status bar */}
                    <div style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        padding: '0.5rem 1.5rem',
                        background: phase === 'removing'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(255,255,255,0.07)',
                        borderRadius: '999px',
                        border: `1px solid ${phase === 'removing' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                        width: '100%',
                        maxWidth: '320px',
                        textAlign: 'center',
                        fontFamily: 'Georgia, serif',
                        transition: 'all 0.3s ease',
                    }}>
                        {getStatusText()}
                    </div>

                    {/* Drop buttons */}
                    {phase === 'playing' && !isGameOver && (
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL_SIZE}px)`, gap: '8px' }}>
                            {Array.from({ length: COLS }).map((_, col) => (
                                <button
                                    key={col}
                                    onClick={() => dropPiece(col)}
                                    style={{
                                        width: `${CELL_SIZE}px`,
                                        height: `${CELL_SIZE * 0.65}px`,
                                        background: 'rgba(59,130,246,0.65)',
                                        border: '1px solid rgba(147,197,253,0.35)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s, transform 0.1s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,1)';
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.65)';
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                                    }}
                                >
                                    ↓
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Board */}
                    <div style={{
                        background: 'rgba(29,78,216,0.85)',
                        padding: '12px',
                        borderRadius: '18px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.65)',
                        border: '2px solid rgba(147,197,253,0.25)',
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 64px)', gap: '8px' }}>
                            {board.map((row, rowIdx) =>
                                row.map((cell, colIdx) => {
                                    const isRemovable = phase === 'removing' && cell === opponentPiece;
                                    return (
                                        <div
                                            key={`${rowIdx}-${colIdx}`}
                                            onClick={() => removePiece(rowIdx, colIdx)}
                                            style={{
                                                width: `${CELL_SIZE}px`,
                                                height: `${CELL_SIZE}px`,
                                                background: isRemovable
                                                    ? 'rgba(239,68,68,0.25)'
                                                    : 'rgba(15,23,42,0.8)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: CELL_SIZE < 50 ? '1.4rem' : '2rem',
                                                border: isRemovable
                                                    ? '2.5px solid rgba(239,68,68,0.9)'
                                                    : '2px solid rgba(147,197,253,0.18)',
                                                cursor: isRemovable ? 'pointer' : 'default',
                                                transition: 'all 0.15s ease',
                                                boxShadow: isRemovable ? '0 0 16px rgba(239,68,68,0.55)' : 'none',
                                                animation: isRemovable ? 'wobble 0.7s ease-in-out infinite' : 'none',
                                            }}
                                            onMouseEnter={e => {
                                                if (isRemovable) {
                                                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12)';
                                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(239,68,68,0.8)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (isRemovable) {
                                                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 16px rgba(239,68,68,0.55)';
                                                }
                                            }}
                                        >
                                            {cell}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Reset button */}
                    <button
                        onClick={resetGame}
                        style={{
                            padding: '0.6rem 2.25rem',
                            background: 'linear-gradient(90deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontFamily: 'Georgia, serif',
                            letterSpacing: '0.04em',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)';
                        }}
                    >
                        🔄 Reiniciar
                    </button>
                </div>

                {/* ── RIGHT: Rules Panel ── */}
                <div style={{
                    width: '100%',
                    maxWidth: '200px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.84rem',
                    color: '#9ca3af',
                    lineHeight: 1.65,
                }}>
                    <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                        📖 Cómo funciona
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {[
                            'Juega Connect 4 normalmente.',
                            'Cumple la Misión Activa para obtener una ventaja táctica.',
                            <span key="1">⚡ <span style={{ color: '#fbbf24' }}>Turno extra:</span> juegas de nuevo sin ceder el turno.</span>,
                            <span key="2">💣 <span style={{ color: '#fca5a5' }}>Elimina fichas:</span> haz clic en 2 fichas del rival para destruirlas.</span>,
                            'Cuando alguien completa la misión, ¡aparece una nueva!',
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.4rem' }}>
                                <span style={{ color: '#fbbf24', flexShrink: 0 }}>▸</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: '0.5rem' }}>Misiones disponibles</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {ALL_MISSIONS.map(m => (
                                <div key={m.id} style={{
                                    fontSize: '0.78rem',
                                    color: m.id === currentMission.id ? '#fbbf24' : '#6b7280',
                                    fontWeight: m.id === currentMission.id ? 700 : 400,
                                    transition: 'color 0.3s ease',
                                }}>
                                    {m.id === currentMission.id ? '▶ ' : '  '}{m.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25%       { transform: rotate(-6deg) scale(1.05); }
          75%       { transform: rotate(6deg) scale(1.05); }
        }
        @keyframes pulseBorder {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
        </main>
    );
}