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
│   ├── board.ts        # Board operations
│   ├── tetrominos.ts   # Piece definitions and rotation
│   ├── game.ts         # Core game mechanics
│   ├── pieceBag.ts     # 7-bag randomization
│   ├── wallKick.ts     # SRS wall kick system
│   └── ghost.ts        # Ghost piece calculation
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
- Lock delay: 500ms with 15 move/rotation limit
- DAS (Delayed Auto Shift): 170ms initial, 50ms repeat
- Scoring: Simplified system (100/300/500/800 base scores)
- Level progression: 10 lines per level

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

## Deployment

- Build target: Modern browsers with ES modules
- Static site deployment (Vercel, Netlify compatible)
- No server-side rendering required
- Production build optimized for size and performance