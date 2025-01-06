// constants/image-generation.ts

export type PromptSuggestion = string;

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  "A serene landscape with mountains",
  "A futuristic cityscape at night",
  "An abstract pattern with vibrant colors",
  "A photorealistic portrait",
  "A whimsical fantasy scene",
  "A detailed architectural rendering",
  "A nature close-up with bokeh effect",
  "A minimalist geometric composition"
];

export interface ImageSettings {
  model: string;
  go_fast: boolean;
  lora_scale: number;
  megapixels: string;
  num_outputs: number;
  aspect_ratio: string;
  output_format: string;
  guidance_scale: number;
  output_quality: number;
  prompt_strength: number;
  extra_lora_scale: number;
  num_inference_steps: number;
}

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  model: "dev",
  go_fast: false,
  lora_scale: 1,
  megapixels: "1",
  num_outputs: 1,
  aspect_ratio: "1:1",
  output_format: "webp",
  guidance_scale: 3,
  output_quality: 80,
  prompt_strength: 0.8,
  extra_lora_scale: 1,
  num_inference_steps: 28
};
