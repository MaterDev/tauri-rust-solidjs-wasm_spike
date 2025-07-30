/**
 * Configuration interface for particle emitter
 */
export interface EmitterConfig {
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
  gravity: number;
  particleLifetime: number;
  emissionRate: number;
  maxParticles: number;
  particleSize: {
    min: number;
    max: number;
  };
  colors: number[];
  spread: number; // Angle spread in radians
}

/**
 * Create default emitter configuration centered on screen
 */
export function createEmitterConfig(screenWidth: number, screenHeight: number): EmitterConfig {
  return {
    position: {
      x: screenWidth / 2,
      y: screenHeight / 2
    },
    velocity: {
      x: 0,
      y: -100 // Upward velocity
    },
    gravity: 98, // Pixels per second squared
    particleLifetime: 3.0, // Seconds
    emissionRate: 100, // Particles per second
    maxParticles: 1000,
    particleSize: {
      min: 1,
      max: 4
    },
    colors: [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3, 0x54A0FF],
    spread: Math.PI / 4 // 45 degrees
  };
}

/**
 * Update emitter position
 */
export function updateEmitterPosition(config: EmitterConfig, x: number, y: number): EmitterConfig {
  return {
    ...config,
    position: { x, y }
  };
}
