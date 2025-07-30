class Connections {
    constructor(connectionSettings) {
        this.connections = [];
        this.settings = connectionSettings;
    }

    getDistance(particleA, particleB) {
        const dx = particleA.x - particleB.x;
        const dy = particleA.y - particleB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getDistanceSquared(particleA, particleB) {
        const dx = particleA.x - particleB.x;
        const dy = particleA.y - particleB.y;
        return dx * dx + dy * dy;
    }

    getParticleConnections(particle) {
        let count = 0;
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];
            if (connection.start === particle || connection.end === particle) {
                count++;
            }
        }
        return count;
    }

    getParticlesInDistance(particle, particles) {
        const connections = [];
        for (let i = 0; i < particles.length; i++) {
            const otherParticle = particles[i];
            if (otherParticle !== particle && this.getDistance(particle, otherParticle) <= this.settings.distance) {
                connections.push(otherParticle);
            }
        }
        return connections;
    }

    update(particles, connectionSettings) {
        this.settings = connectionSettings;
        if (!this.settings.enabled) return;

        for (let i = this.connections.length - 1; i >= 0; i--) {
            const connection = this.connections[i];
            if (!particles.includes(connection.start) || !particles.includes(connection.end)) {
                this.connections.splice(i, 1);
            } else if (this.getDistance(connection.start, connection.end) > this.settings.distance) {
                this.connections.splice(i, 1);
            }
        }

        for (let i = 0; i < particles.length; i++) {
            let currentConnections = this.getParticleConnections(particles[i]);
            const particlesInDistance = this.getParticlesInDistance(particles[i], particles);

            if (currentConnections >= this.settings.maxConnections) continue;

            for (let j = 0; j < particlesInDistance.length; j++) {
                if (currentConnections >= this.settings.maxConnections) break;

                const otherParticle = particlesInDistance[j];
                if (this.getParticleConnections(otherParticle) >= this.settings.maxConnections) continue;

                const connectionExists = this.connections.some(connection => 
                    (connection.start === particles[i] && connection.end === otherParticle) ||
                    (connection.start === otherParticle && connection.end === particles[i])
                );

                if (!connectionExists) {
                    this.connections.push({
                        start: particles[i],
                        end: otherParticle
                    });
                    currentConnections++;
                }
            }
        }
    }

    draw(ctx) {
        // Early exit if no connections
        if (this.connections.length === 0) return;
        
        // Enable antialiasing for smoother lines
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Set line cap and join for smoother edges
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.settings.appearance.lineWidth;

        // Only set shadow if needed
        if (this.settings.appearance.shadow.enabled) {
            ctx.shadowColor = this.settings.appearance.shadow.color;
            ctx.shadowBlur = this.settings.appearance.shadow.radius;
        }

        // Draw connections based on line style
        switch (this.settings.appearance.lineStyle) {
            case 'solid':
                this.drawSolidLines(ctx);
                break;
            case 'dotted':
                this.drawDottedLines(ctx);
                break;
            case 'dashed':
                this.drawDashedLines(ctx);
                break;
            case 'wavy':
                this.drawWavyLines(ctx);
                break;
            case 'zigzag':
                this.drawZigzagLines(ctx);
                break;
            case 'double':
                this.drawDoubleLines(ctx);
                break;
            default:
                this.drawSolidLines(ctx);
                break;
        }
        
        // Reset shadow and line dash
        if (this.settings.appearance.shadow.enabled) {
            ctx.shadowBlur = 0;
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1; // Reset global alpha after drawing
    }

    drawSolidLines(ctx) {
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];

            let alphaRangeMultiplier = 1;
            const distance = this.getDistanceSquared(connection.start, connection.end);
            const actualDistance = Math.sqrt(distance);
            const fadeDistance = actualDistance - this.settings.distance * 0.65;
            if (fadeDistance > 0) alphaRangeMultiplier = 1 - fadeDistance / (this.settings.distance * 0.35);
            
            ctx.strokeStyle = this.settings.appearance.color;
            ctx.globalAlpha = Math.min(connection.start.life, connection.end.life) * this.settings.appearance.opacity * alphaRangeMultiplier;

            ctx.beginPath();
            ctx.moveTo(connection.start.x, connection.start.y);
            ctx.lineTo(connection.end.x, connection.end.y);
            ctx.stroke();
        }
    }

    drawDottedLines(ctx) {
        ctx.setLineDash([2, 4]); // 2px dots with 4px gaps
        
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];

            let alphaRangeMultiplier = 1;
            const distance = this.getDistanceSquared(connection.start, connection.end);
            const actualDistance = Math.sqrt(distance);
            const fadeDistance = actualDistance - this.settings.distance * 0.65;
            if (fadeDistance > 0) alphaRangeMultiplier = 1 - fadeDistance / (this.settings.distance * 0.35);
            
            ctx.strokeStyle = this.settings.appearance.color;
            ctx.globalAlpha = Math.min(connection.start.life, connection.end.life) * this.settings.appearance.opacity * alphaRangeMultiplier;

            ctx.beginPath();
            ctx.moveTo(connection.start.x, connection.start.y);
            ctx.lineTo(connection.end.x, connection.end.y);
            ctx.stroke();
        }
    }

    drawDashedLines(ctx) {
        ctx.setLineDash([8, 4]); // 8px dashes with 4px gaps
        
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];

            let alphaRangeMultiplier = 1;
            const distance = this.getDistanceSquared(connection.start, connection.end);
            const actualDistance = Math.sqrt(distance);
            const fadeDistance = actualDistance - this.settings.distance * 0.65;
            if (fadeDistance > 0) alphaRangeMultiplier = 1 - fadeDistance / (this.settings.distance * 0.35);
            
            ctx.strokeStyle = this.settings.appearance.color;
            ctx.globalAlpha = Math.min(connection.start.life, connection.end.life) * this.settings.appearance.opacity * alphaRangeMultiplier;

            ctx.beginPath();
            ctx.moveTo(connection.start.x, connection.start.y);
            ctx.lineTo(connection.end.x, connection.end.y);
            ctx.stroke();
        }
    }

    drawWavyLines(ctx) {
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];

            let alphaRangeMultiplier = 1;
            const distance = this.getDistanceSquared(connection.start, connection.end);
            const actualDistance = Math.sqrt(distance);
            const fadeDistance = actualDistance - this.settings.distance * 0.65;
            if (fadeDistance > 0) alphaRangeMultiplier = 1 - fadeDistance / (this.settings.distance * 0.35);
            
            ctx.strokeStyle = this.settings.appearance.color;
            ctx.globalAlpha = Math.min(connection.start.life, connection.end.life) * this.settings.appearance.opacity * alphaRangeMultiplier;

            this.drawWavyLine(ctx, connection.start.x, connection.start.y, connection.end.x, connection.end.y);
        }
    }

    drawWavyLine(ctx, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const waveLength = 25; // Length of each wave cycle
        const amplitude = 8; // Height of the wave
        const smoothness = 20; // Number of segments per wave for smoothness
        
        if (distance < 10) {
            // Line too short for waves, draw straight
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            return;
        }

        // Calculate number of wave cycles and total segments
        const waveCycles = distance / waveLength;
        const totalSegments = Math.max(10, Math.floor(waveCycles * smoothness));

        ctx.beginPath();
        ctx.moveTo(x1, y1);

        for (let i = 1; i <= totalSegments; i++) {
            const t = i / totalSegments;
            
            // Base position along the line
            const baseX = x1 + dx * t;
            const baseY = y1 + dy * t;
            
            // Calculate perpendicular direction (normalized)
            const perpX = -dy / distance;
            const perpY = dx / distance;
            
            // Create sine wave with multiple cycles
            const wavePhase = t * waveCycles * 2 * Math.PI;
            const waveOffset = Math.sin(wavePhase) * amplitude;
            
            // Apply wave offset perpendicular to the line
            const waveX = baseX + perpX * waveOffset;
            const waveY = baseY + perpY * waveOffset;
            
            ctx.lineTo(waveX, waveY);
        }
        
        // Ensure we end exactly at the target point
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    drawZigzagLines(ctx) {
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];

            let alphaRangeMultiplier = 1;
            const distance = this.getDistanceSquared(connection.start, connection.end);
            const actualDistance = Math.sqrt(distance);
            const fadeDistance = actualDistance - this.settings.distance * 0.65;
            if (fadeDistance > 0) alphaRangeMultiplier = 1 - fadeDistance / (this.settings.distance * 0.35);
            
            ctx.strokeStyle = this.settings.appearance.color;
            ctx.globalAlpha = Math.min(connection.start.life, connection.end.life) * this.settings.appearance.opacity * alphaRangeMultiplier;

            this.drawZigzagLine(ctx, connection.start.x, connection.start.y, connection.end.x, connection.end.y);
        }
    }

    drawZigzagLine(ctx, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const zigzagLength = 20; // Length of each zigzag cycle (peak to peak)
        const amplitude = 6; // Height of the zigzag
        const smoothness = 7; // Number of segments per zigzag cycle for smoothness
        
        if (distance < 10) {
            // Line too short for zigzag, draw straight
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            return;
        }

        // Calculate number of zigzag cycles and total segments
        const zigzagCycles = distance / zigzagLength;
        const totalSegments = Math.max(8, Math.floor(zigzagCycles * smoothness));

        ctx.beginPath();
        ctx.moveTo(x1, y1);

        for (let i = 1; i <= totalSegments; i++) {
            const t = i / totalSegments;
            
            // Base position along the line
            const baseX = x1 + dx * t;
            const baseY = y1 + dy * t;
            
            // Calculate perpendicular direction (normalized)
            const perpX = -dy / distance;
            const perpY = dx / distance;
            
            // Create smooth zigzag using a triangle wave function
            // This creates a smoother zigzag than sharp alternating points
            const zigzagPhase = t * zigzagCycles * 2 * Math.PI;
            let zigzagOffset;
            
            // Create a smooth triangle wave (smoother than pure sawtooth)
            const sineComponent = Math.sin(zigzagPhase);
            const triangleWave = (2 / Math.PI) * Math.asin(sineComponent);
            zigzagOffset = triangleWave * amplitude;
            
            // Apply zigzag offset perpendicular to the line
            const zigzagX = baseX + perpX * zigzagOffset;
            const zigzagY = baseY + perpY * zigzagOffset;
            
            ctx.lineTo(zigzagX, zigzagY);
        }
        
        // Ensure we end exactly at the target point
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    drawDoubleLines(ctx) {
        const offset = this.settings.appearance.lineWidth + 2; // Offset between the two lines
        
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i];

            let alphaRangeMultiplier = 1;
            const distance = this.getDistanceSquared(connection.start, connection.end);
            const actualDistance = Math.sqrt(distance);
            const fadeDistance = actualDistance - this.settings.distance * 0.65;
            if (fadeDistance > 0) alphaRangeMultiplier = 1 - fadeDistance / (this.settings.distance * 0.35);
            
            ctx.strokeStyle = this.settings.appearance.color;
            ctx.globalAlpha = Math.min(connection.start.life, connection.end.life) * this.settings.appearance.opacity * alphaRangeMultiplier;

            const dx = connection.end.x - connection.start.x;
            const dy = connection.end.y - connection.start.y;
            const lineDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (lineDistance === 0) continue;
            
            // Calculate perpendicular direction for offset
            const perpX = -dy / lineDistance * (offset / 2);
            const perpY = dx / lineDistance * (offset / 2);
            
            ctx.beginPath();
            
            // First line
            ctx.moveTo(connection.start.x + perpX, connection.start.y + perpY);
            ctx.lineTo(connection.end.x + perpX, connection.end.y + perpY);
            
            // Second line
            ctx.moveTo(connection.start.x - perpX, connection.start.y - perpY);
            ctx.lineTo(connection.end.x - perpX, connection.end.y - perpY);
            
            ctx.stroke();
        }
    }
}