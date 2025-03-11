
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '../../hooks/useGameServer';

interface Dimensions {
    width: number;
    height: number;
    left: number;
    top: number;
}
interface Props {
    left: number;
    top: number;
    onElementDimensions?: (dimensions: Record<string, Dimensions>) => void;
}

const Golf: React.FC<Props> = ({ left, top, onElementDimensions }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const item0Ref = useRef<HTMLDivElement>(null);
    const measurementDone = useRef(false);
    const [activeCommand, setActiveCommand] = useState<string | null>(null);
    const [chainfaces, setChainfaces] = useState<any[]>([]);
    const [rifts, setRifts] = useState<any[]>([]);
    const [currentDimension, setCurrentDimension] = useState<string>('normal');
    
    // Get the game server connection
    const gameServer = useGameServer({});
    const { connected, actors, sendGolfCommand: serverSendGolfCommand } = gameServer;
    
    // Extract chainfaces from actors
    useEffect(() => {
        if (!actors) return;
        
        // Filter actors to get only chainfaces
        const chainFaceActors = actors.filter(actor => (actor as any).type === 'chainface');
        
        // Transform actors to chainface format
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
        
        // Send command to server
        if (serverSendGolfCommand) {
            console.log('Socket is connected, sending command to server');
            serverSendGolfCommand(command);
        } else {
            console.warn('serverSendGolfCommand not available, cannot send command to server');
        }
        
        // Apply dramatic visual effects
        switch(command) {
            case 'quantum-driver':
                // Apply quantum effect to all chainfaces
                setChainfaces(prev => prev.map(face => ({
                    ...face,
                    dimensionalState: 'quantum',
                    probabilityEcho: {
                        position: {
                            x: face.position.x + (Math.random() * 200 - 100),
                            y: face.position.y + (Math.random() * 200 - 100)
                        }
                    }
                })));
                
                // Reset after 3 seconds
                setTimeout(() => {
                    setChainfaces(prev => prev.map(face => ({
                        ...face,
                        dimensionalState: 'normal',
                        probabilityEcho: undefined
                    })));
                }, 3000);
                break;
                
            case 'tesseract-putter':
                // Apply folded effect to all chainfaces
                setChainfaces(prev => prev.map(face => ({
                    ...face,
                    dimensionalState: 'folded'
                })));
                
                // Reset after 3 seconds
                setTimeout(() => {
                    setChainfaces(prev => prev.map(face => ({
                        ...face,
                        dimensionalState: 'normal'
                    })));
                }, 3000);
                break;
                
            case 'time-hazard':
                // Apply timeshifted effect to chainfaces
                setChainfaces(prev => prev.map(face => ({
                    ...face,
                    dimensionalState: Math.random() < 0.5 ? 'timeshifted' : face.dimensionalState
                })));
                
                // Reset after 5 seconds
                setTimeout(() => {
                    setChainfaces(prev => prev.map(face => ({
                        ...face,
                        dimensionalState: face.dimensionalState === 'timeshifted' ? 'normal' : face.dimensionalState
                    })));
                }, 5000);
                break;
                
            case 'non-euclidean-wedge':
            case 'fold-reality':
                // Create multiple rifts
                const numRifts = 3;
                const newRifts: any[] = [];
                
                for (let i = 0; i < numRifts; i++) {
                    newRifts.push({
                        id: `rift-${Date.now()}-${i}`,
                        position: {
                            x: 3250 + Math.random() * 1000,
                            y: 2100 + Math.random() * 500
                        },
                        size: 80 + Math.random() * 100,
                        color: command === 'non-euclidean-wedge'
                            ? `rgba(${Math.floor(Math.random() * 255)}, 0, ${Math.floor(Math.random() * 255)}, 0.5)`
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
                break;
                
            case 'dimensional-shift':
                // Change dimension
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
    
    // Measure elements after they're rendered
    useEffect(() => {
        if (containerRef.current && item0Ref.current && !measurementDone.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const item0Rect = item0Ref.current.getBoundingClientRect();

            const dimensions: Record<string, Dimensions> = {
                item0: {
                    width: item0Rect.width,
                    height: item0Rect.height,
                    left: left + (item0Rect.left - containerRect.left),
                    top: top + (item0Rect.top - containerRect.top)
                },
            };

            onElementDimensions?.(dimensions);
            measurementDone.current = true;
        }
    }, [left, top, onElementDimensions]);
    
    // Handle golf commands
    const handleCommand = useCallback((command: string) => {
        console.log('Golf.tsx: handleCommand called with command:', command);
        console.log('Golf.tsx: serverSendGolfCommand available:', !!serverSendGolfCommand);
        
        setActiveCommand(command);
        
        // Try to send command to server
        if (serverSendGolfCommand) {
            console.log('Golf.tsx: Calling serverSendGolfCommand with command:', command);
            serverSendGolfCommand(command);
        } else {
            console.warn('Golf.tsx: serverSendGolfCommand is not available');
        }
        
        // Apply client-side effects for immediate feedback
        console.log('Golf.tsx: Applying client-side effects for command:', command);
        
        // Reset active command after 2 seconds
        setTimeout(() => {
            setActiveCommand(null);
        }, 2000);
    }, [serverSendGolfCommand]);
    
    // Get color based on dimensional state
    const getStateColor = (state: string): string => {
        switch(state) {
            case 'quantum': return '#00ffff';
            case 'timeshifted': return '#ffff00';
            case 'folded': return '#ff00ff';
            default: return '#ffffff';
        }
    };
    
    // Get dimension name for display
    const getDimensionName = (dimension: string): string => {
        switch(dimension) {
            case 'quantum': return 'Quantum Realm';
            case 'mirror': return 'Mirror Dimension';
            case 'hyperbolic': return 'Hyperbolic Space';
            case 'fractal': return 'Fractal Dimension';
            default: return 'Normal Reality';
        }
    };

    return (
        <div ref={containerRef} style={{
            position: 'absolute',
            left,
            top,
            width: '2000px',
            height: '1100px',
            border: '10px dotted #000',
            background: 'rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
        }}>
            <h2 ref={item0Ref} style={{
                color: '#fff',
                fontSize: '48px',
                textAlign: 'center',
                marginTop: '20px',
                textShadow: '0 0 10px rgba(255, 0, 255, 0.8)'
            }}>Interdimensional Chainface Golf</h2>
            
            {/* Dimension indicator */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: currentDimension === 'quantum' ? '#00ffff' :
                       currentDimension === 'mirror' ? '#ff00ff' :
                       currentDimension === 'hyperbolic' ? '#ffff00' :
                       currentDimension === 'fractal' ? '#00ff00' : '#ffffff',
                borderRadius: '5px',
                border: '1px solid rgba(255, 0, 255, 0.5)',
                fontSize: '16px',
                animation: 'pulse 2s infinite ease-in-out'
            }}>
                {getDimensionName(currentDimension)}
            </div>
            
            {/* Render rifts */}
            {rifts.map((rift: any) => (
                <div
                    key={rift.id}
                    style={{
                        position: 'absolute',
                        width: `${rift.size}px`,
                        height: `${rift.size}px`,
                        borderRadius: '50%',
                        background: `radial-gradient(circle at center, ${rift.color}, transparent 70%)`,
                        animation: 'pulse 2s infinite ease-in-out',
                        pointerEvents: 'none',
                        zIndex: 5,
                        left: rift.position.x,
                        top: rift.position.y
                    }}
                />
            ))}
            
            {/* Render chainfaces */}
            {chainfaces.map((face: any) => (
                <div key={face.id}>
                    <div
                        style={{
                            position: 'absolute',
                            width: `${face.size}px`,
                            height: `${face.size}px`,
                            fontSize: `${face.size * 0.7}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: face.color || '#ffffff',
                            textShadow: '0 0 5px rgba(0, 0, 0, 0.8)',
                            transition: 'all 0.1s linear',
                            zIndex: 2,
                            left: face.position.x,
                            top: face.position.y,
                            opacity: face.dimensionalState === 'quantum' ? 0.7 :
                                    face.dimensionalState === 'timeshifted' ? 0.5 :
                                    face.dimensionalState === 'folded' ? 0.9 : 1,
                            transform: face.dimensionalState === 'folded' ? 'scale(0.8)' : 'scale(1)',
                            filter: face.dimensionalState === 'timeshifted' ? 'blur(1px)' : 'none'
                        }}
                    >
                        {face.face}
                    </div>
                    
                    {/* Render probability echoes for quantum state */}
                    {face.dimensionalState === 'quantum' && face.probabilityEcho && (
                        <div
                            style={{
                                position: 'absolute',
                                width: `${face.size * 0.9}px`,
                                height: `${face.size * 0.9}px`,
                                fontSize: `${face.size * 0.6}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#00ffff',
                                textShadow: '0 0 5px rgba(0, 0, 0, 0.8)',
                                transition: 'all 0.1s linear',
                                zIndex: 2,
                                left: face.probabilityEcho.position.x,
                                top: face.probabilityEcho.position.y,
                                opacity: 0.5
                            }}
                        >
                            {face.face}
                        </div>
                    )}
                </div>
            ))}
            
            {/* Control panel */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px',
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '10px',
                border: '2px solid rgba(255, 0, 255, 0.5)',
                zIndex: 10
            }}>
                {[
                    { id: 'quantum-driver', label: 'Quantum Driver' },
                    { id: 'non-euclidean-wedge', label: 'Non-Euclidean Wedge' },
                    { id: 'tesseract-putter', label: 'Tesseract Putter' },
                    { id: 'fold-reality', label: 'Fold Reality' },
                    { id: 'dimensional-shift', label: 'Dimensional Shift' },
                    { id: 'time-hazard', label: 'Time Hazard' }
                ].map(button => (
                    <button
                        key={button.id}
                        style={{
                            background: activeCommand === button.id ? 'rgba(255, 0, 255, 0.5)' : 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            border: '1px solid rgba(255, 0, 255, 0.5)',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleCommand(button.id)}
                    >
                        {button.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Golf
