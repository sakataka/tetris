# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Tetris game implementation using React + TypeScript + Vite with a focus on:
- Functional programming patterns (no classes)
- Test-driven development (TDD) with >90% coverage on pure functions
- Bilingual support (English/Japanese) with i18n
- Strict TypeScript compliance
- Modern web technologies (Bun, Zustand, Framer Motion, Tailwind CSS)

## Common Development Commands

```bash
# Development
bun run dev                # Start development server
bun run build             # Production build
bun run preview           # Preview production build

# Code Quality
bun run lint              # Lint and fix with Biome
bun run format            # Format code with Biome
bun run typecheck         # Type checking with TypeScript

# Testing
bun test src/             # Run tests with Bun
bun test src/game/board.test.ts  # Run single test file
bun test --test-name-pattern="lock delay"  # Run tests matching pattern
bun test --coverage       # Run tests with coverage report
bun run ci                # Run full CI pipeline (lint + typecheck + test + build)

# Git Hooks
bun run prepare           # Install lefthook git hooks
```

## Project Architecture

### Directory Structure
```
src/
├── components/          # React UI components
│   ├── game/           # Game-specific components (Board, Pieces, Score)
│   ├── layout/         # Layout components (Game, Settings)
│   └── ui/             # Reusable UI components
├── game/               # Pure game logic (NO React dependencies)
│   ├── board.ts        # Board operations, game over detection
│   ├── tetrominos.ts   # Piece definitions and rotation
│   ├── game.ts         # Core game mechanics, lock delay, hold system
│   ├── pieceBag.ts     # 7-bag randomization
│   └── wallKick.ts     # SRS wall kick system
├── store/              # Zustand state management
│   ├── gameStore.ts    # Game state
│   ├── settingsStore.ts # User settings
│   └── highScoreStore.ts # Score persistence
├── types/              # TypeScript definitions
├── utils/              # Shared utilities
├── locales/            # Translation files (en.json, ja.json)
└── test/               # Test utilities and setup
```

### Key Architectural Principles

1. **Separation of Concerns**: UI components NEVER directly import from `src/game/*` - use Zustand stores only
2. **Pure Functions**: All game logic in `src/game/` consists of pure functions with no side effects
3. **Immutable State**: All state updates use immutable patterns
4. **Type Safety**: Strict TypeScript with no `any` types allowed

## Development Workflow

### Testing Strategy
- **Test pure functions only** - Focus on game logic in `src/game/` and `src/utils/`
- **No React component testing** - UI validation through E2E tests
- **TDD approach**: Write tests before implementation for pure functions
- **Coverage target**: >90% on all pure functions
- **Current Status**: 403 passing tests, 3 failing (lock delay edge cases)

### Game Implementation Details

#### Board System
- Visible board: 20x10 grid
- Buffer area: 4 rows above visible (for spawning)
- Total board: 24x10 with buffer area

#### Tetromino System
- All 7 standard pieces (I, O, T, S, Z, J, L)
- Complete SRS (Super Rotation System) with wall kicks
- 7-bag randomization for fair piece distribution

#### Core Game Mechanics
- **Lock delay**: 500ms with 15 move/rotation limit (prevents infinite manipulation)
- **Hold system**: One hold per piece, swaps current with held piece
- **Game over**: Occurs when new piece cannot spawn in buffer area (y=21)
- **DAS (Delayed Auto Shift)**: 170ms initial, 50ms repeat
- **Scoring**: Simplified system (100/300/500/800 base scores)
- **Level progression**: 10 lines per level

### Internationalization

- **Critical**: Never use hardcoded strings in components
- Use `useTranslation()` hook and `t()` function consistently
- Translations in `src/locales/en.json` and `src/locales/ja.json`
- Language detection: localStorage → browser language → fallback to English

### State Management

- **Game State**: `useGameStore()` - Core game mechanics
- **Settings**: `useSettingsStore()` - User preferences with localStorage persistence
- **High Scores**: `useHighScoreStore()` - Score tracking with persistence

## Code Quality Standards

### TypeScript
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Path aliases: `@/` for src directory
- No `any` types allowed (enforced by Biome)

### Import Rules
- **ALWAYS use `@/` path alias for all imports from src directory**
- Cross-directory imports: Use `@/` alias
- Same directory imports: Use relative `./` paths only for files in same directory
- External imports: Direct package names

**Examples:**
```typescript
// ✅ Correct: Use @/ for src imports
import { GameState } from "@/types/game";
import { BOARD_CONSTANTS } from "@/utils/gameConstants";
import { createTetromino } from "@/game/tetrominos";

// ✅ Correct: Same directory relative imports
import { helperFunction } from "./utils";
import { localConstant } from "./constants";

// ❌ Incorrect: Relative paths across directories
import { GameState } from "../types/game";
import { BOARD_CONSTANTS } from "../utils/gameConstants";
```

### Formatting & Linting
- Biome for both linting and formatting
- 2-space indentation, 100 character line width
- Double quotes for strings, trailing commas for ES5

### Git Workflow
- Conventional commits format: `feat:`, `fix:`, `test:`, `chore:`
- Lefthook pre-commit hooks for automatic formatting and linting
- CI pipeline on GitHub Actions for all PRs

## Testing Notes

### Test Files Location
- Co-locate test files with implementation: `src/game/board.test.ts`
- Test setup in `src/test/setup.ts`
- Use Bun's built-in test runner with happy-dom

### What to Test
- ✅ Pure functions in `src/game/` and `src/utils/`
- ✅ State management logic
- ✅ Type guards and validation functions
- ❌ React components (use E2E instead)
- ❌ Custom hooks (test indirectly)

## Performance Considerations

- Game loop runs at 60fps using `requestAnimationFrame`
- Animations use GPU-accelerated properties (`transform`, `opacity`)
- State updates are batched and optimized
- Bundle size monitored with tree shaking

## Common Patterns

### Game Logic
```typescript
// All game functions are pure
function moveTetrominoBy(state: GameState, dx: number, dy: number): GameState {
  // Returns new state, never mutates input
}
```

### Component Structure
```typescript
// Components receive data via props, never access stores directly
function Board({ board, currentPiece }: BoardProps) {
  // UI logic only
}
```

### Store Actions
```typescript
// Store actions call pure game functions
const useGameStore = create<GameStore>()((set) => ({
  moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
}));
```

## Current Implementation Status

**Phase 6 In Progress**: Core game mechanics and UI components completed
- ✅ **Phase 1-5 Complete**: Foundation, types, game logic, stores, and UI components
- ✅ Game logic with comprehensive TDD coverage (403 passing tests, 3 failing)
- ✅ Complete Zustand state management with persistence
- ✅ Full i18n implementation (English/Japanese) with language detection
- ✅ Core UI components implemented (Board, ScoreBoard, pieces, high scores)
- ✅ Game loop with proper timing and 60fps target using requestAnimationFrame
- ✅ Input controls (keyboard/touch) implementation with DAS and cooldowns
- ✅ Performance optimization with state selectors and proper React patterns
- ⚠️ Minor test failures in lock delay functionality need resolution
- 🔄 **Current Gap**: Main game UI integration pending (App.tsx still uses placeholder)

**Next Phase**: Complete game UI integration and responsive layout implementation (Phase 7)

### Key Implementations Completed
- **Game Logic**: All 7 tetrominoes, SRS wall kicks, 7-bag randomization, lock delay
- **State Management**: Game store, settings store, high score store with persistence
- **UI Components**: Board with animations, piece previews, score display
- **Input System**: Keyboard controls with DAS, touch gestures for mobile
- **Test Coverage**: 403 tests covering game mechanics, utilities, and state management
- **Performance**: Optimized game loop, state selectors, GPU-accelerated animations

### Immediate Development Priorities

1. **Fix Failing Tests**: Resolve 3 lock delay test failures
2. **Main UI Integration**: Replace App.tsx placeholder with actual game interface
3. **Layout Components**: Create responsive game layout components
4. **Game State Integration**: Connect game loop and controls to UI
5. **Mobile Optimization**: Ensure touch controls work properly
6. **Visual Polish**: Complete animations and responsive design

## Available MCP Tools

### Playwright
- **Purpose**: Browser testing and screen verification
- **Usage**: Use Playwright as the primary tool for browser-based testing and visual confirmation
- **When to use**: E2E tests, UI validation, cross-browser testing, screenshot comparisons

### Context7
- **Purpose**: Library research and latest version information
- **Usage**: Research tool for investigating new library versions and latest information
- **When to use**: Only when investigating library updates, new features, or latest documentation
- **Note**: Generally not used for regular development tasks

### AivisSpeech
- **Purpose**: Task completion audio notifications
- **Usage**: Play audio notification when tasks are completed
- **Message**: Japanese completion messages (e.g., "タスクが完了しました。お疲れ様でした。")
- **When to use**: After completing significant tasks to provide audio feedback
- **IMPORTANT**: Always use `mcp__aivisspeech__speak` (NOT `notify_completion`) with volumeScale=0.3

## Deployment

- Build target: Modern browsers with ES modules
- Static site deployment (Vercel, Netlify compatible)
- No server-side rendering required
- Production build optimized for size and performance