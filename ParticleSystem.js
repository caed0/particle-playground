class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.particles = [];
        this.connections = new Connections(this.connectionSettings);

        this.frameTimes = [];
        this.lastTime = 0;

        this.settings = {
            initialParticles: 100, // Initial number of particles
            initialSpawnPositions: ['random'],
            clearCanvas: true,
            showDebugInfo: true,
            dynamicAdjustment: {
                autoSpawn: true, // Automatically spawn particles
                autoDestroy: true, // Automatically destroy particles
                minParticles: 50, // Minimum number of particles
                maxParticles: 200, // Maximum number of particles
                adjustmentInterval: 100 // Interval in milliseconds to adjust particle count
            },
        
            backgroundSettings: {
                type: 'color',           // 'color' or 'gradient'
                color: '#070016ff',        // Solid background color
                gradient: {
                    type: 'linear',      // 'linear' or 'radial'
                    direction: 'vertical', // 'horizontal', 'vertical', 'diagonal'
                    colors: [
                        { stop: 0, color: '#1a1a2e' },
                        { stop: 0.5, color: '#000511ff' },
                        { stop: 1, color: '#000103ff' }
                    ]
                }
            }
        };

        this.particleSettings = {
            appearance: { 
                size: { min: 8, max: 8 }, 
                color: '#00ff40', 
                opacity: 1,
                shape: 'circle', 
                shadow: { 
                    enabled: true, 
                    color: '#00FF41', 
                    radius: 5 
                },
                fading: { 
                    enabled: true, 
                    fadeInTime: 1, 
                    fadeOutTime: 1 
                },
            },
            behaviour: {
                movement: {
                    enabled: true,
                    speed: { min: 75, max: 150 }, 
                    direction: 'random' 
                },
                spawning: {
                    spawnPositions: ['random'],
                    spawningOffset: { x: -100, y: -100 },
                    spawnGrid: { columns: 30, rows: 30 },
                    respawn: true
                },
                ttl: { 
                    enabled: false,
                    min: 5, 
                    max: 10 
                },
                bounceOffEdges: true,
                bounceOffParticles: true
            }
        }

        this.connectionSettings = {
            enabled: false,
            distance: 125, // Maximum distance for connections
            maxConnections: 3, // Maximum number of connections per particle
            appearance: {
                color: '#00ff40',
                opacity: 1,
                lineWidth: 2,
                lineStyle: 'double', // 'solid', 'dashed', 'dotted', or 'double'
                shadow: { 
                    enabled: true, 
                    color: '#00ff40', 
                    radius: 8 
                }
            },
        }

        this.particleInteractionSettings = {
            enabled: true,
            attraction: { force: 200, radius: 130 }, // Force strength for particle attraction
            repulsion: { force: 140, radius: 35 },  // Force strength for particle repulsion
            mode: 'attract' // 'attract', 'repel', or 'both'
        };

        this.mouseInteractionSettings = {
            spawn: {
                enabled: true,
                amount: 5, // Number of particles to spawn per interaction
                continuous: true, // Whether to spawn particles continuously while dragging
                delay: 40, // Minimum time between spawns in milliseconds
            },
        };
        
        // Mouse interaction setup
        this.setupMouseInteraction();
    }

    setupMouseInteraction() {
        let isMousePressed = false;
        let lastSpawnTime = 0;

        this.canvas.addEventListener('mousedown', (event) => {
            isMousePressed = true;
            this.spawnParticlesAtMouse(event);
        });

        this.canvas.addEventListener('mouseup', () => {
            isMousePressed = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isMousePressed = false;
        });

        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.mouseInteractionSettings.spawn.continuous || !isMousePressed) return;
            const time = Date.now();
            if (time - lastSpawnTime < this.mouseInteractionSettings.spawn.delay) return;
            this.spawnParticlesAtMouse(event);
            lastSpawnTime = time;
        });

        // Prevent context menu on right click for better UX
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    spawnParticlesAtMouse(event) {
            if (!this.mouseInteractionSettings.spawn.enabled) return;

            // Get canvas bounding rectangle to convert screen coordinates to canvas coordinates
            const rect = this.canvas.getBoundingClientRect();
            const position = { x: event.clientX - rect.left, y: event.clientY - rect.top };

            // Add particles at the mouse position
            for (let i = 0; i < this.mouseInteractionSettings.spawn.amount; i++) {
                this.addParticle({ position });
            }
    }

    addParticle(settingsOverride) {
        // Override spawn positions
        let newSettings = this.particleSettings;
        if (settingsOverride.spawnPositions && settingsOverride.spawnPositions.length > 0) {
            newSettings = structuredClone(this.particleSettings);
            newSettings.behaviour.spawning.spawnPositions = settingsOverride.spawnPositions;
        }

        const particle = new Particle(newSettings, this.canvas);

        // Override position
        if (settingsOverride.position) {
            particle.x = settingsOverride.position.x;
            particle.y = settingsOverride.position.y;
        }

        this.particles.push(particle);
    }

    updateParticles(deltaTime) {
        // Apply particle-to-particle interactions first
        if (this.particleInteractionSettings.enabled) {
            this.applyParticleInteractions(deltaTime);
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Clean up destroyed particles
            if (particle.state === 'destroyed') {
                this.particles.splice(i, 1);
                continue;
            }

            particle.update(this.particleSettings, deltaTime, this.particles);
        }
    }

    applyParticleInteractions(deltaTime) {
        const settings = this.particleInteractionSettings;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particleA = this.particles[i];
            
            for (let j = i + 1; j < this.particles.length; j++) {
                const particleB = this.particles[j];
                
                // Skip if either particle is dead
                if (particleA.isDead || particleB.isDead) continue;
                
                // Calculate distance between particles
                const dx = particleB.x - particleA.x;
                const dy = particleB.y - particleA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Skip if particles are too far apart
                if (distance > settings.attraction.radius || distance < 1) continue;
                
                // Normalize direction vector
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                
                let forceStrength = 0;
                let forceDirection = 1; // 1 for attraction, -1 for repulsion
                
                // Determine force type based on distance and mode
                if (distance <= settings.repulsion.radius && (settings.mode === 'repel' || settings.mode === 'both')) {
                    // Repulsion - particles push away from each other
                    forceStrength = settings.repulsion.force * (1 - distance / settings.repulsion.radius);
                    forceDirection = -1;
                } else if (distance > settings.repulsion.radius && distance <= settings.attraction.radius && (settings.mode === 'attract' || settings.mode === 'both')) {
                    // Attraction - particles pull toward each other
                    const attractionStrength = (distance - settings.repulsion.radius) / (settings.attraction.radius - settings.repulsion.radius);
                    forceStrength = settings.attraction.force * (1 - attractionStrength);
                    forceDirection = 1;
                }
                
                if (forceStrength > 0) {
                    // Apply opacity-based force scaling - weaker forces when particles are fading
                    const opacityFactor = particleA.life * particleB.life;
                    
                    // Apply force to both particles (Newton's third law)
                    const forceX = normalizedDx * forceStrength * forceDirection * deltaTime * opacityFactor;
                    const forceY = normalizedDy * forceStrength * forceDirection * deltaTime * opacityFactor;
                    
                    // Apply force to particle A (away from or toward B)
                    particleA.vx -= forceX;
                    particleA.vy -= forceY;
                    
                    // Apply equal and opposite force to particle B
                    particleB.vx += forceX;
                    particleB.vy += forceY;
                    
                    // Update directions and speeds
                    particleA.direction = Math.atan2(particleA.vy, particleA.vx);
                    particleA.speed = Math.sqrt(particleA.vx * particleA.vx + particleA.vy * particleA.vy);
                    
                    particleB.direction = Math.atan2(particleB.vy, particleB.vx);
                    particleB.speed = Math.sqrt(particleB.vx * particleB.vx + particleB.vy * particleB.vy);
                }
            }
        }
    }

    drawParticles(deltaTime) {
        this.updateParticles(deltaTime);
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }
    }

    drawConnections() {
        this.connections.update(this.particles, this.connectionSettings);
        this.connections.draw(this.ctx);
    }

    drawBackground() {
        this.ctx.save();
        
        if (this.settings.backgroundSettings.type === 'color') {
            // Solid color background
            this.ctx.fillStyle = this.settings.backgroundSettings.color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.settings.backgroundSettings.type === 'gradient') {
            // Gradient background
            const gradient = this.createGradient();
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.ctx.restore();
    }

    createGradient() {
        const settings = this.settings.backgroundSettings.gradient;
        let gradient;
        
        if (settings.type === 'linear') {
            // Create linear gradient based on direction
            let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
            
            switch (settings.direction) {
                case 'horizontal':
                    x1 = this.canvas.width;
                    break;
                case 'vertical':
                    y1 = this.canvas.height;
                    break;
                case 'diagonal':
                    x1 = this.canvas.width;
                    y1 = this.canvas.height;
                    break;
                case 'diagonal-reverse':
                    x0 = this.canvas.width;
                    y1 = this.canvas.height;
                    break;
                default:
                    y1 = this.canvas.height; // Default to vertical
                    break;
            }
            
            gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
        } else if (settings.type === 'radial') {
            // Create radial gradient from center
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const radius = Math.max(this.canvas.width, this.canvas.height) / 2;
            
            gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        }
        
        // Add color stops
        if (gradient) {
            settings.colors.forEach(colorStop => {
                gradient.addColorStop(colorStop.stop, colorStop.color);
            });
        }
        
        return gradient;
    }

    drawDebugInfo() {
        this.ctx.save();
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Average FPS: ${this.fps || 0}`, 10, 10);
        this.ctx.fillText(`Min Particles: ${this.settings.dynamicAdjustment.minParticles}`, 10, 30);
        this.ctx.fillText(`Max Particles: ${this.settings.dynamicAdjustment.maxParticles}`, 10, 50);
        this.ctx.fillText(`Current Particles: ${this.particles.length}`, 10, 70);
        this.ctx.restore();
    }

    animate(currentTime = 0) {
        // Delta time calculation
        if (this.lastTime === 0) this.lastTime = currentTime;
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // FPS Calculation
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 30) this.frameTimes.shift(); 
        this.fps = Math.round(1 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length));

        // Draw
        if (this.settings.clearCanvas) this.drawBackground();
        this.drawConnections();
        this.drawParticles(deltaTime);
        if (this.settings.showDebugInfo) this.drawDebugInfo();

        // Request next frame
        requestAnimationFrame((time) => this.animate(time));
    }

    init() {
        this.drawBackground();
        this.animate();

        // Initial particle spawning
        for (let i = 0; i < this.settings.initialParticles; i++) {
            this.addParticle({ spawnPositions: this.settings.initialSpawnPositions });
        }

        // Automatically adjust particle count
        setInterval(() => {
            // Automatically spawn particles if particle count is below max
            if (this.settings.dynamicAdjustment.autoSpawn) {
                const spawnAmount = this.settings.dynamicAdjustment.minParticles - this.particles.length;
                for (let i = 0; i < spawnAmount; i++) {
                    this.addParticle();
                }
            }
            
            // Automatically destroy particles if above max
            if (
                this.settings.dynamicAdjustment.autoDestroy && 
                (this.particleSettings.behaviour.spawning.respawn || 
                (!this.particleSettings.behaviour.ttl.enabled &&
                !this.particleSettings.behaviour.bounceOffEdges))
            ) {
                const destroyAmount = this.particles.filter(p => p.state !== 'destroyed' && p.state !== 'destroying').length - this.settings.dynamicAdjustment.maxParticles;
                for (let i = 0; i < destroyAmount; i++) {
                    const particle = this.particles[Math.floor(Math.random() * this.particles.length)];
                    particle.state = 'destroying';
                    particle.diedAt = Date.now();
                }
            }
        }, this.settings.dynamicAdjustment.adjustmentInterval);
    }
}