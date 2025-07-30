class Particle {
    constructor(particleSettings, canvas) {
        this.canvas = canvas;
        this.settings = particleSettings;
        this.life = 0;
        this.timeLived = 0;
        this.updatedAt = null;
        this.diedAt = null;

        this.init();
    }

    init() {
        this.state = 'restoring';
        this.spawnedAt = Date.now();

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
        this.char = chars[Math.floor(Math.random() * chars.length)];

        const { x, y } = this.getSpawnPosition(this.settings.behaviour.spawning.spawnPositions);
        this.x = x;
        this.y = y;

        this.size = this.settings.appearance.size.min + Math.random() * (this.settings.appearance.size.max - this.settings.appearance.size.min);
        this.speed = this.settings.behaviour.movement.speed.min + Math.random() * (this.settings.behaviour.movement.speed.max - this.settings.behaviour.movement.speed.min);
        this.direction = Math.random() * 2 * Math.PI;
        this.ttl = this.settings.behaviour.ttl.min + Math.random() * (this.settings.behaviour.ttl.max - this.settings.behaviour.ttl.min);

        this.vx = this.speed * Math.cos(this.direction);
        this.vy = this.speed * Math.sin(this.direction);
    }

    getSpawnPosition(spawnPosition) {
        const position = spawnPosition[Math.floor(Math.random() * spawnPosition.length)];

        let gridX, gridY;
        if (this.settings.behaviour.spawning.spawnGrid.columns > 0) {
            // Calculate grid size based on this.canvas dimensions and spawning offset
            const gridSizeX = (this.canvas.width - 2 * this.settings.behaviour.spawning.spawningOffset.x) / this.settings.behaviour.spawning.spawnGrid.columns;
            
            // Pick a random grid cell
            const randomX = Math.floor(Math.random() * this.settings.behaviour.spawning.spawnGrid.columns);

            // Calculate the spawn position based on the grid cell
            gridX = this.settings.behaviour.spawning.spawningOffset.x + randomX * gridSizeX + gridSizeX / 2;
        }
        if (this.settings.behaviour.spawning.spawnGrid.rows > 0) {
            // Calculate grid size based on this.canvas dimensions and spawning offset
            const gridSizeY = (this.canvas.height - 2 * this.settings.behaviour.spawning.spawningOffset.y) / this.settings.behaviour.spawning.spawnGrid.rows;

            // Pick a random grid cell
            const randomY = Math.floor(Math.random() * this.settings.behaviour.spawning.spawnGrid.rows);

            // Calculate the spawn position based on the grid cell
            gridY = this.settings.behaviour.spawning.spawningOffset.y + randomY * gridSizeY + gridSizeY / 2;
        }



        let x, y;
        switch (position) {
            case 'random':
                x = this.settings.behaviour.spawning.spawnGrid.columns > 0 ? gridX : Math.random() * this.canvas.width + (Math.random() < 0.5 ? this.settings.behaviour.spawning.spawningOffset : -this.settings.behaviour.spawning.spawningOffset);
                y = this.settings.behaviour.spawning.spawnGrid.rows > 0 ? gridY : Math.random() * this.canvas.height + (Math.random() < 0.5 ? this.settings.behaviour.spawning.spawningOffset : -this.settings.behaviour.spawning.spawningOffset);
                break;
            case 'center':
                x = this.canvas.width / 2 + Math.random() * (Math.random() < 0.5 ? this.settings.behaviour.spawning.spawningOffset.x : -this.settings.behaviour.spawning.spawningOffset.x);
                y = this.canvas.height / 2 + Math.random() * (Math.random() < 0.5 ? this.settings.behaviour.spawning.spawningOffset.y : -this.settings.behaviour.spawning.spawningOffset.y);
                break;
            case 'top-left':
                x = this.settings.behaviour.spawning.spawningOffset.x;
                y = this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'top-right':
                x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                y = this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'bottom-left':
                x = this.settings.behaviour.spawning.spawningOffset.x;
                y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'bottom-right':
                x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'top':
                x = this.canvas.width / 2;
                y = this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'bottom':
                x = this.canvas.width / 2;
                y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'left':
                x = this.settings.behaviour.spawning.spawningOffset.x;
                y = this.canvas.height / 2;
                break;
            case 'right':
                x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                y = this.canvas.height / 2;
                break;
            case 'top-edge':
                x = this.settings.behaviour.spawning.spawnGrid.columns > 0 ? gridX : Math.random() * this.canvas.width;
                y = this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'bottom-edge':
                x = this.settings.behaviour.spawning.spawnGrid.columns > 0 ? gridX : Math.random() * this.canvas.width;
                y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                break;
            case 'left-edge':
                x = this.settings.behaviour.spawning.spawningOffset.x;
                y = this.settings.behaviour.spawning.spawnGrid.rows > 0 ? gridY : Math.random() * this.canvas.height;
                break;
            case 'right-edge':
                x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                y = this.settings.behaviour.spawning.spawnGrid.rows > 0 ? gridY : Math.random() * this.canvas.height;
                break;
            case 'random-edge':
                const edge = Math.floor(Math.random() * 4);
                if (edge === 0) { // Top edge
                    x = this.settings.behaviour.spawning.spawnGrid.columns > 0 ? gridX : Math.random() * this.canvas.width;
                    y = this.settings.behaviour.spawning.spawningOffset.y;
                } else if (edge === 1) { // Bottom edge
                    x = this.settings.behaviour.spawning.spawnGrid.columns > 0 ? gridX : Math.random() * this.canvas.width;
                    y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                } else if (edge === 2) { // Left edge
                    x = this.settings.behaviour.spawning.spawningOffset.x;
                    y = this.settings.behaviour.spawning.spawnGrid.rows > 0 ? gridY : Math.random() * this.canvas.height;
                } else { // Right edge
                    x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                    y = this.settings.behaviour.spawning.spawnGrid.rows > 0 ? gridY : Math.random() * this.canvas.height;
                }
                break;
            case 'random-corner':
                const corner = Math.floor(Math.random() * 4);
                if (corner === 0) { // Top-left corner
                    x = this.settings.behaviour.spawning.spawningOffset.x;
                    y = this.settings.behaviour.spawning.spawningOffset.y;
                } else if (corner === 1) { // Top-right corner
                    x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                    y = this.settings.behaviour.spawning.spawningOffset.y;
                } else if (corner === 2) { // Bottom-left corner
                    x = this.settings.behaviour.spawning.spawningOffset.x;
                    y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                } else { // Bottom-right corner
                    x = this.canvas.width - this.settings.behaviour.spawning.spawningOffset.x;
                    y = this.canvas.height - this.settings.behaviour.spawning.spawningOffset.y;
                }
                break;
            default:
                x = this.settings.behaviour.spawning.spawnGrid.columns > 0 ? gridX : Math.random() * this.canvas.width + (Math.random() < 0.5 ? this.settings.behaviour.spawning.spawningOffset.x : -this.settings.behaviour.spawning.spawningOffset.x);
                y = this.settings.behaviour.spawning.spawnGrid.rows > 0 ? gridY : Math.random() * this.canvas.height + (Math.random() < 0.5 ? this.settings.behaviour.spawning.spawningOffset.y : -this.settings.behaviour.spawning.spawningOffset.y);
                break;
        }

        return { x, y };
    }

    getDirection() {
        let dir = this.direction;
        if (this.settings.behaviour.movement.direction !== 'random') {
            switch (this.settings.behaviour.movement.direction) {
                case 'up':
                    dir = -Math.PI / 2; // 90 degrees in radians
                    break;
                case 'down':
                    dir = Math.PI / 2; // 270 degrees in radians
                    break;
                case 'left':
                    dir = Math.PI; // 180 degrees in radians
                    break;
                case 'right':
                    dir = 0; // 0 degrees in radians
                    break;
                case 'up-left':
                    dir = -Math.PI * 3 / 4; // 135 degrees in radians
                    break;
                case 'up-right':
                    dir = -Math.PI / 4; // 45 degrees in radians
                    break;
                case 'down-left':
                    dir = Math.PI * 3 / 4; // 225 degrees in radians
                    break;
                case 'down-right':
                    dir = Math.PI / 4; // 315 degrees in radians
                    break;
                case 'center':
                    dir = Math.atan2(this.canvas.height / 2 - this.y, this.canvas.width / 2 - this.x);
                    break;
                case 'edge':
                    const dx = this.canvas.width / 2 - this.x;
                    const dy = this.canvas.height / 2 - this.y;
                    dir = Math.atan2(-dy, -dx);
                    break;
                case 'corner':
                    const corners = [
                        { x: -this.size + this.settings.behaviour.spawning.spawningOffset.x, y: -this.size + this.settings.behaviour.spawning.spawningOffset.y },
                        { x: this.canvas.width + this.size - this.settings.behaviour.spawning.spawningOffset.x, y: -this.size + this.settings.behaviour.spawning.spawningOffset.y },
                        { x: -this.size + this.settings.behaviour.spawning.spawningOffset.x, y: this.canvas.height + this.size - this.settings.behaviour.spawning.spawningOffset.y },
                        { x: this.canvas.width + this.size - this.settings.behaviour.spawning.spawningOffset.x, y: this.canvas.height + this.size - this.settings.behaviour.spawning.spawningOffset.y }
                    ];
                    const closestCorner = corners.reduce((prev, curr) => {
                        const prevDist = Math.hypot(prev.x - this.x, prev.y - this.y);
                        const currDist = Math.hypot(curr.x - this.x, curr.y - this.y);
                        return (currDist < prevDist) ? curr : prev;
                    });
                    dir = Math.atan2(closestCorner.y - this.y, closestCorner.x - this.x);
                    break;
                case 'jitter':
                    dir = Math.random() * 2 * Math.PI;
                    break;
                default:
                    dir = this.direction;
            }
        }

        return dir;
    }

    checkCollisionWithParticle(otherParticle) {
        if (otherParticle === this || otherParticle.state === 'dead' || this.state === 'dead') return false;

        const dx = this.x - otherParticle.x;
        const dy = this.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.size + otherParticle.size;
        
        return distance < minDistance;
    }

    handleParticleCollision(otherParticle) {
        if (!this.checkCollisionWithParticle(otherParticle)) return;
        
        // Calculate collision vector
        const dx = this.x - otherParticle.x;
        const dy = this.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Prevent division by zero
        if (distance === 0) return;
        
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate overlapping particles
        const overlap = (this.size + otherParticle.size) - distance;
        const separationDistance = overlap / 2;
        
        this.x += nx * separationDistance;
        this.y += ny * separationDistance;
        otherParticle.x -= nx * separationDistance;
        otherParticle.y -= ny * separationDistance;
        
        // Calculate relative velocity
        const relativeVx = this.vx - otherParticle.vx;
        const relativeVy = this.vy - otherParticle.vy;
        
        // Calculate relative velocity along collision normal
        const velocityAlongNormal = relativeVx * nx + relativeVy * ny;
        
        // Do not resolve if velocities are separating
        if (velocityAlongNormal > 0) return;
        
        // Calculate collision response with perfect energy conservation
        const restitution = 1.0; // Perfect elastic collision (no energy loss)
        const impulse = -(1 + restitution) * velocityAlongNormal / 2;
        
        // Store original speeds to restore them after collision
        const originalSpeed1 = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const originalSpeed2 = Math.sqrt(otherParticle.vx * otherParticle.vx + otherParticle.vy * otherParticle.vy);
        
        // Apply impulse to both particles
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;
        
        this.vx += impulseX;
        this.vy += impulseY;
        otherParticle.vx -= impulseX;
        otherParticle.vy -= impulseY;
        
        // Normalize velocities and restore original speeds to prevent energy loss
        const newSpeed1 = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const newSpeed2 = Math.sqrt(otherParticle.vx * otherParticle.vx + otherParticle.vy * otherParticle.vy);
        
        if (newSpeed1 > 0) {
            this.vx = (this.vx / newSpeed1) * originalSpeed1;
            this.vy = (this.vy / newSpeed1) * originalSpeed1;
        }
        
        if (newSpeed2 > 0) {
            otherParticle.vx = (otherParticle.vx / newSpeed2) * originalSpeed2;
            otherParticle.vy = (otherParticle.vy / newSpeed2) * originalSpeed2;
        }
        
        // Update directions based on new velocities
        this.direction = Math.atan2(this.vy, this.vx);
        otherParticle.direction = Math.atan2(otherParticle.vy, otherParticle.vx);
        
        // Update speeds (should remain the same as original)
        this.speed = originalSpeed1;
        otherParticle.speed = originalSpeed2;
    }

    handleEdgeCollision() {
                let bounced = false;
                
                // Store original speed to preserve it after bouncing
                const originalSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                
                // Bounce off left and right edges
                if (this.x <= 0) {
                    this.x = 0;
                    this.vx = Math.abs(this.vx); // Ensure velocity points right
                    bounced = true;
                } else if (this.x >= this.canvas.width) {
                    this.x = this.canvas.width;
                    this.vx = -Math.abs(this.vx); // Ensure velocity points left
                    bounced = true;
                }
                
                // Bounce off top and bottom edges
                if (this.y <= 0) {
                    this.y = 0;
                    this.vy = Math.abs(this.vy); // Ensure velocity points down
                    bounced = true;
                } else if (this.y >= this.canvas.height) {
                    this.y = this.canvas.height;
                    this.vy = -Math.abs(this.vy); // Ensure velocity points up
                    bounced = true;
                }
                
                // If we bounced, preserve the original speed and update direction
                if (bounced) {
                    // Normalize velocity and restore original speed to prevent energy loss
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (currentSpeed > 0) {
                        this.vx = (this.vx / currentSpeed) * originalSpeed;
                        this.vy = (this.vy / currentSpeed) * originalSpeed;
                    }
                    
                    this.direction = Math.atan2(this.vy, this.vx);
                    this.speed = originalSpeed; // Maintain original speed
                }
    }

    update(particleSettings, deltaTime, particles) {
        // Skip update if particle is destroyed
        if (this.state === 'destroyed') return;

        // Update particle properties
        this.updatedAt = Date.now();
        this.timeLived = this.updatedAt - this.spawnedAt;
        this.settings = particleSettings;

        // Kill particle if it exceeds TTL or goes out of bounds
        if (this.state === 'alive' && this.state !== 'destroying') {
            if (this.ttl.enabled && this.ttl.duration < this.timeLived / 1000) {
                this.diedAt = this.updatedAt;
                this.state = 'dying';
            }
            
            // Only kill particle for going out of bounds if bouncing is disabled
            if (!this.settings.behaviour.bounceOffEdges) {
                const topEdge = -this.size + this.settings.behaviour.spawning.spawningOffset.y;
                const bottomEdge = this.canvas.height + this.size - this.settings.behaviour.spawning.spawningOffset.y;
                const leftEdge = -this.size + this.settings.behaviour.spawning.spawningOffset.x;
                const rightEdge = this.canvas.width + this.size - this.settings.behaviour.spawning.spawningOffset.x;

                if (this.x < leftEdge || this.x > rightEdge || this.y < topEdge || this.y > bottomEdge) {
                    this.diedAt = this.updatedAt;
                    this.state = 'dying';
                }
            }
        }


        // Fade in/out logic
        if (!this.settings.appearance.fading.enabled) {
            if (this.state === 'restoring' && this.life < 1) {
                this.life = 1; 
            }
            if ((this.state === 'dying' || this.state === 'destroying') && this.life > 0) {
                this.life = 0;
            }
        } else {
            if (this.state === 'restoring' && this.life < 1) {
                this.life = Math.min(1, ((this.updatedAt - this.spawnedAt) / 1000) / this.settings.appearance.fading.fadeInTime);
            }
            if ((this.state === 'dying' || this.state === 'destroying') && this.life > 0) {
                // Fade out
                this.life = Math.max(0, 1 - ((this.updatedAt - this.diedAt) / 1000) / this.settings.appearance.fading.fadeOutTime);
            }
        }

        // Update state based on life
        if (this.state === 'dying' && this.life <= 0) {
            this.state = 'dead';
        }
        if (this.state === 'destroying' && this.life <= 0) {
            this.state = 'destroyed';
            return;
        }
        if (this.state === 'restoring' && this.life >= 1) {
            this.state = 'alive';
        }

        // Respawn or destroy
        if (this.state === 'dead') {
            if (this.settings.behaviour.spawning.respawn) {
                this.init();
            } else {
                this.state = 'destroyed';
            }
            return;
        }

        // Movement logic
        if (this.settings.behaviour.movement.enabled) {
            // Get direction
            let dir = this.getDirection();

            // Update position based on speed, direction, and delta time
            this.vx = this.speed * Math.cos(dir);
            this.vy = this.speed * Math.sin(dir);
            this.x = this.x + (this.vx * deltaTime); // Speed is now in pixels per second
            this.y = this.y + (this.vy * deltaTime);

            // Handle particle-to-particle collisions if enabled
            if (this.settings.behaviour.bounceOffParticles) {
                for (const otherParticle of particles) {
                    this.handleParticleCollision(otherParticle);
                }
            }

            // Handle bouncing off edges if enabled
            if (this.settings.behaviour.bounceOffEdges) {
                this.handleEdgeCollision();
            }
        }
    }


    draw(ctx) {
        ctx.save();

        ctx.fillStyle = this.settings.appearance.color;
        ctx.strokeStyle = this.settings.appearance.color;  
        ctx.globalAlpha = this.settings.appearance.opacity * this.life;
        if (this.settings.appearance.shadow.enabled) {
            ctx.shadowColor = this.settings.appearance.shadow.color;
            ctx.shadowBlur = this.settings.appearance.shadow.radius;
        }

        const shape = this.settings.appearance.shape;
        const r = this.size;
        const x = this.x;
        const y = this.y;

        ctx.beginPath();

        switch (shape) {
            case 'circle':
                ctx.arc(x, y, r, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(x - r, y - r, r * 2, r * 2);
                break;
            case 'triangle':
                ctx.moveTo(x, y - r);
                ctx.lineTo(x - r, y + r);
                ctx.lineTo(x + r, y + r);
                ctx.closePath();
                break;
            case 'plus':
                ctx.lineWidth = Math.max(1, r / 3);
                ctx.lineCap = 'round';
                ctx.moveTo(x - r, y);
                ctx.lineTo(x + r, y);
                ctx.moveTo(x, y - r);
                ctx.lineTo(x, y + r);
                ctx.stroke();
                ctx.restore();
                return; // Early return to avoid calling fill()
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI / 3 * i;
                    const px = x + r * Math.cos(angle);
                    const py = y + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'pentagon':
                for (let i = 0; i < 5; i++) {
                    const angle = Math.PI * 2 / 5 * i - Math.PI / 2;
                    const px = x + r * Math.cos(angle);
                    const py = y + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'star':
                const spikes = 5;
                const outerRadius = r;
                const innerRadius = r / 2;
                for (let i = 0; i < spikes * 2; i++) {
                    const angle = Math.PI / spikes * i - Math.PI / 2;
                    const rad = i % 2 === 0 ? outerRadius : innerRadius;
                    const px = x + rad * Math.cos(angle);
                    const py = y + rad * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'diamond':
                ctx.moveTo(x, y - r);
                ctx.lineTo(x + r, y);
                ctx.lineTo(x, y + r);
                ctx.lineTo(x - r, y);
                ctx.closePath();
                break;
            case 'char':
                ctx.font = `${r * 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.char, x, y);
                ctx.restore();
                return; // Early return to avoid calling fill()
            default:
                ctx.arc(x, y, r, 0, Math.PI * 2);
                break;
        }
        ctx.fill(); 
        ctx.restore();
    }
}