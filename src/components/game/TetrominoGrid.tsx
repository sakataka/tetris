import type React from "react";
import { getShapeBounds, getTetrominoColorIndex, getTetrominoShape } from "@/game/tetrominos";
import type { CellValue, TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export interface TetrominoGridProps {
  pieceType?: TetrominoTypeName | null;
  rotation?: number;
  size?: "small" | "medium" | "large";
  showGrid?: boolean;
  className?: string;
  cellClassName?: string;
  emptyLabel?: string;
  "data-testid"?: string;
}

interface GridCellProps {
  value: CellValue;
  isEmpty: boolean;
  showGrid: boolean;
  size: "small" | "medium" | "large";
  className?: string;
}

const GridCell: React.FC<GridCellProps> = ({ value, isEmpty, showGrid, size, className = "" }) => {
  const sizeClasses = {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-6 h-6",
  };

  const backgroundColor = isEmpty ? "transparent" : GAME_CONSTANTS.PIECE_COLORS[value] || "#6b7280";

  const cellClasses = `
    ${sizeClasses[size]}
    ${showGrid ? "border border-gray-600" : ""}
    ${isEmpty ? "" : "rounded-sm"}
    ${className}
  `.trim();

  return (
    <div className={cellClasses} style={{ backgroundColor }} role="gridcell" aria-hidden="true" />
  );
};

const getGridDimensions = (pieceType: TetrominoTypeName | null): number => {
  if (!pieceType) return 4; // Default grid size for empty state

  // I piece needs 4x4 grid, others can use smaller grids
  switch (pieceType) {
    case "I":
      return 4;
    case "O":
      return 2;
    default:
      return 3;
  }
};

const getCenteredGrid = (
  shape: number[][],
  gridSize: number,
  colorIndex: CellValue
): CellValue[][] => {
  // Initialize empty grid
  const grid: CellValue[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));

  if (shape.length === 0) {
    return grid;
  }

  // Get the bounds of the actual piece
  const bounds = getShapeBounds(shape);

  // Calculate offset to center the piece
  const offsetX = Math.floor((gridSize - bounds.width) / 2);
  const offsetY = Math.floor((gridSize - bounds.height) / 2);

  // Find the actual bounds in the original shape
  let minX = shape[0].length;
  let maxX = -1;
  let minY = shape.length;
  let maxY = -1;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Copy the piece to the center of the grid
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (shape[y] && shape[y][x] !== 0) {
        const gridX = offsetX + (x - minX);
        const gridY = offsetY + (y - minY);

        if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
          grid[gridY][gridX] = colorIndex;
        }
      }
    }
  }

  return grid;
};

export const TetrominoGrid: React.FC<TetrominoGridProps> = ({
  pieceType = null,
  rotation = 0,
  size = "medium",
  showGrid = false,
  className = "",
  cellClassName = "",
  emptyLabel = "Empty",
  "data-testid": dataTestId,
}) => {
  const gridSize = getGridDimensions(pieceType);

  let grid: CellValue[][];

  if (!pieceType) {
    // Empty state - show empty grid
    grid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(0));
  } else {
    // Get piece shape and color
    let shape = getTetrominoShape(pieceType);

    // Apply rotation if specified
    for (let i = 0; i < rotation; i++) {
      const rotated: number[][] = Array(shape[0].length)
        .fill(null)
        .map(() => Array(shape.length).fill(0));

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          rotated[x][shape.length - 1 - y] = shape[y][x];
        }
      }
      shape = rotated;
    }

    const colorIndex = getTetrominoColorIndex(pieceType);
    grid = getCenteredGrid(shape, gridSize, colorIndex);
  }

  const containerClasses = `
    inline-grid
    gap-0
    ${className}
  `.trim();

  const gridStyle = {
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${gridSize}, 1fr)`,
  };

  return (
    <div
      className={containerClasses}
      style={gridStyle}
      role="grid"
      aria-label={pieceType ? `${pieceType} piece preview` : emptyLabel}
      data-testid={dataTestId}
      data-piece-type={pieceType}
      data-rotation={rotation}
      data-grid-size={gridSize}
    >
      {grid.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => (
          <GridCell
            key={`${rowIndex}-${colIndex}`}
            value={cellValue}
            isEmpty={cellValue === 0}
            showGrid={showGrid}
            size={size}
            className={cellClassName}
          />
        ))
      )}
    </div>
  );
};

export default TetrominoGrid;
