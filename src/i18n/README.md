# Internationalization (i18n) Guide

## Translation Key Naming Conventions

### Structure
Translation keys follow a hierarchical structure using dot notation:

```
category.subcategory.item
```

### Categories

#### `game.*`
Core game-related translations
- `game.title` - Main game title
- `game.score.*` - Score-related terms
- `game.controls.*` - Control action names
- `game.states.*` - Game state descriptions
- `game.pieces.*` - Piece-related terms
- `game.actions.*` - User actions and buttons

#### `settings.*`
Settings and configuration
- `settings.title` - Settings page title
- `settings.language` - Language selection
- `settings.showGhostPiece` - Ghost piece toggle
- `settings.controls` - Controls section
- `settings.close` - Close button

#### `languages.*`
Language names
- `languages.en` - English
- `languages.ja` - Japanese (日本語)

#### `highScores.*`
High score system
- `highScores.title` - High scores page title
- `highScores.rank` - Rank column
- `highScores.score` - Score column
- `highScores.lines` - Lines column
- `highScores.level` - Level column
- `highScores.date` - Date column
- `highScores.noScores` - Empty state message

#### `controls.*`
Control instructions
- `controls.keyboard.*` - Keyboard controls
- `controls.touch.*` - Touch/mobile controls

### Naming Rules

1. **Use camelCase** for multi-word keys: `showGhostPiece`
2. **Be descriptive** but concise: `gameOver` not `go`
3. **Group related keys** under common categories
4. **Use consistent terminology** across all languages
5. **Avoid abbreviations** unless widely understood

### Examples

```typescript
// ✅ Good
t('game.score.title')           // "Score"
t('settings.showGhostPiece')    // "Show Ghost Piece"
t('controls.keyboard.moveLeft') // "Move Left"

// ❌ Bad
t('score')                      // Too generic
t('settings.ghost')             // Unclear
t('ctrl.kb.left')              // Abbreviations
```

### Adding New Translations

1. **Add to both files**: Always add new keys to both `en.json` and `ja.json`
2. **Maintain structure**: Keep the same hierarchy in both files
3. **Test consistency**: Run tests to verify key consistency
4. **Use t() function**: Never hardcode strings in components

### File Structure

```json
{
  "game": {
    "title": "Tetris",
    "score": {
      "title": "Score",
      "lines": "Lines",
      "level": "Level"
    }
  }
}
```

### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('game.title')}</h1>
      <p>{t('game.score.title')}: {score}</p>
    </div>
  );
}
```

### Language Detection Priority

1. **localStorage**: Saved user preference (`tetris-language` key)
2. **Browser language**: `navigator.language` (detects `ja` prefix)
3. **Fallback**: English (`en`)

### Supported Languages

- **English** (`en`): Default and fallback language
- **Japanese** (`ja`): Full translation support

### Testing

Run i18n tests to verify translation functionality:

```bash
bun test src/test/i18n.test.ts
bun test src/test/languageDetection.test.ts
```