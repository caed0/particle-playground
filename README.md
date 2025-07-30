# Particle System

A customizable particle system with interactive particles, connections, and various visual effects.

## Settings Guide

### System Settings

#### Initial Setup
- **initialParticles**: How many particles to create when starting (default: 150)
- **initialSpawnPositions**: Where particles first appear (options: 'random', 'center', 'top', 'bottom', etc.)
- **clearCanvas**: Whether to clear the screen each frame (true/false)
- **showDebugInfo**: Show FPS and particle count on screen (true/false)

#### Dynamic Adjustment
- **autoSpawn**: Automatically create new particles (true/false)
- **autoDestroy**: Automatically remove excess particles (true/false)
- **minParticles**: Minimum number of particles to maintain
- **maxParticles**: Maximum number of particles allowed
- **adjustmentInterval**: How often to check particle count (in milliseconds)

#### Background
- **type**: Background style ('color' or 'gradient')
- **color**: Solid background color (hex code like '#111111')
- **gradient**: Gradient settings with colors and direction

### Particle Settings

#### Appearance
- **size**: Particle size range (min/max values)
- **color**: Particle color (hex code like '#00ff40')
- **opacity**: How transparent particles are (0-1)
- **shape**: Particle shape ('circle', 'square', 'triangle', 'star', 'diamond', 'plus', 'hexagon', 'pentagon', 'char')
- **shadow**: Drop shadow effect with color and radius
- **fading**: Fade in/out effects with timing

#### Movement Behavior
- **enabled**: Whether particles move (true/false)
- **speed**: How fast particles move (min/max values)
- **direction**: Movement direction ('random', 'up', 'down', 'left', 'right', 'center', 'edge', etc.)

#### Spawning
- **spawnPositions**: Where new particles appear
- **spawningOffset**: Distance from edges when spawning
- **spawnGrid**: Grid-based spawning (columns/rows)
- **respawn**: Whether particles respawn after dying (true/false)

#### Life & Death
- **ttl** (Time To Live): How long particles live before dying
- **enabled**: Whether particles have limited lifespan (true/false)
- **min/max**: Lifespan range in seconds

#### Physics
- **bounceOffEdges**: Particles bounce off screen edges (true/false)
- **bounceOffParticles**: Particles bounce off each other (true/false)

### Connection Settings
- **enabled**: Show lines between nearby particles (true/false)
- **distance**: Maximum distance for connections
- **maxConnections**: Maximum connections per particle
- **color**: Connection line color
- **opacity**: Connection line transparency
- **lineWidth**: Connection line thickness
- **lineStyle**: Line style ('solid', 'dashed', 'dotted', 'double')

### Particle Interactions
- **enabled**: Particles attract/repel each other (true/false)
- **attraction**: Pull particles together (force/radius)
- **repulsion**: Push particles apart (force/radius)
- **mode**: Interaction type ('attract', 'repel', 'both')

### Mouse Interactions
- **spawn**: Click/drag to create particles
- **enabled**: Allow mouse spawning (true/false)
- **amount**: Particles created per click
- **continuous**: Keep spawning while dragging (true/false)
- **delay**: Time between spawns when dragging (milliseconds)

## Spawn Position Options
- `random` - Anywhere on screen
- `center` - Screen center
- `top/bottom/left/right` - Screen edges
- `top-left/top-right/bottom-left/bottom-right` - Corners
- `random-edge` - Random edge
- `random-corner` - Random corner

## Shape Options
- `circle` - Round particles
- `square` - Square particles
- `triangle` - Triangle particles
- `diamond` - Diamond particles
- `star` - Star particles
- `plus` - Plus sign particles
- `hexagon` - Six-sided particles
- `pentagon` - Five-sided particles
- `char` - Random letter/number particles

## Usage
1. Open `demo/index.html` in a web browser
2. Modify settings in the JavaScript files
3. Refresh to see changes
4. Click and drag to spawn particles with mouse

## Files
- `ParticleSystem.js` - Main system controller
- `Particle.js` - Individual particle behavior
- `Connections.js` - Particle connection lines
- `demo/` - Example implementation
