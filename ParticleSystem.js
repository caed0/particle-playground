class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.particles = [];
        this.connections = [];
        this.distances = [];

        this.deltaTimes = [];
        this.lastTime = 0;

        this.settings = {
            maxFPS: 144, // Maximum frames per second
            initialParticles: 100, // Initial number of particles
            initialSpawnPositions: ['random'],
            clearFrame: true,
            showDebugInfo: true,
            dynamicAdjustment: {
                autoSpawn: true, // Automatically spawn particles
                autoDestroy: true, // Automatically destroy particles
                minParticles: 50, // Minimum number of particles
                maxParticles: 200, // Maximum number of particles
                adjustmentInterval: 100 // Interval in milliseconds to adjust particle count
            },

            backgroundSettings: {
                type: 'color', // 'color' or 'gradient'
                color: '#111111', // Solid background color
                gradient: {
                    type: 'linear', // 'linear' or 'radial'
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
                size: { min: 3, max: 6 }, 
                color: '#00ff40', 
                opacity: 1,
                shape: ['circle', 'square', 'triangle'], 
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
                    spawnGrid: { 
                        columns: 0, 
                        rows: 0
                    },
                    respawn: true
                },
                ttl: { 
                    enabled: true,
                    min: 3, 
                    max: 8 
                },
                bounceOffEdges: true,
                bounceOffParticles: false
            }
        }

        this.connectionSettings = {
            enabled: true,
            distance: 200, // Maximum distance for connections
            maxConnections: 2, // Maximum number of connections per particle
            appearance: {
                color: '#00ff40',
                opacity: 1,
                lineWidth: 3,
                lineStyle: 'solid', // 'solid', 'dashed', 'dotted', or 'double'
                shadow: { 
                    enabled: true, 
                    color: '#00ff40', 
                    radius: 8 
                },
                fading: { 
                    enabled: true,
                    distanceFadingThreshold: 0.85, // Procentual distance threshold for fading connections
                    speed: 0.75, // Speed of fading in/out
                },
            },
        }

        this.particleInteractionSettings = {
            enabled: true,
            attraction: { force: 75, radius: 150 }, // Force strength for particle attraction
            repulsion: { force: 125, radius: 50 },  // Force strength for particle repulsion
            mode: 'both' // 'attract', 'repel', or 'both'
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

    addParticle(settingsOverride = {}) {
        // Override spawn positions
        let newSettings = this.particleSettings;
        if (settingsOverride.spawnPositions && settingsOverride.spawnPositions.length > 0) {
            newSettings = structuredClone(this.particleSettings);
            newSettings.behaviour.spawning.spawnPositions = settingsOverride.spawnPositions;
        }

        const particle = new Particle(newSettings, this.particles.length, this.canvas);

        // Override position
        if (settingsOverride.position) {
            particle.x = settingsOverride.position.x;
            particle.y = settingsOverride.position.y;
        }

        this.particles.push(particle);
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Clean up destroyed particles
            if (particle.state === 'destroyed') {
                this.particles.splice(i, 1);
                continue;
            }

            if (this.particleInteractionSettings.enabled) {
                this.applyParticleInteractions(particle, deltaTime);
            }

            particle.update(this.particleSettings, i, deltaTime, this.particles);
        }
    }

    applyParticleInteractions(particle, deltaTime) {
        const settings = this.particleInteractionSettings;
        
        for (let j = 0; j < this.particles.length; j++) {
            const otherParticle = this.particles[j];
            
            if (particle.state === 'dead' || otherParticle.state === 'dead') continue;
            if (particle === otherParticle) continue;
            
            // Calculate distance between particles
            const dx = otherParticle.x - particle.x;
            const dy = otherParticle.y - particle.y;
            const distance = this.distances[particle.index][otherParticle.index];
            
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
                const opacityFactor = particle.life * otherParticle.life;
                
                // Apply force to both particles (Newton's third law)
                const forceX = normalizedDx * forceStrength * forceDirection * deltaTime * opacityFactor;
                const forceY = normalizedDy * forceStrength * forceDirection * deltaTime * opacityFactor;
                
                // Apply force to particle A (away from or toward B)
                particle.vx -= forceX;
                particle.vy -= forceY;
                
                // Apply equal and opposite force to particle B
                otherParticle.vx += forceX;
                otherParticle.vy += forceY;
                
                // Update directions and speeds
                particle.direction = Math.atan2(particle.vy, particle.vx);
                particle.speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                
                otherParticle.direction = Math.atan2(otherParticle.vy, otherParticle.vx);
                otherParticle.speed = Math.sqrt(otherParticle.vx * otherParticle.vx + otherParticle.vy * otherParticle.vy);
            }
        }
    }

    updateDistances() {
        for (let i = 0; i < this.particles.length; i++) {
            const particleA = this.particles[i];
        
            let distances = [];
            for (let j = 0; j < this.particles.length; j++) {
                const particleB = this.particles[j];

                //Skip dead or destroyed particles
                if (particleA.state === 'dead' || particleA.state === 'destroyed' || particleB.state === 'dead' || particleB.state === 'destroyed') {
                    distances[j] = 0;
                    continue;
                }

                // Skip self-comparison
                if (i === j) {
                    distances[j] = 0;
                    continue;
                }

                // Calculate distance
                const dx = particleB.x - particleA.x;
                const dy = particleB.y - particleA.y;
                const distance = dx * dx + dy * dy;
                
                distances[j] = distance;
            }

            this.distances[i] = distances;
        }
    }

    updateConnections(deltaTime) {
        for (let i = this.connections.length - 1; i >= 0; i--) {
            const connection = this.connections[i];

            if (!this.particles.includes(connection.start) || !this.particles.includes(connection.end)) {
                this.connections.splice(i, 1);
                continue;
            }

            const distance = this.distances[connection.start.index][connection.end.index];
            if (distance <= 0) {
                this.connections.splice(i, 1);
                continue;
            }

            connection.update(this.connectionSettings, distance, deltaTime);

            // Clean up connections if particles are destroyed or too far apart
            if (connection.state === 'destroyed') {
                this.connections.splice(i, 1);
            } else {
                connection.start.connectedTo.push(connection.end);
                connection.end.connectedTo.push(connection.start);
            }
        }

        for (let i = 0; i < this.particles.length; i++) {
            const particleA = this.particles[i];

            if (particleA.state === 'dead' || particleA.state === 'destroyed') continue;

            let missingConnections = this.connectionSettings.maxConnections - particleA.connectedTo.length;
            if (missingConnections <= 0) continue;

            let particlesInRange = this.getParticlesInDistance(i);
            if (particlesInRange.length === 0) continue;

            for (let j = 0; j < particlesInRange.length; j++) {
                const particleB = this.particles[particlesInRange[j]];
                if(!particleB) console.log(j, particlesInRange, this.particles.length);

                // Skip if particleB is dead, destroyed, or already connected
                if (particleB.state === 'dead' || particleB.state === 'destroyed' || particleA.connectedTo.includes(particleB) || particleB.connectedTo.includes(particleA)) {
                    continue;
                }

                // Create a new connection
                const distance = this.distances[i][particlesInRange[j]];
                const connection = new Connection(particleA, particleB, distance, this.connectionSettings);
                this.connections.push(connection);
                particleA.connectedTo.push(particleB);
                particleB.connectedTo.push(particleA)
                missingConnections--;

                if (missingConnections <= 0) break; // Stop if we reached max connections
            }
        }
    }

    getParticlesInDistance(particleIndex) {
        const particlesInRange = [];

        for (let j = 0; j < this.distances[particleIndex].length; j++) {
            const distance = this.distances[particleIndex][j];
            if (distance > 0 && distance <= this.connectionSettings.distance ** 2) {
                particlesInRange.push({ index: j, distance: distance });
            }
        }

        return particlesInRange.sort((a, b) => a.distance - b.distance).map(p => p.index);
    }

    drawParticles() {
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }
    }

    drawConnections() {
        for (const connection of this.connections) {
            connection.draw(this.ctx);
        }
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
        this.ctx.fillText(`Active Connections: ${this.connections.length}`, 10, 90);
        this.ctx.restore();
    }

    animate(currentTime = 0) {
        // Delta time calculation
        if (this.lastTime === 0) {
            this.lastTime = currentTime; // Initialize lastTime on first frame
            this.updateDistances();
        }

        const deltaTime = (currentTime - this.lastTime) / 1000;
        const minDeltaTime = 1 / this.settings.maxFPS;
        const averageDeltaTime = this.deltaTimes.reduce((a, b) => a + b, 0) / this.deltaTimes.length || minDeltaTime;
        
        // Skip this frame to maintain maxFPS
        if (deltaTime < minDeltaTime && averageDeltaTime < minDeltaTime) {
            requestAnimationFrame((time) => this.animate(time));
            return;
        }

        this.lastTime = currentTime;
        this.deltaTimes.push(deltaTime);
        if (this.deltaTimes.length > 120) this.deltaTimes.shift();
        this.fps = Math.round(1 / averageDeltaTime);
    
        // Update
        if (this.distances[0].length != this.particles.length) this.updateDistances();
        this.updateParticles(deltaTime);
        this.updateDistances();
        if (this.connectionSettings.enabled) this.updateConnections(deltaTime);

        // Draw
        if (this.settings.clearFrame) this.drawBackground();
        if (this.connectionSettings.enabled) this.drawConnections();
        this.drawParticles();
        if (this.settings.showDebugInfo) this.drawDebugInfo();

        // Request next frame
        requestAnimationFrame((time) => this.animate(time));
    }

    init() {
        clearInterval(this.settings.dynamicAdjustment.adjustmentInterval);

        this.drawBackground();

        // Initial particle spawning
        for (let i = 0; i < this.settings.initialParticles; i++) {
            this.addParticle({ spawnPositions: this.settings.initialSpawnPositions });
        }

        this.animate();

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