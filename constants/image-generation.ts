// constants/image-generation.ts
import { ImageSettings } from '../types/image-generation';

export type PromptSuggestion = string;

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  "An image of hazellora looking at the camera",
  "An image of hazellora looking out over the mountians, DLSR, UHD",
  "An image of hazellora on a beach with a smile",
  "A photorealistic portrait of hazellora",
  "hazellora in a dance studio",
  "hazellora holding a bunch of wild flowers",
  "hazellora",
  "hazellora sitting on the beach"
];

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

export type { ImageSettings } from '../types/image-generation';

