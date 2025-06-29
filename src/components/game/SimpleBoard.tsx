import type React from "react";
import { useGameStore } from "@/store/gameStore";

interface SimpleBoardProps {
  className?: string;
}

export const SimpleBoard: React.FC<SimpleBoardProps> = ({ className = "" }) => {
  const board = useGameStore((state) => state.board);

  return (
    <div
      className={`grid grid-cols-10 gap-0 border-2 border-gray-700 bg-gray-900 mx-auto rounded-lg ${className}`}
    >
      {board.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-6 h-6 border border-gray-600 ${cellValue === 0 ? "bg-gray-800" : "bg-blue-500"}`}
          />
        ))
      )}
    </div>
  );
};
