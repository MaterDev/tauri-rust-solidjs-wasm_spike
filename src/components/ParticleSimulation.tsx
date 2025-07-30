import { onMount, onCleanup, createSignal } from 'solid-js';
import { Application, Graphics, Sprite, Container } from 'pixi.js';

// This will be the path to your WASM module
import init, { Simulation } from '../../public/wasm/particle_sim';

const ParticleSimulation = () => {
  const [fps, setFps] = createSignal(0);
  let container: HTMLDivElement | undefined;
  let app: Application | undefined;
  let simulation: Simulation | undefined;
  let particleContainer: Container | undefined;
  let particles: Sprite[] = [];
  let lastTime = 0;
  let frameCount = 0;

  const initializePixi = async () => {
    if (!container) return;

    // Initialize PixiJS
    app = new Application({
      width: 800,
      height: 600,
      backgroundColor: 0x000000,
      antialias: true,
    });

    // In PixiJS v8, the view is accessed as app.canvas
    container.appendChild(app.canvas);

    // Initialize WASM module
    await init();

    // Create simulation with 5000 particles
    simulation = new Simulation(5000);

    // Create a regular container instead of ParticleContainer for simplicity
    particleContainer = new Container();
    app.stage.addChild(particleContainer);

    // Create a texture for the particles
    const graphics = new Graphics();
    graphics.beginFill(0xffffff);
    graphics.drawCircle(0, 0, 2);
    graphics.endFill();
    
    // In PixiJS v8, generateTexture is replaced with extract.texture
    const texture = app.renderer.extract.texture(graphics);

    // Create particles
    const count = simulation.get_count();
    particles = [];
    for (let i = 0; i < count; i++) {
      const particle = new Sprite(texture);
      particle.anchor.set(0.5);
      if (particleContainer) particleContainer.addChild(particle);
      particles.push(particle);
    }

    // Start animation loop
    lastTime = performance.now();
    frameCount = 0;
    if (app) app.ticker.add(animate);
  };


  const animate = () => {
    if (!simulation || !particles.length) return;

    // Update simulation and get new positions
    const positions = simulation.tick();

    // Update particle sprites
    for (let i = 0; i < particles.length; i++) {
      const idx = i * 3;
      if (idx + 2 < positions.length) {
        particles[i].x = (positions[idx] * 200) + 400;     // Scale X and center
        particles[i].y = (-positions[idx + 1] * 200) + 500; // Flip Y (screen coords), scale, and offset
        
        // Optional: Use Z for alpha or size
        const z = positions[idx + 2];
        particles[i].alpha = 0.5 + 0.5 * (1 - Math.abs(z));
      }
    }

    // Calculate FPS
    frameCount++;
    const now = performance.now();
    if (now - lastTime > 1000) {
      setFps(Math.round(frameCount * 1000 / (now - lastTime)));
      frameCount = 0;
      lastTime = now;
    }
  };

  onMount(() => {
    initializePixi();
  });

  onCleanup(() => {
    if (app) {
      app.ticker.remove(animate);
      // PixiJS v8 destroy method no longer accepts the removeView parameter
      app.destroy();
    }
  });

  return (
    <div class="particle-simulation">
      <div class="fps-counter">FPS: {fps()}</div>
      <div ref={container} class="pixi-container" />
    </div>
  );
};

export default ParticleSimulation;