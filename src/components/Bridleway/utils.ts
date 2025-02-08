import { PathSegment } from './set'

interface BoundingBox {
  left: number
  right: number
  top: number
  bottom: number
}

export const doOverlap = (horse: BoundingBox, path: PathSegment['safeZone']) => {
  if (!path) return false
  return !(
    horse.left >= path.right || 
    horse.top >= path.bottom || 
    horse.right <= path.left || 
    horse.bottom <= path.top
  )
}

export const isOnPath = (horse: BoundingBox, paths: PathSegment[]) => 
  paths.some(path => path.safeZone && doOverlap(horse, path.safeZone))

// Adjust padding to be more balanced between top and bottom
export const getSafeZone = (path: PathSegment) => ({
  left: path.left + 90,
  right: path.left + path.width - 90,
  top: path.top + 85,  // Changed from 80 to 85
  bottom: path.top + path.height - 85  // Changed from 90 to 85
})