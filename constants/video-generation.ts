// constants/video-generation.ts

export interface VideoSettings {
    prompt_optimizer: boolean;     // Controls automatic prompt optimization
    generation_type: 'image' | 'text';  // Type of generation
    model: 'video-01';            // Currently only supports video-01
}

// Default settings that match the API's defaults
export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
    prompt_optimizer: true,
    generation_type: 'image',
    model: 'video-01'
};

// Validation requirements from the API
export const VIDEO_REQUIREMENTS = {
    maxFileSize: 20 * 1024 * 1024,  // 20MB in bytes
    supportedFormats: ['image/jpeg', 'image/jpg', 'image/png'],
    minDimension: 300,
    aspectRatioMin: 0.4,  // 2:5
    aspectRatioMax: 2.5,  // 5:2
    maxPromptLength: 2000
} as const;

// Prompt suggestions for consistent style
export const PROMPT_SUGGESTIONS = [
    "Cinematic",
    "Slow Motion",
    "Fast Paced",
    "Dreamy",
    "Abstract",
    "Nature",
    "Urban",
    "Artistic",
    "Dramatic",
    "Smooth Transition"
] as const;
