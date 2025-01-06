// types/image-generation.ts

export interface ImageSettings {
  aspect_ratio: string;
  width?: number;
  height?: number;
  prompt_strength: number;
  model: 'dev' | 'schnell';
  num_outputs: number;
  num_inference_steps: number;
  guidance_scale: number;
  seed?: number;
  output_format: 'webp' | 'jpg' | 'png';
  output_quality: number;
  go_fast: boolean;
  megapixels: '1' | '0.25';
  lora_scale: number;
  extra_lora?: string;
  extra_lora_scale: number;
}
// Add the GenerationProgress interface
export interface GenerationProgress {
    status: 'starting' | 'succeeded' | 'failed';
    logs: string;
    started_at: string;
    completed_at?: string;
    metrics?: {
        predict_time: number;
    };
}

// Also add this interface if it's not already in your types/api.ts
export interface GenerationResponse {
    success: boolean;
    output?: string;
    error?: string;
    logs?: string;
    metrics?: {
        predict_time: number;
    };
}


export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  aspect_ratio: '1:1',
  prompt_strength: 0.8,
  model: 'dev',
  num_outputs: 1,
  num_inference_steps: 28,
  guidance_scale: 3,
  output_format: 'webp',
  output_quality: 80,
  go_fast: false,
  megapixels: '1',
  lora_scale: 1,
  extra_lora_scale: 1
};

// Prompt suggestions for different styles
export const PROMPT_SUGGESTIONS = [
  'Cinematic',
  'Photorealistic',
  'Digital Art',
  'Oil Painting',
  'Watercolor',
  'Pencil Sketch',
  'Anime Style',
  'Comic Book',
  'Low Poly',
  'Pixel Art'
];
