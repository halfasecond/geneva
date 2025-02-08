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