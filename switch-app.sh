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
  echo "4) Kitty.International"
  echo "5) Barcode"
  echo "6) Aquarium"
  echo "7) Flowbots"
  echo "8) Elite (three.js web3)"
  echo "9) kitty.family"
  read -p "Enter your choice [1-9]: " choice
  
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
    4)
      echo "kitty.international"
      ;;
    5)
      echo "barcode"
      ;;
    6)
      echo "aquarium"
      ;;
    7)
      echo "flowbots"
      ;;
    8)
      echo "elite"
      ;;
    9)
      echo "kittyFamily"
      ;;
    *)
      echo "geneva"
      ;;
  esac
}

# Function to validate app name
validate_app() {
  local app=$1
  if [ "$app" != "purr" ] && [ "$app" != "chained-horse" ] && [ "$app" != "geneva" ] && [ "$app" != "kittyInternational" ] && [ "$app" != "kittyFamily" ] && [ "$app" != "barcode" ] && [ "$app" != "aquarium" ] && [ "$app" != "flowbots" ] && [ "$app" != "elite" ]; then
    echo "Error: Invalid app name. Must be a valid module"
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
  SOURCE_FILE="src/lib/entry/purr.tsx"
  OUTPUT_DIR="dist/purr"
elif [ "$APP_NAME" == "chained-horse" ]; then
  SOURCE_FILE="src/lib/entry/paddock.tsx"
  OUTPUT_DIR="dist/paddock"
elif [ "$APP_NAME" == "kittyInternational" ]; then
  SOURCE_FILE="src/lib/entry/kittyInternational.tsx"
  OUTPUT_DIR="dist/kittyInternational"
elif [ "$APP_NAME" == "barcode" ]; then
  SOURCE_FILE="src/lib/entry/barcode.tsx"
  OUTPUT_DIR="dist/barcode"
elif [ "$APP_NAME" == "aquarium" ]; then
  SOURCE_FILE="src/lib/entry/aquarium.tsx"
  OUTPUT_DIR="dist/aquarium"
elif [ "$APP_NAME" == "flowbots" ]; then
  SOURCE_FILE="src/lib/entry/flowbots.tsx"
  OUTPUT_DIR="dist/flowbots"
elif [ "$APP_NAME" == "elite" ]; then
  SOURCE_FILE="src/lib/entry/elite.tsx"
  OUTPUT_DIR="dist/elite"
elif [ "$APP_NAME" == "kittyFamily" ]; then
  SOURCE_FILE="src/lib/entry/kittyFamily.tsx"
  OUTPUT_DIR="dist/kittyFamily"
else
  SOURCE_FILE="src/lib/entry/geneva.tsx"
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