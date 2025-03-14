#!/bin/bash

# This script switches the main.tsx file to the appropriate entry point
# Usage: ./switch-app.sh [app-name] [command]
# Example: ./switch-app.sh purr dev
# If no app name is provided, it will prompt for one

# Function to prompt for app selection
select_app() {
  echo "Select an app to run:"
  echo "1) Geneva (default)"
  echo "2) Purr"
  echo "3) Paddock (chained-horse)"
  read -p "Enter your choice [1-3]: " choice
  
  case $choice in
    1)
      echo "geneva"
      ;;
    2)
      echo "purr"
      ;;
    3)
      echo "chained-horse"
      ;;
    *)
      echo "geneva"
      ;;
  esac
}

# Function to validate app name
validate_app() {
  local app=$1
  if [ "$app" != "purr" ] && [ "$app" != "chained-horse" ] && [ "$app" != "geneva" ]; then
    echo "Error: Invalid app name. Must be 'purr', 'chained-horse', or 'geneva'"
    exit 1
  fi
}

# Function to validate command
validate_command() {
  local cmd=$1
  if [ "$cmd" != "dev" ] && [ "$cmd" != "build" ]; then
    echo "Error: Invalid command. Must be 'dev' or 'build'"
    exit 1
  fi
}

# Check if app name is provided
if [ -z "$1" ] || [ "$1" = "dev" ] || [ "$1" = "build" ]; then
  # Interactive mode
  echo "Running in interactive mode"
  APP_NAME=$(select_app)
  
  # If $1 is a command, use it, otherwise default to dev
  if [ "$1" = "dev" ] || [ "$1" = "build" ]; then
    COMMAND="$1"
  else
    COMMAND="dev"
  fi
  
  echo "Selected app: $APP_NAME"
  echo "Command: $COMMAND"
else
  APP_NAME=$1
  validate_app "$APP_NAME"
  
  # Check if command is provided
  if [ -z "$2" ]; then
    echo "Error: Command is required"
    echo "Usage: ./switch-app.sh [app-name] [command]"
    echo "Example: ./switch-app.sh purr dev"
    exit 1
  else
    COMMAND=$2
    validate_command "$COMMAND"
  fi
fi

# Determine source file and output directory
if [ "$APP_NAME" == "purr" ]; then
  SOURCE_FILE="src/purr.tsx"
  OUTPUT_DIR="dist/purr"
elif [ "$APP_NAME" == "chained-horse" ]; then
  SOURCE_FILE="src/paddock.tsx"
  OUTPUT_DIR="dist/paddock"
else
  SOURCE_FILE="src/geneva.tsx"
  OUTPUT_DIR="dist/geneva"
fi

# Backup the original main.tsx if it doesn't exist
if [ ! -f "src/main.tsx.orig" ]; then
  echo "Backing up original main.tsx to main.tsx.orig"
  cp src/main.tsx src/main.tsx.orig
fi

# Copy the appropriate entry point to main.tsx
echo "Switching to $APP_NAME app"
cp $SOURCE_FILE src/main.tsx
echo "Copied $SOURCE_FILE to src/main.tsx"

# Run the command
if [ "$COMMAND" == "dev" ]; then
  echo "Starting development server for $APP_NAME"
  VITE_APP=$APP_NAME yarn vite
elif [ "$COMMAND" == "build" ]; then
  echo "Building $APP_NAME"
  rm -rf $OUTPUT_DIR
  VITE_APP=$APP_NAME VITE_APP_NODE_ENV=production yarn vite build --outDir $OUTPUT_DIR
fi

# Restore the original main.tsx
echo "Restoring original main.tsx"
cp src/main.tsx.orig src/main.tsx