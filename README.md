# Personal Projects

This is a monorepo containing my personal projects.

## Structure

```
.
├── apps/
│   └── game-server/    # Multiplayer Uno game server
└── package.json        # Workspace configuration
```

## Getting Started

### Game Server

To run the game server:

```bash
# Install dependencies
npm install

# Development mode
npm run dev:game-server

# Build
npm run build:game-server

# Production
npm run start:game-server
```

For more information about the game server, see [apps/game-server/README.md](apps/game-server/README.md).

## Workspace Commands

```bash
# Run linting across all projects
npm run lint

# Format code across all projects
npm run format

# Run all checks across all projects
npm run check
```

## Git Hooks (Husky)

This project uses Husky for Git hooks to maintain code quality:

- **pre-commit**: Runs `lint-staged` to format and lint only staged files
- **pre-push**: Runs full lint and build checks before pushing

### Setup

If Git is not initialized yet:

```bash
# Initialize Git repository
git init

# Install dependencies (this will set up Husky via the 'prepare' script)
npm install

# Verify Husky setup
./verify-husky.sh
```

For more details, see [HUSKY_SETUP.md](HUSKY_SETUP.md).

