import { EmitterConfig } from './Particle';

// Create a function to generate the emitter configuration
export function createEmitterConfig(windowWidth: number, windowHeight: number): EmitterConfig {
  return {
    position: { x: windowWidth / 2, y: windowHeight }, // Bottom center of the viewport
    spread: windowWidth / 4,              // Horizontal spread based on window width
    lifetime: 5000,                       // Particle lifetime in ms
    gravity: -0.1,                        // Negative gravity effect (pulls upward)
    initialSpeed: { min: 2, max: 5 },     // Initial speed range
    size: { min: 1, max: 3 },             // Size range
    colors: [                             // Available colors for randomization
      0xFF4500, // Orange Red
      0x00BFFF, // Deep Sky Blue
      0x7FFF00, // Chartreuse
      0xFF00FF, // Magenta
      0xFFFF00, // Yellow
      0x00FFFF, // Cyan
      0xFFD700  // Gold
    ]
  };
}

// Function to update emitter position when window resizes
export function updateEmitterPosition(config: EmitterConfig, windowWidth: number, windowHeight: number): void {
  config.position.x = windowWidth / 2;
  config.position.y = windowHeight;
  config.spread = windowWidth / 4;
}
