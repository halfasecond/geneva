# Multi-App Setup Guide

This project is configured to build and serve multiple applications from a single codebase. Each app has its own JavaScript entry point, components, and output directory, ensuring complete separation between apps.

## Available Apps

- **Geneva**: The default application (simple "Hello!" message)
- **Purr**: The Purr application
- **Paddock** (chained-horse): The Paddock/Chained Horse application

## Building Apps

Each app can be built into its own directory using hardcoded scripts (suitable for CI/CD and Docker):

```bash
# Build the Geneva app (default)
yarn build

# Build the Purr app
yarn build:purr

# Build the Paddock app
yarn build:paddock

# Build all apps
yarn build:all
```

## Serving Built Apps

After building, you can serve each app using the `serve` package:

```bash
# Serve the Geneva app
yarn serve:geneva

# Serve the Purr app
yarn serve:purr

# Serve the Paddock app
yarn serve:paddock
```

The `-s` flag in the serve command enables SPA (Single Page Application) mode, which redirects all requests to index.html.

## Development

For development, you can run each app in development mode:

```bash
# Run the interactive app selector (prompts for which app to run)
yarn dev

# Run the Geneva app
yarn dev:geneva

# Run the Purr app
yarn dev:purr

# Run the Paddock app
yarn dev:paddock
```

The interactive mode (`yarn dev`) allows you to select which app to run and properly handles Ctrl+C to stop the app.

## Architecture

The project uses a completely separated architecture for each app:

1. **Separate JavaScript Entry Points**: Each app has its own JavaScript entry point:
   - `src/geneva.tsx` for the Geneva app
   - `src/purr.tsx` for the Purr app
   - `src/paddock.tsx` for the Paddock app

2. **App-Specific Components**: Each app has its own root component structure.

3. **Interactive Development**: The default `yarn dev` command prompts you to select which app to run in development mode.

4. **Deterministic Builds**: The build scripts use hardcoded values for predictable builds in CI/CD environments.

5. **Dynamic Entry Point Switching**: The `switch-app.sh` script temporarily replaces the main.tsx file with the appropriate entry point before running the dev or build commands.

6. **Tree Shaking**: The build process only includes the components and code needed for each app, resulting in smaller bundle sizes.

## How It Works

When building or developing an app:

1. The `switch-app.sh` script is called with the app name and command (dev or build)
2. For development, you can use the interactive selector (`yarn dev`) which prompts you to choose an app
3. The script backs up the original main.tsx file
4. It then copies the appropriate entry point (geneva.tsx, purr.tsx, or paddock.tsx) to main.tsx
5. The Vite command is executed with the appropriate environment variables
6. After the command completes, the original main.tsx file is restored
7. For builds, the output is placed in an app-specific directory

This approach works with Vite's default behavior of using index.html and main.tsx as entry points, while still allowing us to have separate apps.

## Server-Side Integration

If you need to run the server alongside the built app, you can use:

```bash
# Start the server with the Purr app
yarn start:purr

# Start the server with the Paddock app
yarn start:paddock
```

These commands build the app and then start the server with the appropriate environment variables.