# Paddock Component Performance Guide

This document outlines key performance patterns and considerations used in the Paddock component and its associated hooks.

## Performance Patterns

### 1. Using Refs to Break Dependency Cycles

When a value needs to be tracked but shouldn't trigger re-renders, use refs instead of state:

```typescript
// Instead of just state:
const [position, setPosition] = useState(initialPosition)

// Use both state and ref:
const positionRef = useRef(initialPosition)
const [position, setPosition] = useState(initialPosition)

// Keep ref in sync with state:
positionRef.current = position
```

This pattern is used in both `useMovement` and `useZoom` to prevent unnecessary re-renders while maintaining access to current values.

### 2. Separating Calculations from State Updates

Extract pure calculations into separate functions to avoid recalculating in render cycles:

```typescript
// Pure calculation function
const isValidPosition = useCallback((x: number, y: number, direction: 'left' | 'right'): boolean => {
    // Collision checks and validation logic
    return result
}, [dependencies])

// Use in effect
if (isValidPosition(x, y, direction)) {
    setPosition({ x, y, direction })
}
```

### 3. Value Comparison Before Updates

Always check if values have actually changed before updating state:

```typescript
if (newX !== currentX || newY !== currentY) {
    setPosition({ x: newX, y: newY })
}
```

### 4. Animation Performance

For smooth animations:
- Use `requestAnimationFrame` instead of setInterval
- Combine transforms for GPU acceleration
- Update styles directly when possible
- Use `will-change` hint judiciously

```typescript
const animate = (timestamp: number) => {
    // Calculate based on timestamp for smooth motion
    const delta = timestamp - lastTimeRef.current
    
    // Update directly for performance
    if (elementRef.current) {
        elementRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    animationFrameId = requestAnimationFrame(animate)
}
```

### 5. Minimizing Effect Dependencies

Only include dependencies that should actually trigger updates:

```typescript
// Instead of depending on whole objects
useEffect(() => {
    // Effect code
}, [position, viewportOffset]) // 🚫 Might cause unnecessary updates

// Depend on specific values
useEffect(() => {
    // Effect code
}, [position.x, position.y, viewportOffset.x, viewportOffset.y]) // ✅ More precise
```

## Common Issues and Solutions

### Maximum Update Depth Exceeded

This error occurs when state updates trigger effects that cause more state updates in an infinite loop. Solutions:

1. Use refs for values that shouldn't trigger updates
2. Separate state updates from calculations
3. Add value comparison checks before setState
4. Use `requestAnimationFrame` for animation updates

### Performance Degradation

If performance degrades over time:

1. Check for growing arrays or objects
2. Ensure animations are properly cancelled in cleanup
3. Use `useCallback` for event handlers
4. Profile component updates using React DevTools

## Implementation Examples

See `useMovement.ts` and `useZoom.ts` for practical implementations of these patterns:

- `useMovement`: Handles player position, collision detection, and viewport updates
- `useZoom`: Manages zoom level and origin point calculations

Both hooks demonstrate how to handle complex state interactions while maintaining performance through careful state management and animation optimization.