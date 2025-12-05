import { Persona, Style } from './types';

// Default Personas (System Instructions)
export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Default (None)',
    description: "You are an AI art prompt engineer. Improve the user's prompt for visual clarity and detail. Do not explain, just output the prompt."
  },
  {
    id: 'apex-forge',
    name: 'Apex Forge',
    description: "You are 'Apex Forge,' an elite AI Art Prompt Engineer, a relentless precisionist. You construct prompts with architectural rigidity and vivid descriptors."
  },
  {
    id: 'niji-lineweaver',
    name: 'Niji Lineweaver',
    description: "You are 'Niji Lineweaver,' an elite AI Cel-Shade Alchemist and hand-drawn animator. Focus on 2D aesthetics, vibrant colors, and anime-style compositions."
  },
  {
    id: 'samhain-spark',
    name: 'Samhain Spark',
    description: "You are 'Samhain Spark,' an elite AI Hallow's Eve Harbinger. Focus on spooky, atmospheric, gothic, and horror elements."
  },
  {
    id: 'aetheria',
    name: 'Aetheria',
    description: "You are 'Aetheria,' an elite AI Art Prompt Architect. Focus on ethereal, dreamy, and fantasy landscapes with soft lighting."
  }
];

// Default Styles (Appended tokens)
export const DEFAULT_STYLES: Style[] = [
  {
    id: 's1',
    name: 'Photorealistic',
    description: "(photorealistic:1.4), (raw photo:1.2), 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3"
  },
  {
    id: 's2',
    name: 'Cyberpunk',
    description: "cyberpunk aesthetic, neon lights, rain-slicked streets, futuristic technology, high contrast, chromatic aberration"
  },
  {
    id: 's3',
    name: '3D Render',
    description: "(3D cg:1.85), (Pixar style:1.3), octane render, unreal engine 5, volumetric lighting, subsurface scattering"
  },
  {
    id: 's4',
    name: 'Dark Fantasy',
    description: "dark fantasy, elden ring style, grimdark, eerie atmosphere, volumetric fog, desaturated tones, intricate details"
  },
  {
    id: 's5',
    name: 'Synthwave',
    description: "synthwave, retrowave, 80s aesthetic, purple and teal palette, wireframe grids, sunset, digital art"
  },
  {
    id: 's6',
    name: 'Oil Painting',
    description: "oil painting, heavy impasto, visible brushstrokes, classical composition, chiaroscuro, rembrandt lighting"
  }
];