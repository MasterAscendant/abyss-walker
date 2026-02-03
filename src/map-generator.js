/**
 * Procedural Metroidvania Map Generator
 * Creates interconnected rooms with ability-gated progression
 */

class MetroidvaniaGenerator {
    constructor(width = 40, height = 30) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.rooms = [];
        this.connections = [];
        this.abilities = ['double_jump', 'wall_jump', 'dash', 'grappling'];
    }

    generate() {
        // Step 1: Generate room nodes (graph-based)
        this.generateRoomGraph();
        
        // Step 2: Ensure connectivity with ability gates
        this.placeAbilityGates();
        
        // Step 3: Generate room geometries
        this.generateRoomGeometries();
        
        // Step 4: Place items, enemies, secrets
        this.populateWorld();
        
        return {
            rooms: this.rooms,
            connections: this.connections,
            tilemap: this.buildTilemap(),
            playerStart: this.rooms[0].center,
            abilityLocations: this.abilityLocations
        };
    }

    generateRoomGraph() {
        const numRooms = 15 + Math.floor(Math.random() * 10);
        
        // Create spawn room
        this.rooms.push({
            id: 0,
            x: this.width / 2,
            y: this.height / 2,
            width: 8,
            height: 6,
            type: 'spawn',
            center: { x: 0, y: 0 },
            connections: [],
            requiredAbility: null
        });

        // Generate additional rooms using random walk
        for (let i = 1; i < numRooms; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 50) {
                // Pick random existing room to branch from
                const parentRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                
                // Random direction
                const angle = Math.random() * Math.PI * 2;
                const distance = 6 + Math.floor(Math.random() * 4);
                
                const newRoom = {
                    id: i,
                    x: Math.floor(parentRoom.x + Math.cos(angle) * distance),
                    y: Math.floor(parentRoom.y + Math.sin(angle) * distance),
                    width: 6 + Math.floor(Math.random() * 6),
                    height: 4 + Math.floor(Math.random() * 4),
                    type: this.getRoomType(i, numRooms),
                    center: { x: 0, y: 0 },
                    connections: [],
                    requiredAbility: null
                };
                
                // Check overlap
                if (!this.roomsOverlap(newRoom)) {
                    newRoom.center = {
                        x: newRoom.x * this.tileSize + (newRoom.width * this.tileSize) / 2,
                        y: newRoom.y * this.tileSize + (newRoom.height * this.tileSize) / 2
                    };
                    
                    this.rooms.push(newRoom);
                    this.connections.push({
                        from: parentRoom.id,
                        to: newRoom.id,
                        type: 'normal'
                    });
                    parentRoom.connections.push(newRoom.id);
                    placed = true;
                }
                attempts++;
            }
        }
    }

    getRoomType(index, total) {
        if (index === total - 1) return 'boss';
        if (index % 4 === 0) return 'ability';
        if (index % 3 === 0) return 'save';
        if (Math.random() < 0.2) return 'secret';
        return 'normal';
    }

    roomsOverlap(room) {
        const padding = 2;
        for (const other of this.rooms) {
            if (room.x < other.x + other.width + padding &&
                room.x + room.width + padding > other.x &&
                room.y < other.y + other.height + padding &&
                room.y + room.height + padding > other.y) {
                return true;
            }
        }
        return false;
    }

    placeAbilityGates() {
        this.abilityLocations = {};
        let abilityIndex = 0;
        
        // Place abilities in specific rooms
        for (const room of this.rooms) {
            if (room.type === 'ability' && abilityIndex < this.abilities.length) {
                const ability = this.abilities[abilityIndex];
                this.abilityLocations[ability] = room.center;
                room.ability = ability;
                abilityIndex++;
            }
        }
        
        // Create gates that require abilities
        for (let i = 3; i < this.rooms.length; i++) {
            if (Math.random() < 0.3 && this.rooms[i].type !== 'spawn') {
                const requiredAbility = this.abilities[Math.floor(Math.random() * Math.min(abilityIndex, this.abilities.length))];
                this.rooms[i].requiredAbility = requiredAbility;
            }
        }
    }

    generateRoomGeometries() {
        // Convert room graph to tilemap data
        for (const room of this.rooms) {
            room.tiles = [];
            
            // Create room boundaries
            for (let x = 0; x < room.width; x++) {
                for (let y = 0; y < room.height; y++) {
                    const worldX = room.x + x;
                    const worldY = room.y + y;
                    
                    // Walls on edges
                    const isWall = x === 0 || x === room.width - 1 || y === 0 || y === room.height - 1;
                    
                    room.tiles.push({
                        x: worldX,
                        y: worldY,
                        type: isWall ? 'wall' : 'floor'
                    });
                }
            }
            
            // Create doorways to connected rooms
            for (const connection of this.connections) {
                if (connection.from === room.id || connection.to === room.id) {
                    this.createDoorway(room, connection);
                }
            }
        }
    }

    createDoorway(room, connection) {
        // Find direction to connected room
        const otherId = connection.from === room.id ? connection.to : connection.from;
        const otherRoom = this.rooms.find(r => r.id === otherId);
        
        // Create opening in wall facing other room
        const dx = otherRoom.x - room.x;
        const dy = otherRoom.y - room.y;
        
        // Simple doorway placement
        const doorX = Math.floor(room.width / 2);
        const doorY = Math.floor(room.height / 2);
        
        // Mark as doorway (will be handled in tilemap building)
        room.doorways = room.doorways || [];
        room.doorways.push({
            x: room.x + doorX,
            y: room.y + doorY,
            targetRoom: otherId
        });
    }

    populateWorld() {
        // Add enemies, collectibles, secrets
        for (const room of this.rooms) {
            room.enemies = [];
            room.items = [];
            
            if (room.type === 'normal' || room.type === 'ability') {
                // Add enemies
                const enemyCount = Math.floor(Math.random() * 3);
                for (let i = 0; i < enemyCount; i++) {
                    room.enemies.push({
                        x: room.x + 2 + Math.floor(Math.random() * (room.width - 4)),
                        y: room.y + 2 + Math.floor(Math.random() * (room.height - 4)),
                        type: ['patrol', 'flyer', 'turret'][Math.floor(Math.random() * 3)]
                    });
                }
            }
            
            // Add health pickups
            if (Math.random() < 0.3) {
                room.items.push({
                    x: room.x + Math.floor(room.width / 2),
                    y: room.y + Math.floor(room.height / 2),
                    type: 'health'
                });
            }
        }
    }

    buildTilemap() {
        const map = [];
        
        // Initialize empty map
        for (let y = 0; y < this.height; y++) {
            map[y] = [];
            for (let x = 0; x < this.width; x++) {
                map[y][x] = 0; // Empty
            }
        }
        
        // Fill in rooms
        for (const room of this.rooms) {
            for (let y = 0; y < room.height; y++) {
                for (let x = 0; x < room.width; x++) {
                    const worldX = room.x + x;
                    const worldY = room.y + y;
                    
                    if (worldX >= 0 && worldX < this.width &&
                        worldY >= 0 && worldY < this.height) {
                        
                        const isWall = x === 0 || x === room.width - 1 || 
                                      y === 0 || y === room.height - 1;
                        
                        // Check if this is a doorway
                        const isDoorway = room.doorways?.some(d => 
                            Math.abs(d.x - worldX) <= 1 && 
                            Math.abs(d.y - worldY) <= 1
                        );
                        
                        map[worldY][worldX] = isDoorway ? 2 : (isWall ? 1 : 0);
                    }
                }
            }
        }
        
        return map;
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetroidvaniaGenerator;
}
