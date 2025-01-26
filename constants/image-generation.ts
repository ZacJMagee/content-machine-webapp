// constants/image-generation.ts
import { ImageSettings, ImageSizePreset } from '../types/image-generation';

export const IMAGE_SIZE_PRESETS: Record<ImageSizePreset, { label: string, aspect: string }> = {
  square_hd: { label: 'Square HD', aspect: '1:1' },
  square: { label: 'Square', aspect: '1:1' },
  portrait_4_3: { label: 'Portrait (4:3)', aspect: '3:4' },
  portrait_16_9: { label: 'Portrait (16:9)', aspect: '9:16' },
  landscape_4_3: { label: 'Landscape (4:3)', aspect: '4:3' },
  landscape_16_9: { label: 'Landscape (16:9)', aspect: '16:9' }
};

export const OUTPUT_FORMATS = [
  { value: 'jpeg' as const, label: 'JPEG (Smaller size)' },
  { value: 'png' as const, label: 'PNG (Lossless)' }
] as const;

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  prompt: '',
  image_size: 'landscape_4_3',
  num_inference_steps: 28,
  guidance_scale: 3.5,
  loras: [],
  sync_mode: true,
  num_images: 1,
  enable_safety_checker: true,
  output_format: 'jpeg'
};

export const STYLE_PROMPT_TEMPLATES = [
  {
    name: 'Photorealistic',
    template: 'Photorealistic image of {prompt}, high resolution, detailed, professional photography, 8k'
  },
  {
    name: 'Cinematic',
    template: 'Cinematic scene of {prompt}, dramatic lighting, movie still, professional cinematography'
  },
  {
    name: 'Anime',
    template: 'Anime style illustration of {prompt}, vibrant colors, detailed, studio ghibli inspired'
  }
];
