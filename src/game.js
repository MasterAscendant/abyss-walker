/**
 * Abyss Walker - Main Game Scene
 * Procedural Metroidvania with Physics, Combat, and Exploration
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentRoom = 0;
        this.rooms = [];
        this.mapData = null;
    }

    preload() {
        // Generate placeholder textures programmatically
        this.generatePlaceholderTextures();
    }

    generatePlaceholderTextures() {
        // Player texture (32x32 cyan square)
        const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        playerGfx.fillStyle(0x00ffff, 1);
        playerGfx.fillRect(0, 0, 32, 32);
        playerGfx.generateTexture('player', 32, 32);

        // Wall texture (32x32 dark gray)
        const wallGfx = this.make.graphics({ x: 0, y: 0, add: false });
        wallGfx.fillStyle(0x333333, 1);
        wallGfx.fillRect(0, 0, 32, 32);
        wallGfx.lineStyle(2, 0x555555, 1);
        wallGfx.strokeRect(0, 0, 32, 32);
        wallGfx.generateTexture('wall', 32, 32);

        // Floor texture (32x32 darker)
        const floorGfx = this.make.graphics({ x: 0, y: 0, add: false });
        floorGfx.fillStyle(0x1a1a1a, 1);
        floorGfx.fillRect(0, 0, 32, 32);
        floorGfx.generateTexture('floor', 32, 32);

        // Enemy texture (red diamond)
        const enemyGfx = this.make.graphics({ x: 0, y: 0, add: false });
        enemyGfx.fillStyle(0xff4444, 1);
        enemyGfx.beginPath();
        enemyGfx.moveTo(16, 0);
        enemyGfx.lineTo(32, 16);
        enemyGfx.lineTo(16, 32);
        enemyGfx.lineTo(0, 16);
        enemyGfx.closePath();
        enemyGfx.fillPath();
        enemyGfx.generateTexture('enemy', 32, 32);

        // Ability pickup (golden star)
        const abilityGfx = this.make.graphics({ x: 0, y: 0, add: false });
        abilityGfx.fillStyle(0xffd700, 1);
        abilityGfx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const radius = i % 2 === 0 ? 16 : 8;
            const x = 16 + Math.cos(angle) * radius;
            const y = 16 + Math.sin(angle) * radius;
            if (i === 0) abilityGfx.moveTo(x, y);
            else abilityGfx.lineTo(x, y);
        }
        abilityGfx.closePath();
        abilityGfx.fillPath();
        abilityGfx.generateTexture('ability', 32, 32);

        // Health pickup (green heart)
        const healthGfx = this.make.graphics({ x: 0, y: 0, add: false });
        healthGfx.fillStyle(0x44ff44, 1);
        healthGfx.beginPath();
        healthGfx.moveTo(16, 28);
        healthGfx.bezierCurveTo(0, 18, 0, 0, 16, 8);
        healthGfx.bezierCurveTo(32, 0, 32, 18, 16, 28);
        healthGfx.closePath();
        healthGfx.fillPath();
        healthGfx.generateTexture('health', 32, 32);

        // Particle texture
        const particleGfx = this.make.graphics({ x: 0, y: 0, add: false });
        particleGfx.fillStyle(0x00ffff, 0.8);
        particleGfx.fillCircle(4, 4, 4);
        particleGfx.generateTexture('particle', 8, 8);
    }

    create() {
        // Initialize physics world
        this.physics.world.setBounds(0, 0, 2000, 2000);
        this.physics.world.gravity.y = 800;

        // Generate the world
        this.generateWorld();

        // Create player
        const startRoom = this.rooms[0];
        this.player = new PlayerController(this, startRoom.center.x, startRoom.center.y);

        // Setup camera
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBackgroundColor('#0a0a0a');

        // Setup collisions
        this.setupCollisions();

        // Create UI
        this.createUI();

        // Input for world regeneration
        document.getElementById('generate-btn')?.addEventListener('click', () => {
            this.regenerateWorld();
        });

        // Particle effects
        this.createParticleEffects();

        // Enemy AI group
        this.enemies = [];
        this.spawnEnemies();

        // Room transition tracking
        this.setupRoomTransitions();
    }

    generateWorld() {
        // Clean up existing world
        if (this.walls) this.walls.clear(true, true);
        if (this.floor) this.floor.clear(true, true);
        if (this.items) this.items.clear(true, true);

        // Generate new map
        const generator = new MetroidvaniaGenerator(60, 40);
        this.mapData = generator.generate();
        this.rooms = this.mapData.rooms;

        // Create tilemap from generated data
        this.createTilemap();
    }

    createTilemap() {
        // Create static groups for tiles
        this.walls = this.physics.add.staticGroup();
        this.floor = this.add.group();
        this.items = this.physics.add.group();
        this.abilities = this.physics.add.group();

        const tileSize = 32;

        // Build walls from room data
        for (const room of this.rooms) {
            for (let y = 0; y < room.height; y++) {
                for (let x = 0; x < room.width; x++) {
                    const worldX = (room.x + x) * tileSize;
                    const worldY = (room.y + y) * tileSize;

                    const isWall = x === 0 || x === room.width - 1 || 
                                  y === 0 || y === room.height - 1;

                    // Check if doorway
                    let isDoorway = false;
                    if (room.doorways) {
                        for (const door of room.doorways) {
                            const dx = Math.abs(door.x - (room.x + x));
                            const dy = Math.abs(door.y - (room.y + y));
                            if (dx <= 1 && dy <= 1) {
                                isDoorway = true;
                                break;
                            }
                        }
                    }

                    if (isWall && !isDoorway) {
                        const wall = this.walls.create(worldX + tileSize/2, worldY + tileSize/2, 'wall');
                        wall.setImmovable(true);
                        wall.body.setSize(tileSize, tileSize);
                    } else {
                        // Floor
                        this.floor.create(worldX + tileSize/2, worldY + tileSize/2, 'floor');
                    }
                }
            }

            // Spawn items in room
            if (room.items) {
                for (const item of room.items) {
                    const worldX = item.x * tileSize + tileSize/2;
                    const worldY = item.y * tileSize + tileSize/2;
                    
                    if (item.type === 'health') {
                        const health = this.items.create(worldX, worldY, 'health');
                        health.setCircle(12);
                        health.body.setAllowGravity(false);
                    }
                }
            }

            // Spawn ability pickups
            if (room.ability) {
                const worldX = room.center.x * tileSize;
                const worldY = room.center.y * tileSize;
                const ability = this.abilities.create(worldX, worldY, 'ability');
                ability.abilityType = room.ability;
                ability.body.setAllowGravity(false);
                
                // Floating animation
                this.tweens.add({
                    targets: ability,
                    y: worldY - 10,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Sort floor tiles by Y for proper depth
        this.floor.children.entries.sort((a, b) => a.y - b.y);
    }

    setupCollisions() {
        // Player vs walls
        this.physics.add.collider(this.player.sprite, this.walls);

        // Player vs items
        this.physics.add.overlap(this.player.sprite, this.items, (player, item) => {
            this.collectItem(item);
        });

        // Player vs abilities
        this.physics.add.overlap(this.player.sprite, this.abilities, (player, ability) => {
            this.collectAbility(ability);
        });

        // Player vs enemies (handled in enemy update)
    }

    spawnEnemies() {
        // Clear existing enemies
        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];

        const tileSize = 32;

        for (const room of this.rooms) {
            if (room.enemies) {
                for (const enemyData of room.enemies) {
                    const worldX = enemyData.x * tileSize + tileSize/2;
                    const worldY = enemyData.y * tileSize + tileSize/2;
                    
                    const enemy = this.physics.add.sprite(worldX, worldY, 'enemy');
                    enemy.setCircle(12);
                    enemy.setBounce(0.5);
                    enemy.setCollideWorldBounds(true);
                    
                    // Enemy properties
                    enemy.enemyType = enemyData.type;
                    enemy.hp = 2;
                    enemy.patrolDistance = 100;
                    enemy.startX = worldX;
                    
                    // Collide with walls
                    this.physics.add.collider(enemy, this.walls);
                    
                    this.enemies.push(enemy);
                }
            }
        }
    }

    createUI() {
        // Health bar
        this.healthText = this.add.text(20, 20, 'HP: 3', {
            fontSize: '24px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        });
        this.healthText.setScrollFactor(0);
        this.healthText.setDepth(100);

        // Ability indicator
        this.abilityText = this.add.text(20, 50, 'Abilities:', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        this.abilityText.setScrollFactor(0);
        this.abilityText.setDepth(100);

        // Room indicator
        this.roomText = this.add.text(20, 80, 'Room: 1', {
            fontSize: '16px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        });
        this.roomText.setScrollFactor(0);
        this.roomText.setDepth(100);
    }

    createParticleEffects() {
        // Jump particles
        this.jumpParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 150 },
            angle: { min: 200, max: 340 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            gravityY: 200,
            emitting: false
        });

        // Collect particles
        this.collectParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: 30, max: 80 },
            scale: { start: 1.5, end: 0 },
            lifespan: 500,
            tint: [0x44ff44, 0xffff44, 0x44ffff],
            emitting: false
        });
    }

    setupRoomTransitions() {
        // Track which room player is in
        this.currentRoom = 0;
    }

    update() {
        // Update player
        this.player.update();

        // Update enemies
        this.updateEnemies();

        // Update room tracking
        this.updateRoomTracking();

        // Update UI
        this.updateUI();

        // Check for dash particles
        if (this.player.isDashing) {
            this.createDashTrail();
        }
    }

    updateEnemies() {
        const player = this.player.sprite;

        for (const enemy of this.enemies) {
            if (!enemy.active) continue;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, player.x, player.y
            );

            switch (enemy.enemyType) {
                case 'patrol':
                    // Simple patrol behavior
                    if (!enemy.patrolDirection) enemy.patrolDirection = 1;
                    
                    const patrolDist = Math.abs(enemy.x - enemy.startX);
                    if (patrolDist > enemy.patrolDistance) {
                        enemy.patrolDirection *= -1;
                    }
                    
                    enemy.setVelocityX(50 * enemy.patrolDirection);
                    
                    // Chase if close
                    if (dist < 150) {
                        const angle = Phaser.Math.Angle.Between(
                            enemy.x, enemy.y, player.x, player.y
                        );
                        enemy.setVelocityX(Math.cos(angle) * 100);
                    }
                    break;

                case 'flyer':
                    // Flying enemy - moves toward player
                    if (dist < 200) {
                        const angle = Phaser.Math.Angle.Between(
                            enemy.x, enemy.y, player.x, player.y
                        );
                        enemy.setVelocity(
                            Math.cos(angle) * 80,
                            Math.sin(angle) * 80
                        );
                    }
                    break;

                case 'turret':
                    // Stationary, tracks player
                    if (dist < 300) {
                        // Could shoot projectiles here
                    }
                    break;
            }

            // Damage player on contact
            if (dist < 30 && !this.player.invulnerable) {
                this.damagePlayer(1);
            }
        }
    }

    updateRoomTracking() {
        const playerPos = this.player.sprite;
        const tileSize = 32;

        // Find which room player is in
        for (let i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const roomPixelX = room.x * tileSize;
            const roomPixelY = room.y * tileSize;
            const roomPixelW = room.width * tileSize;
            const roomPixelH = room.height * tileSize;

            if (playerPos.x >= roomPixelX && playerPos.x <= roomPixelX + roomPixelW &&
                playerPos.y >= roomPixelY && playerPos.y <= roomPixelY + roomPixelH) {
                if (this.currentRoom !== i) {
                    this.currentRoom = i;
                    this.onRoomEnter(room);
                }
                break;
            }
        }
    }

    onRoomEnter(room) {
        // Room entry effects
        console.log('Entered room:', room.id, room.type);
        
        if (room.type === 'boss') {
            this.cameras.main.shake(200, 0.01);
        }
    }

    updateUI() {
        // Update abilities list
        const unlocked = Object.entries(this.player.abilities)
            .filter(([_, v]) => v)
            .map(([k, _]) => k.replace('_', ' '))
            .join(', ');
        
        this.abilityText.setText('Abilities: ' + (unlocked || 'none'));
        this.roomText.setText(`Room: ${this.currentRoom + 1} / ${this.rooms.length}`);
    }

    collectItem(item) {
        // Heal player
        this.collectParticles.emitParticleAt(item.x, item.y, 10);
        item.destroy();
        
        // Flash effect
        this.cameras.main.flash(100, 0x44ff44, 0.3);
    }

    collectAbility(ability) {
        const abilityType = ability.abilityType;
        
        this.player.unlockAbility(abilityType);
        
        // Effects
        this.collectParticles.emitParticleAt(ability.x, ability.y, 20);
        ability.destroy();
        
        // Screen flash
        this.cameras.main.flash(500, 100, 200, 255);
        
        // Show notification
        this.showNotification(`UNLOCKED: ${abilityType.replace('_', ' ').toUpperCase()}`);
    }

    damagePlayer(amount) {
        // Invulnerability frames
        this.player.invulnerable = true;
        this.player.sprite.setAlpha(0.5);
        
        // Knockback
        const knockbackDir = this.player.sprite.x > this.player.sprite.x ? 1 : -1;
        this.player.sprite.setVelocityX(knockbackDir * 200);
        this.player.sprite.setVelocityY(-200);
        
        // Screen shake
        this.cameras.main.shake(200, 0.02);
        
        // Reset invulnerability
        this.time.delayedCall(1000, () => {
            this.player.invulnerable = false;
            this.player.sprite.setAlpha(1);
        });
    }

    showNotification(text) {
        const notif = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            text,
            {
                fontSize: '32px',
                fill: '#4a9eff',
                fontFamily: 'monospace',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        this.tweens.add({
            targets: notif,
            y: notif.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => notif.destroy()
        });
    }

    createDashTrail() {
        if (this.time.now % 3 === 0) {
            const trail = this.add.image(
                this.player.sprite.x,
                this.player.sprite.y,
                'player'
            );
            trail.setAlpha(0.5);
            trail.setScale(0.8);
            
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
        }
    }

    regenerateWorld() {
        // Fade out
        this.cameras.main.fade(500, 0, 0, 0);
        
        this.time.delayedCall(500, () => {
            // Reset player
            this.player.sprite.setPosition(0, 0);
            this.player.abilities = {
                double_jump: false,
                wall_jump: false,
                dash: false,
                grappling: false
            };
            
            // Generate new world
            this.generateWorld();
            
            // Respawn player at start
            const startRoom = this.rooms[0];
            this.player.sprite.setPosition(startRoom.center.x, startRoom.center.y);
            
            // Respawn enemies
            this.spawnEnemies();
            
            // Fade in
            this.cameras.main.fadeIn(500);
        });
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0a0a0a',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Phaser.Game(config);
});
