import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Board } from "@/components/game/Board";
import { Button } from "@/components/ui/Button";
import { useKeyboardControls } from "@/hooks/controls/useKeyboardControls";
import { useGameLoop } from "@/hooks/core/useGameLoop";
import { useGameStore } from "@/store/gameStore";

interface GameProps {
  className?: string;
}

export const Game: React.FC<GameProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const isGameOver = useGameStore((state) => state.isGameOver);
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const resetGame = useGameStore((state) => state.resetGame);
  const startGame = useGameStore((state) => state.startGame);

  // Reset game on component mount to ensure clean initial state
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Enable game loop and keyboard controls only when game is active
  useGameLoop({ enableFpsCounter: false });
  useKeyboardControls({ enableDAS: true });

  // Check if game has started
  const hasGameStarted = currentPiece !== null || isGameOver;

  return (
    <div className={`min-h-screen w-full bg-slate-900 text-white flex flex-col ${className}`}>
      {/* Header */}
      <header className="w-full py-6 px-4">
        <h1 className="text-6xl md:text-8xl font-bold text-center text-white drop-shadow-lg">
          TETRIS
        </h1>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 px-4 pb-4">
        {/* Left sidebar - Score and info */}
        <aside className="w-full lg:w-80 xl:w-96 space-y-6">
          {/* Score display */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-center text-yellow-300">スコア</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-300 mb-1">スコア</div>
                <div className="text-3xl font-bold text-yellow-400">{score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300 mb-1">ライン</div>
                <div className="text-2xl font-bold text-yellow-400">{lines}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300 mb-1">レベル</div>
                <div className="text-2xl font-bold text-purple-400">{level}</div>
              </div>
            </div>
          </div>

          {/* High Score */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-center text-yellow-300 flex items-center justify-center gap-2">
              <span className="text-yellow-500">🏆</span>
              ハイスコア
            </h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">3,500</div>
              <div className="text-sm text-gray-400 mt-1">2025/6/28</div>
              <div className="flex justify-around mt-3 text-sm">
                <div>
                  <span className="text-gray-400">ライン: </span>
                  <span className="text-gray-200">18</span>
                </div>
                <div>
                  <span className="text-gray-400">レベル: </span>
                  <span className="text-gray-200">2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-center text-cyan-300">操作方法</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-mono text-lg">←→</span>
                <span className="text-white">移動</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-mono text-lg">↓</span>
                <span className="text-white">ソフトドロップ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-mono text-lg">↑</span>
                <span className="text-white">回転</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-mono">Space</span>
                <span className="text-white">ハードドロップ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-mono text-lg">C</span>
                <span className="text-white">ホールド</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-mono text-lg">P</span>
                <span className="text-white">一時停止</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main game area */}
        <main className="flex-1 flex items-center justify-center">
          {!hasGameStarted ? (
            <div className="text-center space-y-8">
              <div className="text-8xl mb-8 animate-pulse">🎮</div>
              <Button
                onClick={startGame}
                variant="primary"
                size="large"
                className="text-2xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                ゲーム開始
              </Button>
              <div className="text-gray-300 text-lg">
                <p>Enterキーまたはボタンクリックでゲーム開始</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              {/* Game Board */}
              <div className="relative">
                <Board className="border-4 border-cyan-400 rounded-lg shadow-2xl" />

                {isGameOver && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-lg">
                    <div className="bg-red-900/90 backdrop-blur border-2 border-red-500 rounded-xl p-8 text-center">
                      <h2 className="text-4xl font-bold mb-4 text-red-200">ゲームオーバー</h2>
                      <p className="text-lg text-red-300 mb-6">最終スコア: {score}</p>
                      <Button
                        onClick={resetGame}
                        variant="primary"
                        size="large"
                        className="text-xl px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        再スタート
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current piece info */}
              <div className="bg-black/40 backdrop-blur border border-cyan-400/50 rounded-lg px-6 py-3">
                <div className="text-lg text-gray-300">
                  現在のピース:{" "}
                  <span className="text-yellow-400 font-bold">
                    {currentPiece ? currentPiece.type : "なし"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar - Next pieces and hold */}
        <aside className="w-full lg:w-80 xl:w-96 space-y-6">
          {/* Next piece */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-center text-green-300">次のピース</h3>
            <div className="bg-gray-800/50 rounded-lg p-4 min-h-24 flex items-center justify-center">
              <span className="text-gray-400">準備中...</span>
            </div>
          </div>

          {/* Hold piece */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-center text-orange-300">ホールド</h3>
            <div className="bg-gray-800/50 rounded-lg p-4 min-h-24 flex items-center justify-center">
              <span className="text-gray-400">空</span>
            </div>
          </div>

          {/* Game stats */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-center text-pink-300">統計</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">総ゲーム数:</span>
                <span className="text-white">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">平均スコア:</span>
                <span className="text-white">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">状態:</span>
                <span
                  className={`font-semibold ${isGameOver ? "text-red-400" : currentPiece ? "text-green-400" : "text-yellow-400"}`}
                >
                  {isGameOver ? "ゲームオーバー" : currentPiece ? "プレイ中" : "待機中"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
