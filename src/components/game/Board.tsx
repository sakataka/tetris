import type React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import type { Position, Tetromino } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BoardCell } from "./BoardCell";

interface BoardProps {
  className?: string;
}

const isPositionInCurrentPiece = (
  row: number,
  col: number,
  currentPiece: Tetromino | null
): boolean => {
  if (!currentPiece) return false;

  const { position, shape } = currentPiece;
  const shapeRow = row - position.y;
  const shapeCol = col - position.x;

  if (shapeRow < 0 || shapeRow >= shape.length || shapeCol < 0 || shapeCol >= shape[0].length) {
    return false;
  }

  return shape[shapeRow][shapeCol] === 1;
};

const isPositionInGhost = (
  row: number,
  col: number,
  currentPiece: Tetromino | null,
  ghostPosition: Position | null
): boolean => {
  if (!currentPiece || !ghostPosition) return false;

  const { shape } = currentPiece;
  const shapeRow = row - ghostPosition.y;
  const shapeCol = col - ghostPosition.x;

  if (shapeRow < 0 || shapeRow >= shape.length || shapeCol < 0 || shapeCol >= shape[0].length) {
    return false;
  }

  return shape[shapeRow][shapeCol] === 1;
};

export const Board: React.FC<BoardProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const board = useGameStore((state) => state.board);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const ghostPosition = useGameStore((state) => state.ghostPosition);
  const linesClearing = useGameStore((state) => state.linesClearing);

  const boardClassName = `
    grid grid-cols-10
    gap-0
    border-2 border-gray-700
    bg-gray-900
    mx-auto
    rounded-lg
    shadow-2xl
    ${className}
  `.trim();

  const cells = useMemo(() => {
    return board.map((row, rowIndex) =>
      row.map((cellValue, colIndex) => {
        const isCurrentPiece = isPositionInCurrentPiece(rowIndex, colIndex, currentPiece);
        const isGhost = isPositionInGhost(rowIndex, colIndex, currentPiece, ghostPosition);
        const isClearing = linesClearing.includes(rowIndex);

        // Use the piece's color value for current piece and ghost cells
        const displayValue =
          (isCurrentPiece || isGhost) && currentPiece ? currentPiece.colorIndex : cellValue;

        return (
          <BoardCell
            key={`${rowIndex}-${colIndex}`}
            value={displayValue}
            isGhost={isGhost && !isCurrentPiece}
            isCurrentPiece={isCurrentPiece}
            isClearing={isClearing}
            row={rowIndex}
            col={colIndex}
          />
        );
      })
    );
  }, [board, currentPiece, ghostPosition, linesClearing]);

  return (
    <div
      className={boardClassName}
      role="grid"
      aria-label={t("game.pieces.board", "Game Board")}
      aria-rowcount={GAME_CONSTANTS.BOARD.HEIGHT}
      aria-colcount={GAME_CONSTANTS.BOARD.WIDTH}
      style={{
        width: "300px",
        height: "600px",
      }}
    >
      {cells}
    </div>
  );
};

export default Board;
