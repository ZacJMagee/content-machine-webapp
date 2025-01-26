// File: types/image-generation.ts

// 1. Basic Types and Enums
export type ImageSize = 
  | 'square_hd' 
  | 'square' 
  | 'portrait_4_3' 
  | 'portrait_16_9' 
  | 'landscape_4_3' 
  | 'landscape_16_9' 
  | { width: number; height: number };

export type QueueStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

// 2. Input-related Interfaces
export interface LoraWeight {
  path: string;   // URL or path to the LoRA weights
  scale: number;  // Default: 1
}

export interface GenerationInput {
  prompt: string;
  image_size?: ImageSize;            // Default: landscape_4_3
  num_inference_steps?: number;      // Default: 28
  seed?: number;
  loras?: LoraWeight[];             // Default: []
  guidance_scale?: number;          // Default: 3.5
  num_images?: number;              // Default: 1
  enable_safety_checker?: boolean;  // Default: true
  output_format?: 'jpeg' | 'png';   // Default: jpeg
}

// 3. Output and Response Interfaces
export interface GeneratedImage {
  url: string;
  content_type: string;  // e.g., "image/jpeg"
  width?: number;        // Optional for custom sizes
  height?: number;       // Optional for custom sizes
}

export interface GenerationResponse {
  images: GeneratedImage[];
  prompt: string;
  seed?: number;
  has_nsfw_concepts?: boolean[];
  timings?: Record<string, number>;
}

// 4. Queue-related Interfaces
export interface QueueResponse {
  request_id: string;
}

export interface LogMessage {
  message: string;
}

export interface QueueStatusResponse {
  status: QueueStatus;
  logs?: LogMessage[];
  error?: string;
  output?: {
    error?: string;
    images?: GeneratedImage[];
    seed?: number;
  };
}

// 5. UI-specific Interfaces (for client-side use)
export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'progress' | 'success' | 'error';
}

// 6. API Response Types
export interface StatusResponseBody {
  status: string;
  progress: number;
  logs?: string[];
  error?: string;
  result?: GenerationResponse;
}
