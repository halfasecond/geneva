import { Namespace } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Vector2D {
    x: number;
    y: number;
}

interface ChainFace {
    id: number;
    position: Vector2D;
    velocity: Vector2D;
    size: number;
    color: string;
    face: string;
    dimensionalState: 'normal' | 'quantum' | 'timeshifted' | 'folded';
    dimensionalEnergy: number;
    probabilityEcho?: {
        position: Vector2D;
        velocity: Vector2D;
    };
}

interface Rift {
    id: string;
    position: Vector2D;
    size: number;
    color: string;
    type: string;
    duration: number;
}

interface GolfState {
    chainfaces: ChainFace[];
    rifts: Rift[];
    currentDimension: string;
    lastUpdate: number;
}

// Constants
const GOLF_AREA = {
    left: 3250,
    top: 2100,
    width: 2000,
    height: 1100
};

const DIMENSIONS = ['normal', 'quantum', 'mirror', 'hyperbolic', 'fractal'];

// Helper functions
const calculateDistance = (a: Vector2D, b: Vector2D): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
};

const limitToGolfArea = (position: Vector2D): Vector2D => {
    return {
        x: Math.max(GOLF_AREA.left, Math.min(GOLF_AREA.left + GOLF_AREA.width, position.x)),
        y: Math.max(GOLF_AREA.top, Math.min(GOLF_AREA.top + GOLF_AREA.height, position.y))
    };
};

const getRandomColor = (): string => {
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000', '#0000ff'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Main class
export class InterdimensionalGolf {
    private namespace: Namespace;
    private state: GolfState;
    private updateInterval: NodeJS.Timeout | null = null;
    private db: any;

    constructor(namespace: Namespace, db: any) {
        this.namespace = namespace;
        this.db = db;
        this.state = {
            chainfaces: [],
            rifts: [],
            currentDimension: 'normal',
            lastUpdate: Date.now()
        };

        // Initialize with chainfaces from the database
        this.initializeChainfaces();
    }

    // Initialize chainfaces from the database
    private async initializeChainfaces() {
        try {
            const chainfaces = await this.db.collection('cf_nfts').aggregate([{ $sample: { size: 50 } }]).toArray();
            
            this.state.chainfaces = chainfaces.map((cf: any, index: number) => {
                // Position chainfaces in a grid pattern within the golf area
                const cols = 10;
                const rows = 5;
                const colSpacing = GOLF_AREA.width / cols;
                const rowSpacing = GOLF_AREA.height / rows;
                
                const col = index % cols;
                const row = Math.floor(index / cols) % rows;
                
                const x = GOLF_AREA.left + colSpacing * col + Math.random() * 50;
                const y = GOLF_AREA.top + rowSpacing * row + Math.random() * 50;
                
                return {
                    id: cf.tokenId || index,
                    position: { x, y },
                    velocity: { 
                        x: (Math.random() * 2 - 1) * 0.5, 
                        y: (Math.random() * 2 - 1) * 0.5 
                    },
                    size: 40 + Math.random() * 20,
                    color: getRandomColor(),
                    face: cf.face || '😐',
                    dimensionalState: 'normal',
                    dimensionalEnergy: 0
                };
            });
            
            console.log(`🔗 Initialized ${this.state.chainfaces.length} Chainfaces for Golf`);
            
            // Start the update loop
            this.startUpdateLoop();
        } catch (error) {
            console.error('Error initializing chainfaces:', error);
        }
    }

    // Start the update loop
    private startUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.update();
            this.broadcastState();
        }, 50); // 20 updates per second
    }

    // Stop the update loop
    public stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Update the game state
    private update() {
        const now = Date.now();
        const deltaTime = (now - this.state.lastUpdate) / 1000; // Convert to seconds
        this.state.lastUpdate = now;
        
        // Update rifts
        this.updateRifts(deltaTime);
        
        // Update chainfaces based on the current dimension
        this.updateChainfaces(deltaTime);
        
        // Check for spontaneous rift creation
        this.checkForRiftCreation();
    }

    // Update all chainfaces
    private updateChainfaces(deltaTime: number) {
        const chainfaces = this.state.chainfaces;
        
        // Apply flocking behavior
        chainfaces.forEach(face => {
            // Skip if in time loop
            if (face.dimensionalState === 'timeshifted') return;
            
            // Calculate flocking forces
            const separation = this.calculateSeparation(face);
            const alignment = this.calculateAlignment(face);
            const cohesion = this.calculateCohesion(face);
            
            // Apply dimension-specific modifications
            let speedFactor = 1.0;
            let controlFactor = 1.0;
            
            switch(this.state.currentDimension) {
                case 'quantum':
                    // Random teleportation chance
                    if (Math.random() < 0.01) {
                        face.position.x += (Math.random() * 100 - 50);
                        face.position.y += (Math.random() * 100 - 50);
                    }
                    break;
                case 'mirror':
                    // Reverse velocities occasionally
                    if (Math.random() < 0.05) {
                        face.velocity.x *= -1;
                        face.velocity.y *= -1;
                    }
                    break;
                case 'hyperbolic':
                    // Faster movement but less control
                    speedFactor = 1.5;
                    controlFactor = 0.7;
                    break;
                case 'fractal':
                    // More cohesion, less separation
                    cohesion.x *= 2;
                    cohesion.y *= 2;
                    separation.x *= 0.5;
                    separation.y *= 0.5;
                    break;
            }
            
            // Update velocity based on flocking forces
            face.velocity.x += (separation.x + alignment.x + cohesion.x) * controlFactor * deltaTime;
            face.velocity.y += (separation.y + alignment.y + cohesion.y) * controlFactor * deltaTime;
            
            // Limit velocity
            const speed = Math.sqrt(face.velocity.x * face.velocity.x + face.velocity.y * face.velocity.y);
            const maxSpeed = 30 * speedFactor;
            
            if (speed > maxSpeed) {
                face.velocity.x = (face.velocity.x / speed) * maxSpeed;
                face.velocity.y = (face.velocity.y / speed) * maxSpeed;
            }
            
            // Update position
            face.position.x += face.velocity.x * deltaTime;
            face.position.y += face.velocity.y * deltaTime;
            
            // Keep within golf area
            face.position = limitToGolfArea(face.position);
            
            // Update probability echo if in quantum state
            if (face.dimensionalState === 'quantum' && face.probabilityEcho) {
                face.probabilityEcho.position.x += face.probabilityEcho.velocity.x * deltaTime;
                face.probabilityEcho.position.y += face.probabilityEcho.velocity.y * deltaTime;
                face.probabilityEcho.position = limitToGolfArea(face.probabilityEcho.position);
            }
        });
    }

    // Calculate separation force for flocking
    private calculateSeparation(face: ChainFace): Vector2D {
        const desiredDistance = 50; // Minimum distance between chainfaces
        let force = { x: 0, y: 0 };
        let count = 0;
        
        this.state.chainfaces.forEach(other => {
            if (other.id === face.id) return;
            
            const distance = calculateDistance(face.position, other.position);
            
            if (distance < desiredDistance && distance > 0) {
                // Calculate vector pointing away from neighbor
                let dx = face.position.x - other.position.x;
                let dy = face.position.y - other.position.y;
                
                // Weight by distance (closer = stronger force)
                dx /= distance;
                dy /= distance;
                
                force.x += dx;
                force.y += dy;
                count++;
            }
        });
        
        // Average
        if (count > 0) {
            force.x /= count;
            force.y /= count;
            
            // Normalize
            const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
            if (magnitude > 0) {
                force.x /= magnitude;
                force.y /= magnitude;
            }
        }
        
        return force;
    }

    // Calculate alignment force for flocking
    private calculateAlignment(face: ChainFace): Vector2D {
        const neighborDistance = 100;
        let force = { x: 0, y: 0 };
        let count = 0;
        
        this.state.chainfaces.forEach(other => {
            if (other.id === face.id) return;
            
            const distance = calculateDistance(face.position, other.position);
            
            if (distance < neighborDistance) {
                force.x += other.velocity.x;
                force.y += other.velocity.y;
                count++;
            }
        });
        
        // Average
        if (count > 0) {
            force.x /= count;
            force.y /= count;
            
            // Normalize
            const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
            if (magnitude > 0) {
                force.x /= magnitude;
                force.y /= magnitude;
            }
        }
        
        return force;
    }

    // Calculate cohesion force for flocking
    private calculateCohesion(face: ChainFace): Vector2D {
        const neighborDistance = 150;
        let sum = { x: 0, y: 0 };
        let count = 0;
        
        this.state.chainfaces.forEach(other => {
            if (other.id === face.id) return;
            
            const distance = calculateDistance(face.position, other.position);
            
            if (distance < neighborDistance) {
                sum.x += other.position.x;
                sum.y += other.position.y;
                count++;
            }
        });
        
        if (count > 0) {
            sum.x /= count;
            sum.y /= count;
            
            // Create vector pointing toward center
            const desired = {
                x: sum.x - face.position.x,
                y: sum.y - face.position.y
            };
            
            // Normalize
            const magnitude = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
            if (magnitude > 0) {
                desired.x /= magnitude;
                desired.y /= magnitude;
            }
            
            return desired;
        }
        
        return { x: 0, y: 0 };
    }

    // Update rifts
    private updateRifts(deltaTime: number) {
        // Update rift durations and remove expired rifts
        this.state.rifts = this.state.rifts.filter(rift => {
            rift.duration -= deltaTime * 1000;
            return rift.duration > 0;
        });
        
        // Check for chainfaces interacting with rifts
        this.state.chainfaces.forEach(face => {
            this.state.rifts.forEach(rift => {
                const distance = calculateDistance(face.position, rift.position);
                
                if (distance < rift.size / 2) {
                    this.applyRiftEffect(face, rift);
                }
            });
        });
    }

    // Apply rift effect to a chainface
    private applyRiftEffect(face: ChainFace, rift: Rift) {
        switch(rift.type) {
            case 'teleport':
                // Teleport to random location within golf area
                face.position = {
                    x: GOLF_AREA.left + Math.random() * GOLF_AREA.width,
                    y: GOLF_AREA.top + Math.random() * GOLF_AREA.height
                };
                break;
                
            case 'physics':
                // Reverse velocity
                face.velocity.x *= -1;
                face.velocity.y *= -1;
                break;
                
            case 'wormhole':
                // Find exit wormhole and teleport there
                const exit = this.state.rifts.find(r => r.type === 'wormhole-exit');
                if (exit) {
                    face.position = { ...exit.position };
                    face.dimensionalEnergy += 10;
                }
                break;
                
            case 'quantum':
                // Change to quantum state temporarily
                face.dimensionalState = 'quantum';
                // Create a probability echo
                if (!face.probabilityEcho) {
                    face.probabilityEcho = {
                        position: { ...face.position },
                        velocity: {
                            x: face.velocity.x * (0.8 + Math.random() * 0.4),
                            y: face.velocity.y * (0.8 + Math.random() * 0.4)
                        }
                    };
                }
                // Reset after 5 seconds
                setTimeout(() => {
                    if (face.dimensionalState === 'quantum') {
                        face.dimensionalState = 'normal';
                        face.probabilityEcho = undefined;
                    }
                }, 5000);
                break;
        }
    }

    // Check for spontaneous rift creation
    private checkForRiftCreation() {
        // Calculate swarm density
        const density = this.calculateSwarmDensity();
        
        // Create rifts when density exceeds threshold and with random chance
        if (density > 0.7 && Math.random() < 0.01) {
            const center = this.calculateCenterOfMass();
            const riftType = ['teleport', 'physics', 'quantum', 'wormhole'][Math.floor(Math.random() * 4)];
            const riftSize = 50 + Math.random() * 100;
            
            this.createRift(center, riftSize, riftType);
            
            // If wormhole, create an exit
            if (riftType === 'wormhole') {
                const exitPosition = {
                    x: GOLF_AREA.left + Math.random() * GOLF_AREA.width,
                    y: GOLF_AREA.top + Math.random() * GOLF_AREA.height
                };
                this.createRift(exitPosition, riftSize * 0.8, 'wormhole-exit');
            }
        }
    }

    // Create a rift
    private createRift(position: Vector2D, size: number, type: string) {
        const rift: Rift = {
            id: uuidv4(),
            position: { ...position },
            size,
            color: getRandomColor(),
            type,
            duration: 5000 + Math.random() * 5000
        };
        
        this.state.rifts.push(rift);
    }

    // Calculate center of mass of the swarm
    private calculateCenterOfMass(): Vector2D {
        let sumX = 0, sumY = 0;
        
        this.state.chainfaces.forEach(face => {
            sumX += face.position.x;
            sumY += face.position.y;
        });
        
        return {
            x: sumX / this.state.chainfaces.length,
            y: sumY / this.state.chainfaces.length
        };
    }

    // Calculate swarm density
    private calculateSwarmDensity(): number {
        const center = this.calculateCenterOfMass();
        let totalDistance = 0;
        
        this.state.chainfaces.forEach(face => {
            const distance = calculateDistance(face.position, center);
            totalDistance += distance;
        });
        
        const averageDistance = totalDistance / this.state.chainfaces.length;
        // Normalize to 0-1 range (smaller distance = higher density)
        return Math.max(0, Math.min(1, 1 - (averageDistance / 500)));
    }

    // Handle golf commands
    public handleCommand(command: string) {
        switch(command) {
            case 'quantum-driver':
                this.splitQuantumProbabilities();
                break;
                
            case 'non-euclidean-wedge':
                this.bendSpacetime();
                break;
                
            case 'tesseract-putter':
                this.enable4DMovement();
                break;
                
            case 'fold-reality':
                this.foldCourseLayout();
                break;
                
            case 'dimensional-shift':
                this.shiftDimension();
                break;
                
            case 'time-hazard':
                this.createTimeLoop();
                break;
        }
    }

    // Command: Split quantum probabilities
    private splitQuantumProbabilities() {
        // Create probability echoes of each Chainface
        this.state.chainfaces.forEach(face => {
            if (!face.probabilityEcho) {
                face.dimensionalState = 'quantum';
                face.probabilityEcho = {
                    position: { ...face.position },
                    velocity: {
                        x: face.velocity.x * (0.8 + Math.random() * 0.4),
                        y: face.velocity.y * (0.8 + Math.random() * 0.4)
                    }
                };
            }
        });
        
        // After 5 seconds, collapse the quantum state
        setTimeout(() => {
            this.state.chainfaces.forEach(face => {
                if (face.probabilityEcho) {
                    // 50% chance to keep original, 50% to keep echo
                    if (Math.random() > 0.5) {
                        face.position = { ...face.probabilityEcho.position };
                        face.velocity = { ...face.probabilityEcho.velocity };
                    }
                    face.probabilityEcho = undefined;
                    face.dimensionalState = 'normal';
                }
            });
        }, 5000);
    }

    // Command: Bend spacetime
    private bendSpacetime() {
        const centerOfMass = this.calculateCenterOfMass();
        
        // Create a wormhole rift
        this.createRift(centerOfMass, 100, 'wormhole');
        
        // Create exit point
        const exitPosition = {
            x: GOLF_AREA.left + Math.random() * GOLF_AREA.width,
            y: GOLF_AREA.top + Math.random() * GOLF_AREA.height
        };
        
        this.createRift(exitPosition, 80, 'wormhole-exit');
    }

    // Command: Enable 4D movement
    private enable4DMovement() {
        // Allow Chainfaces to move through obstacles temporarily
        this.state.chainfaces.forEach(face => {
            face.dimensionalState = 'folded';
        });
        
        // Return to normal after 3 seconds
        setTimeout(() => {
            this.state.chainfaces.forEach(face => {
                face.dimensionalState = 'normal';
            });
        }, 3000);
    }

    // Command: Fold course layout
    private foldCourseLayout() {
        // Create multiple rifts that connect different parts of the course
        const numRifts = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numRifts; i++) {
            const position1 = {
                x: GOLF_AREA.left + Math.random() * GOLF_AREA.width,
                y: GOLF_AREA.top + Math.random() * GOLF_AREA.height
            };
            
            const position2 = {
                x: GOLF_AREA.left + Math.random() * GOLF_AREA.width,
                y: GOLF_AREA.top + Math.random() * GOLF_AREA.height
            };
            
            this.createRift(position1, 70, 'wormhole');
            this.createRift(position2, 70, 'wormhole-exit');
        }
    }

    // Command: Shift dimension
    private shiftDimension() {
        // Change to a random dimension other than current
        let newDimension;
        do {
            newDimension = DIMENSIONS[Math.floor(Math.random() * DIMENSIONS.length)];
        } while (newDimension === this.state.currentDimension);
        
        this.state.currentDimension = newDimension;
        
        // Return to normal dimension after 10 seconds
        setTimeout(() => {
            this.state.currentDimension = 'normal';
        }, 10000);
    }

    // Command: Create time loop
    private createTimeLoop() {
        // Record positions for 3 seconds
        const positionHistory: Record<number, Array<{time: number, position: Vector2D}>> = {};
        
        this.state.chainfaces.forEach(face => {
            positionHistory[face.id] = [];
        });
        
        const recordInterval = setInterval(() => {
            this.state.chainfaces.forEach(face => {
                positionHistory[face.id].push({
                    time: Date.now(),
                    position: { ...face.position }
                });
            });
        }, 100);
        
        // After 3 seconds, start the time loop
        setTimeout(() => {
            clearInterval(recordInterval);
            
            // Select random chainfaces to get caught in time loop
            const loopedFaces = new Set(
                this.state.chainfaces
                    .filter(() => Math.random() < 0.3) // 30% of chainfaces get caught
                    .map(face => face.id)
            );
            
            // Apply time loop for 5 seconds
            const startTime = Date.now();
            const loopDuration = 5000;
            const historyDuration = 3000;
            
            const timeLoopInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) % historyDuration;
                
                this.state.chainfaces.forEach(face => {
                    if (loopedFaces.has(face.id)) {
                        face.dimensionalState = 'timeshifted';
                        
                        // Find closest recorded position
                        const history = positionHistory[face.id];
                        const historyPoint = history.find(point => 
                            Math.abs(point.time - (startTime + elapsed)) < 150
                        );
                        
                        if (historyPoint) {
                            face.position = { ...historyPoint.position };
                        }
                    }
                });
                
                if (Date.now() - startTime > loopDuration) {
                    clearInterval(timeLoopInterval);
                    this.state.chainfaces.forEach(face => {
                        if (face.dimensionalState === 'timeshifted') {
                            face.dimensionalState = 'normal';
                        }
                    });
                }
            }, 100);
        }, 3000);
    }

    // Broadcast the current state to all clients
    private broadcastState() {
        this.namespace.emit('golf:state', {
            chainfaces: this.state.chainfaces.map(face => ({
                id: face.id,
                position: face.position,
                size: face.size,
                color: face.color,
                face: face.face,
                dimensionalState: face.dimensionalState,
                dimensionalEnergy: face.dimensionalEnergy,
                probabilityEcho: face.probabilityEcho ? {
                    position: face.probabilityEcho.position
                } : undefined
            })),
            rifts: this.state.rifts,
            dimension: this.state.currentDimension
        });
    }

    // Get the current state
    public getState() {
        return {
            chainfaces: this.state.chainfaces.map(face => ({
                id: face.id,
                position: face.position,
                size: face.size,
                color: face.color,
                face: face.face,
                dimensionalState: face.dimensionalState,
                dimensionalEnergy: face.dimensionalEnergy,
                probabilityEcho: face.probabilityEcho ? {
                    position: face.probabilityEcho.position
                } : undefined
            })),
            rifts: this.state.rifts,
            dimension: this.state.currentDimension
        };
    }
}