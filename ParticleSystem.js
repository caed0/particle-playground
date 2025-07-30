class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.particles = [];
        this.dying = 0;
        this.connections = new Connections(this.connectionSettings);

        this.frameTimes = [];
        this.lastTime = 0;

        this.settings = {
            maxParticles: 100,
            spawnAmount: 10,
            spawnedTTL: { min: 10, max: 15 },
            clearCanvas: true,
            showDebugInfo: true,
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
                    fadeInTime: 0.50, 
                    fadeOutTime: 0.25 
                },
            },
            behaviour: {
                movement: {
                    enabled: true,
                    speed: { min: 150, max: 250 }, 
                    direction: 'random' 
                },
                spawning: {
                    autospawn: true, // Automatically spawn particles with init
                    initialSpawnPosition: ['random'],
                    spawningOffset: { x: -100, y: -100 },
                    spawnGrid: { columns: 30, rows: 30 },
                    respawn: {
                        enabled: true, // Enable respawning of particles
                        respawnPositions: ['random']
                    }
                },
                ttl: { 
                    enabled: true,
                    min: 5, 
                    max: 10 
                },
                bounceOffEdges: false,
                bounceOffParticles: true
            }
        }

        this.connectionSettings = {
            enabled: true,
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
            attraction: { force: 75, radius: 130 }, // Force strength for particle attraction
            repulsion: { force: 140, radius: 35 },  // Force strength for particle repulsion
            mode: 'both' // 'attract', 'repel', or 'both'
        };
        
        // Mouse interaction setup
        this.setupMouseInteraction();
    }

    setupMouseInteraction() {
        this.canvas.addEventListener('click', (event) => {
            for (let i = 0; i < this.settings.spawnAmount; i++) {
                // Get canvas bounding rectangle to convert screen coordinates to canvas coordinates
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                // Use the addParticleAt method for consistency
                this.addParticleAt(x, y);
            }
        });
        
        // Prevent context menu on right click for better UX
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    addParticle() {
        if (this.particles.length >= this.settings.maxParticles) return;

        const particle = new Particle(this.particleSettings, this.canvas);
        this.particles.push(particle);
    }

    addParticleAt(x, y) {
        const particle = new Particle({...this.particleSettings, ttl: this.settings.spawnedTTL}, this.canvas);
        particle.x = x;
        particle.y = y;
        this.particles.push(particle);
        return true; // Indicate successful spawn
    }

    updateParticles(deltaTime) {
        // Apply particle-to-particle interactions first
        if (this.particleInteractionSettings.enabled) {
            this.applyParticleInteractions(deltaTime);
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(this.particleSettings, this.canvas, deltaTime, this.particles, this.settings.maxParticles);

            if (particle.isDestroyed) {
                this.particles.splice(i, 1);
            }
            if (this.particleSettings.behaviour.ttl.min === 0 && this.particleSettings.behaviour.ttl.max === 0 && this.particleSettings.bounceOffEdges) {
                this.dying--;
            }
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
                    const opacityFactor = particleA.opacity * particleB.opacity;
                    
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
        this.ctx.fillText(`FPS: ${this.fps || 0}`, 10, 10);
        this.ctx.fillText(`Particles: ${this.particles.length} / ${this.settings.maxParticles}`, 10, 30);
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

        // Draw everything
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

        // Initial particle spawn
        if (this.particleSettings.behaviour.spawning.autospawn) {
            for (let i = 0; i < this.settings.maxParticles; i++) {
                this.addParticle();
            }
        }

    }
}