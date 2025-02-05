# GitHub Scripts Reference

## Available Commands

### Adding Labels
```bash
yarn github:labels <issue-number> <label1> [label2...]
```
Example:
```bash
yarn github:labels 15 agent:horse21 reporter:horse21
```

### Managing Projects
```bash
yarn github:project <issue-number> <project-number>
```
Example:
```bash
yarn github:project 15 1  # Adds issue #15 to project #1
```

## Project IDs
- Project #1: Main Paddock Development Board
