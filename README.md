# Loggette
A lightweight, zero-dependency TypeScript logger with template literal support, color output, and runtime level control.

## Features
- Template literal API for easy value interpolation
- Four log levels: `error`, `warn`, `info`, `debug`
- Automatic color detection (TTY, `NO_COLOR`, `FORCE_COLOR`)
- Runtime level and color switching
- Swappable default logger
- Chainable methods

## Installation
Depending on your package manager:
- `npm i loggette`
- `bun add loggette`
- `yarn add loggette`
- `pnpm add loggette`
- `deno add npm:loggette`

## Usage
### Default logger
```typescript
import logger from "loggette";

logger.info`Server started on port ${port}`
.warn(`Config file ${"config.json"} not found, using defaults`)
.error`Failed to connect to database: ${err.message}`
.debug`Parsed payload: ${JSON.stringify(payload)}`;
```

### Custom logger

```typescript
import { createLogger } from "loggette";

const logger = createLogger("debug");

logger.debug`This will show`;
```

### Chaining

All methods return the logger instance, so they can be chained:

```typescript
const logger = createLogger("info")
    .setLevel("debug")
    .setUseColor(false)
    .setDefault()
    .debug("test") // not printed
    .info`Logged in as ${username}`;
```

### Template literals
Interpolated values are highlighted in the level's color:

```typescript
logger.info`Connected to ${"localhost"}:${5432}`;
// the values "localhost" and "5432" are colored
logger.info(`Database ${db.name} connected.`)
// db.name is not highlighted
```

####
> [!NOTE]
> Interpolated values are only processed using String() so data types like objects may print as "[object, Object]".
> Validate the values yourself as this is only a minimal logger.

## Log Levels
Levels are ordered by severity. Setting a level suppresses everything below it.

| Level   | Prints                        |
|---------|-------------------------------|
| `error` | errors only                   |
| `warn`  | errors, warnings              |
| `info`  | errors, warnings, info        |
| `debug` | everything                    |

```typescript
const logger = createLogger("warn");

logger.info`This won't print`;
logger.warn`This will`;
```

## API
### `createLogger(level, useColor?)`

Creates a new logger instance.

| Param      | Type       | Description                                      |
|------------|------------|--------------------------------------------------|
| `level`    | `LogLevel` | Minimum level to print                           |
| `useColor` | `boolean?` | Force color on/off. Auto-detects if not provided |

### `logger.setLevel(level)`

Change the log level at runtime. Returns the logger for chaining.

```typescript
logger.setLevel("debug");
```

### `logger.setUseColor(color?)`

Force color on/off, or pass `undefined` to re-enable auto-detection. Returns the logger for chaining.

```typescript
logger.setUseColor(false); // force off
logger.setUseColor();      // back to auto
```

### `logger.setDefault()`

Replace the module-level default logger with this instance. Returns the logger for chaining.

```typescript
const logger = createLogger("debug");
logger.setDefault();
```

## Color Control

Loggette respects standard color environment variables:

| Variable      | Effect                        |
|---------------|-------------------------------|
| `NO_COLOR`    | Disables color (any value)    |
| `FORCE_COLOR=0` | Disables color              |
| `FORCE_COLOR=1` | Enables color               |
| TTY detection | Enables color if stdout is a TTY |

## Output Format

```
2026-06-23T10:00:00.000Z LEVEL : MESSAGE WITH HIGHLIGHTS
```

- Timestamp in dim gray
- Level in its respective color, padded to 5 chars
- Interpolated values highlighted in level color