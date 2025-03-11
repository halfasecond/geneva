import { useEffect, useState, useCallback } from 'react';
import { useGameServer } from './useGameServer';

// Define types with 'any' to avoid TypeScript errors
interface ChainFace {
  id: number;
  position: any;
  size: number;
  color: string;
  face: string;
  dimensionalState: string;
  dimensionalEnergy: number;
  probabilityEcho?: any;
}

interface Rift {
  id: string;
  position: any;
  size: number;
  color: string;
  type: string;
  duration: number;
}

interface GolfState {
  chainfaces: ChainFace[];
  rifts: Rift[];
  currentDimension: string;
  sendGolfCommand: (command: string) => void;
}

export function useGolf(): GolfState {
  // Game state
  const [chainfaces, setChainfaces] = useState<ChainFace[]>([]);
  const [rifts, setRifts] = useState<Rift[]>([]);
  const [currentDimension, setCurrentDimension] = useState<string>('normal');
  
  // Get the game server connection (only call useGameServer once)
  const gameServer = useGameServer({});
  const { connected, actors, sendGolfCommand: serverSendGolfCommand } = gameServer;
  
  // Extract chainfaces from actors
  useEffect(() => {
    if (!actors) return;
    
    // Filter actors to get only chainfaces
    const chainFaceActors = actors.filter(actor => (actor as any).type === 'chainface');
    
    // Transform actors to ChainFace format
    const transformedChainfaces = chainFaceActors.map(actor => ({
      id: actor.id,
      position: actor.position,
      size: actor.size || 40,
      color: '#ffffff', // Default color
      face: String(actor.id), // Use ID as face for now
      dimensionalState: 'normal',
      dimensionalEnergy: 0
    }));
    
    setChainfaces(transformedChainfaces);
  }, [actors]);
  
  // Function to send golf commands
  const sendGolfCommand = useCallback((command: string) => {
    console.log('Sending golf command:', command);
    
    // Make the command more dramatic by applying multiple effects
    const applyDramaticEffects = () => {
      // Apply more dramatic visual effects
      switch(command) {
        case 'quantum-driver':
          // Apply quantum effect to all chainfaces
          setChainfaces(prev => prev.map(face => ({
            ...face,
            dimensionalState: 'quantum',
            probabilityEcho: {
              position: {
                x: face.position.x + (Math.random() * 200 - 100), // More dramatic shift
                y: face.position.y + (Math.random() * 200 - 100)  // More dramatic shift
              }
            }
          })));
          break;
          
        case 'tesseract-putter':
          // Apply folded effect to all chainfaces
          setChainfaces(prev => prev.map(face => ({
            ...face,
            dimensionalState: 'folded'
          })));
          break;
          
        case 'time-hazard':
          // Apply timeshifted effect to more chainfaces
          setChainfaces(prev => prev.map(face => ({
            ...face,
            dimensionalState: Math.random() < 0.5 ? 'timeshifted' : face.dimensionalState // 50% chance instead of 30%
          })));
          break;
      }
      
      // Create multiple rifts for more visual impact
      if (command === 'non-euclidean-wedge' || command === 'fold-reality') {
        const numRifts = 3; // Create multiple rifts
        const newRifts: Rift[] = [];
        
        for (let i = 0; i < numRifts; i++) {
          newRifts.push({
            id: `rift-${Date.now()}-${i}`,
            position: {
              x: 3250 + Math.random() * 1000,
              y: 2100 + Math.random() * 500
            },
            size: 80 + Math.random() * 100, // Larger rifts
            color: command === 'non-euclidean-wedge'
              ? `rgba(${Math.floor(Math.random() * 255)}, 0, ${Math.floor(Math.random() * 255)}, 0.5)` // Random colors
              : `rgba(0, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`,
            type: 'wormhole',
            duration: 5000
          });
        }
        
        setRifts(prev => [...prev, ...newRifts]);
        
        // Remove rifts after duration
        setTimeout(() => {
          setRifts(prev => prev.filter(r => !newRifts.some(nr => nr.id === r.id)));
        }, 5000);
      }
    };
    
    // Send command to server using the provided function
    if (serverSendGolfCommand) {
      console.log('useGolf: Sending command to server via serverSendGolfCommand:', command);
      console.log('useGolf: serverSendGolfCommand type:', typeof serverSendGolfCommand);
      try {
        serverSendGolfCommand(command);
        console.log('useGolf: Command sent successfully');
      } catch (error) {
        console.error('useGolf: Error sending command:', error);
      }
    } else {
      console.warn('useGolf: serverSendGolfCommand not available, using client-side effects only');
    }
    
    // Always apply dramatic effects for immediate feedback
    applyDramaticEffects();
    
    // Add reset timers for visual effects
    switch(command) {
      case 'quantum-driver':
        // Reset quantum effects after 3 seconds
        setTimeout(() => {
          setChainfaces(prev => prev.map(face => ({
            ...face,
            dimensionalState: 'normal',
            probabilityEcho: undefined
          })));
        }, 3000);
        break;
        
      case 'tesseract-putter':
        // Reset folded effect after 3 seconds
        setTimeout(() => {
          setChainfaces(prev => prev.map(face => ({
            ...face,
            dimensionalState: 'normal'
          })));
        }, 3000);
        break;
        
      case 'time-hazard':
        // Reset timeshifted effect after 5 seconds
        setTimeout(() => {
          setChainfaces(prev => prev.map(face => ({
            ...face,
            dimensionalState: face.dimensionalState === 'timeshifted' ? 'normal' : face.dimensionalState
          })));
        }, 5000);
        break;
        
      case 'dimensional-shift':
        // Change dimension for visual feedback
        const dimensions = ['quantum', 'mirror', 'hyperbolic', 'fractal'];
        const newDimension = dimensions[Math.floor(Math.random() * dimensions.length)];
        setCurrentDimension(newDimension);
        
        // Reset dimension after 10 seconds
        setTimeout(() => {
          setCurrentDimension('normal');
        }, 10000);
        break;
    }
  }, [serverSendGolfCommand]);
  
  return {
    chainfaces,
    rifts,
    currentDimension,
    sendGolfCommand
  };
}