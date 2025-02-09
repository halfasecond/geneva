import { useEffect, useRef } from 'react'
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
`

const Title = styled.h2`
  position: absolute;
  margin-top: -20px;
  opacity: 0.4;
  font-size: 14px;  // Bigger font size (was 10px)
  white-space: nowrap;  // Keep on one line
`

const COLORS = [
  '#86c661', // green
  '#04b3e9', // blue
  '#fbee41', // yellow
  '#f58220', // orange
  '#ef4354'  // red
]
const COLUMNS = 20 // Fewer columns for bigger drops
const BASE_DROP_SIZE = 12 // Much bigger drops
const MAX_Y = 50 // Keep drops within container

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

const RainbowPuke: React.FC<RainbowPukeProps> = ({ top, left }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const waterfallRef = useRef(Array(COLUMNS).fill(0).map(() => ({
    y: Math.random() * MAX_Y,
    speed: 0.5 + Math.random() * 1.5,
    size: BASE_DROP_SIZE * (0.8 + Math.random() * 0.4),
    color: getRandomColor()
  })))
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!svgRef.current) return
      
      // Update each column independently
      waterfallRef.current = waterfallRef.current.map(drop => {
        const nextY = drop.y + drop.speed
        if (nextY > MAX_Y) {
          return {
            y: 0,
            speed: 0.5 + Math.random() * 1.5,
            size: BASE_DROP_SIZE * (0.8 + Math.random() * 0.4),
            color: getRandomColor() // New random color when drop resets
          }
        }
        return { ...drop, y: nextY }
      })

      // Update all drops
      const drops = svgRef.current.querySelectorAll('rect')
      drops.forEach((drop, i) => {
        const dropData = waterfallRef.current[i]
        drop.setAttribute('y', String(dropData.y))
        drop.setAttribute('fill', dropData.color)
        // Stretch drops based on speed
        const stretch = 1 + dropData.speed * 0.2
        drop.setAttribute('height', String(dropData.size * stretch))
      })
    }, 16)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div style={{ position: 'absolute', top, left }}>
      <Title>RainbowPuke Falls</Title>
      <Container>
        <svg ref={svgRef} viewBox='0 0 480 64' preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {waterfallRef.current.map((dropData, i) => (
            <rect
              key={i}
              x={i * (480/COLUMNS)}
              y={dropData.y}
              width={dropData.size}
              height={dropData.size * (1 + dropData.speed * 0.2)}
              fill={dropData.color}
              opacity={1} // Full opacity
            />
          ))}
        </svg>
      </Container>
    </div>
  )
}

export default RainbowPuke
