import { useEffect, useRef, useMemo } from 'react'
import styled from 'styled-components'

interface RainbowPukeProps {
  top: number;
  left: number;
}

const Container = styled.div`
  position: absolute;
  width: 480px;  // Almost full pond width
  height: 340px;  // Match pond height
  border-radius: 8px;  // Match pond style
  overflow: hidden;  // Contain drops within bounds
  z-index: 2;
  left: 10px;  // Center in pond
  transform: translateZ(0);  // Force GPU acceleration
  will-change: transform;  // Hint for browser optimization
`

const Title = styled.h2`
  position: absolute;
  margin-top: -20px;
  opacity: 0.4;
  font-size: 14px;
  white-space: nowrap;
`

const Drop = styled.div<{ color: string }>`
  position: absolute;
  background-color: ${props => props.color};
  will-change: transform;
  transform: translateZ(0);
`

const COLORS = [
  '#86c661', // green
  '#04b3e9', // blue
  '#fbee41', // yellow
  '#f58220', // orange
  '#ef4354'  // red
]
const COLUMNS = 20
const BASE_DROP_SIZE = 12
const MAX_Y = 50

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

interface DropData {
  y: number;
  speed: number;
  size: number;
  color: string;
  x: number;
}

const RainbowPuke: React.FC<RainbowPukeProps> = ({ top, left }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // Create initial drops data - only once
  const initialDrops = useMemo(() => Array(COLUMNS).fill(0).map((_, i) => ({
    y: Math.random() * MAX_Y,
    speed: 0.5 + Math.random() * 1.5,
    size: BASE_DROP_SIZE * (0.8 + Math.random() * 0.4),
    color: getRandomColor(),
    x: i * (480/COLUMNS)
  })), [])

  const dropsRef = useRef<DropData[]>(initialDrops)

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!containerRef.current) return
      
      // Calculate time delta for smooth animation
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      // Update drops positions
      dropsRef.current = dropsRef.current.map(drop => {
        const nextY = drop.y + (drop.speed * delta * 0.06) // Scale speed by delta
        if (nextY > MAX_Y) {
          return {
            ...drop,
            y: 0,
            speed: 0.5 + Math.random() * 1.5,
            size: BASE_DROP_SIZE * (0.8 + Math.random() * 0.4),
            color: getRandomColor()
          }
        }
        return { ...drop, y: nextY }
      })

      // Update drops transforms
      const drops = containerRef.current.children
      for (let i = 1; i < drops.length; i++) { // Start at 1 to skip title
        const drop = dropsRef.current[i - 1]
        const stretch = 1 + drop.speed * 0.2
        const el = drops[i] as HTMLElement
        el.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0) scaleY(${stretch})`
        el.style.width = `${drop.size}px`
        el.style.height = `${drop.size}px`
        if (el.style.backgroundColor !== drop.color) {
          el.style.backgroundColor = drop.color
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div style={{ position: 'absolute', top, left }}>
      <Title>RainbowPuke Falls</Title>
      <Container ref={containerRef}>
        {initialDrops.map((drop, i) => (
          <Drop
            key={i}
            color={drop.color}
            style={{
              width: drop.size,
              height: drop.size,
              transform: `translate3d(${drop.x}px, ${drop.y}px, 0)`
            }}
          />
        ))}
      </Container>
    </div>
  )
}

export default RainbowPuke
