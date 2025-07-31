class Connection {
    constructor(start, end, distance, connectionSettings) {
        this.settings = connectionSettings;
        this.start = start;
        this.end = end;
        this.state = 'alive';
        this.spawnedAt = Date.now();
        this.timeLived = 0;
        this.distance = distance;
        this.life = this.settings.appearance.fading.enabled ? 0 : 1;
    }

    calculateMaxLife() {
        const fadeDistance = this.distance - this.settings.distance ** 2 * this.settings.appearance.fading.distanceFadingThreshold;
        let distanceLife = 1;
        if (fadeDistance > 0) {
            distanceLife = Math.max(1 - fadeDistance / (this.settings.distance ** 2 * (1 - this.settings.appearance.fading.distanceFadingThreshold)), 0);
        }

        const particleLife = Math.min(this.start.life, this.end.life);

        const life = Math.min(distanceLife, particleLife);

        return this.settings.appearance.fading.enabled ? life : Math.ceil(life);
    }

    update(connectionSettings, distance, deltaTime) {
        if (this.state === 'destroyed') return;
        this.settings = connectionSettings;
        this.distance = distance;

        // Update state based on distance and particle states
        if (this.state !== 'destroying') {
            if (this.distance > this.settings.distance ** 2) {
                this.state = 'destroying';
                return;
            }
            if (this.start.state === 'destroyed' || this.end.state === 'destroyed') {
                this.state = 'destroying';
                return;
            }
            if (this.start.state === 'dead' || this.end.state === 'dead') {
                this.state = 'destroying';
                return;
            }
        }

        if (this.state === 'destroying' && this.life <= 0) {
            this.state = 'destroyed';
            return;
        }

        const maxLife = this.calculateMaxLife();
        if (this.settings.appearance.fading.enabled) {
            if (this.life < maxLife) {
                this.life = Math.min(this.life + deltaTime * this.settings.appearance.fading.speed, maxLife);
            } else if (this.life > maxLife) {
                this.life = Math.max(this.life - deltaTime * this.settings.appearance.fading.speed, maxLife);
            }
        } else {
            this.life = maxLife;
        }
    }

    draw(ctx) {
        ctx.save();

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.settings.appearance.lineWidth * this.life;
        ctx.strokeStyle = this.settings.appearance.color;
        ctx.globalAlpha = this.settings.appearance.opacity * this.life;
        if (this.settings.appearance.shadow.enabled) {
            ctx.shadowColor = this.settings.appearance.shadow.color;
            ctx.shadowBlur = this.settings.appearance.shadow.radius;
        }

        // Draw connections based on line style
        switch (this.settings.appearance.lineStyle) {
            case 'solid':
                this.drawSolidLine(ctx);
                break;
            case 'dotted':
                this.drawDottedLine(ctx);
                break;
            case 'dashed':
                this.drawDashedLine(ctx);
                break;
            case 'wavy':
                this.drawWavyLine(ctx);
                break;
            case 'zigzag':
                this.drawZigzagLine(ctx);
                break;
            case 'double':
                this.drawDoubleLine(ctx);
                break;
            default:
                this.drawSolidLine(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawSolidLine(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
    }

    drawDottedLine(ctx) {
        ctx.setLineDash([2, 4]); // 2px dots with 4px gaps

        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
    }

    drawDashedLine(ctx) {
        ctx.setLineDash([8, 4]); // 8px dashes with 4px gaps

        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
    }

    drawWavyLine(ctx) {
        const waveLength = 25; // Length of each wave cycle
        const amplitude = 8; // Height of the wave
        const smoothness = 20; // Number of segments per wave for smoothness
        
        if (this.distance < 10) {
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.lineTo(this.end.x, this.end.y);
            ctx.stroke();
            return;
        }

        // Calculate number of wave cycles and total segments
        const waveCycles = this.distance / waveLength;
        const totalSegments = Math.max(10, Math.floor(waveCycles * smoothness));

        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);

        for (let i = 1; i <= totalSegments; i++) {
            const t = i / totalSegments;
            
            // Base position along the line
            const baseX = this.start.x + dx * t;
            const baseY = this.start.y + dy * t;
            
            // Calculate perpendicular direction (normalized)
            const perpX = -dy / this.distance;
            const perpY = dx / this.distance;
            
            // Create sine wave with multiple cycles
            const wavePhase = t * waveCycles * 2 * Math.PI;
            const waveOffset = Math.sin(wavePhase) * amplitude;
            
            // Apply wave offset perpendicular to the line
            const waveX = baseX + perpX * waveOffset;
            const waveY = baseY + perpY * waveOffset;
            
            ctx.lineTo(waveX, waveY);
        }
        
        // Ensure we end exactly at the target point
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
    }

    drawZigzagLine(ctx) {
        const zigzagLength = 20; // Length of each zigzag cycle (peak to peak)
        const amplitude = 6; // Height of the zigzag
        const smoothness = 7; // Number of segments per zigzag cycle for smoothness
        
        if (this.distance < 10) {
            // Line too short for zigzag, draw straight
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.lineTo(this.end.x, this.end.y);
            ctx.stroke();
            return;
        }

        // Calculate number of zigzag cycles and total segments
        const zigzagCycles = this.distance / zigzagLength;
        const totalSegments = Math.max(8, Math.floor(zigzagCycles * smoothness));

        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);

        for (let i = 1; i <= totalSegments; i++) {
            const t = i / totalSegments;
            
            // Base position along the line
            const baseX = this.start.x + dx * t;
            const baseY = this.start.y + dy * t;
            
            // Calculate perpendicular direction (normalized)
            const perpX = -dy / this.distance;
            const perpY = dx / this.distance;
            
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
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
    }

    drawDoubleLine(ctx) {
        const offset = this.settings.appearance.lineWidth + 2; // Offset between the two lines

        // Calculate perpendicular direction for offset
        const perpX = -dy / this.distance * (offset / 2);
        const perpY = dx / this.distance * (offset / 2);
        
        ctx.beginPath();
        
        // First line
        ctx.moveTo(this.start.x + perpX, this.start.y + perpY);
        ctx.lineTo(this.end.x + perpX, this.end.y + perpY);

        // Second line
        ctx.moveTo(this.start.x - perpX, this.start.y - perpY);
        ctx.lineTo(this.end.x - perpX, this.end.y - perpY);

        ctx.stroke();
    }
}