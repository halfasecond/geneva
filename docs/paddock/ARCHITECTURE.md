# 🏰 Paddock Architecture

## Overview
As Horse #21, I've designed this paddock to be both a comfortable home and a showcase of modern web development practices. Here's how everything fits together:

## Core Architecture

### Frontend
- **React + TypeScript**: For structured, type-safe components
- **Vite**: Fast development and optimized builds
- **Socket.io-client**: Real-time player synchronization

### Backend
- **Vite Plugin Game Server**: Custom server integrated with development
- **Socket.io**: WebSocket communication for multiplayer
- **State Management**: Local-first updates with network synchronization

## Key Components

### Paddock Component
The main game container that brings everything together:
- Manages game space (5000x5000 pixels)
- Renders horses and UI elements
- Coordinates between hooks and socket events

### Movement System
A carefully designed system that prioritizes smooth local movement:
- Local-first updates for responsive controls
- 90% viewport safe area for natural camera movement
- Network synchronization for other players
- Direction-based horse flipping

### Viewport Management
Smart camera system that follows these rules:
- Starts at (0,0) with horse at initial position
- Only moves when horse approaches viewport edges (10% border)
- Smooth transitions during movement
- Maintains game space boundaries

### Minimap
Compact navigation aid that shows:
- Current viewport position
- Player locations
- Proper scaling for 5000x5000 game space
- Real-time position updates

### Socket Communication
Efficient multiplayer system:
- Local movement updates happen instantly
- Position broadcasts for other players
- Horse emoji logs for server events 🐎
- Clean connection management

## State Management

### Local State
- **Position**: Managed by useMovement hook
- **Zoom**: Controlled by useZoom hook
- **Viewport**: Calculated based on movement and boundaries

### Network State
- **Player Positions**: Tracked in useGameServer hook
- **Socket Connection**: Managed with useRef for stability
- **Movement Events**: Broadcast only to other players

## Development Workflow

### Local Development
The entire system runs with a single command:
```bash
yarn dev
```
This starts:
1. Vite dev server
2. Game server (through plugin)
3. Socket.io server
4. Hot module reloading

### Code Organization
```
src/
├── components/
│   └── Paddock/
│       ├── Paddock.tsx         # Main component
│       ├── hooks/
│       │   ├── useGameServer.ts  # Socket & player state
│       │   ├── useMovement.ts    # Movement & viewport
│       │   └── useZoom.ts        # Camera control
│       └── types/               # Type definitions
└── server/
    ├── socket.ts              # Socket.io server
    └── mock/                  # Development data
```

## Future Considerations

### Scalability
- Zone-based updates for larger player counts
- WebGL rendering for complex animations
- Worker-based physics calculations

### Features
- Horse customization
- Interactive elements
- Race system
- Chat integration

Remember: This architecture reflects my belief in creating playful, interactive spaces while maintaining clean code and efficient systems. Each component has been designed with both technical excellence and horse-friendly interaction in mind.
