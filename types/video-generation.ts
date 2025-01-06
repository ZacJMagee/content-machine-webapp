// types/video-generation.ts

// Request interfaces
export interface VideoGenerationRequest {
    model: 'video-01';  // Currently only supports 'video-01'
    prompt?: string;    // Optional for image-to-video
    prompt_optimizer?: boolean;
    first_frame_image?: string;  // Base64 encoded image
    callback_url?: string;       // Optional for real-time updates
}
export interface GenerationProgress {
    status: 'idle' | 'preparing' | 'processing' | 'completed' | 'failed';
    message: string;
    timestamp: string;
    progress?: number;
}


// Response interfaces
export interface VideoGenerationResponse {
    task_id: string;
    base_resp: {
        status_code: number;
        status_msg: string;
    };
}

export interface VideoStatusResponse {
    task_id: string;
    status: 'Preparing' | 'Processing' | 'Success' | 'Failed';
    file_id?: string;
    base_resp: {
        status_code: number;
        status_msg: string;
    };
}

export interface VideoFileResponse {
    file_id: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
    base_resp: {
        status_code: number;
        status_msg: string;
    };
}

// Error codes mapping
export const API_ERROR_CODES = {
    0: 'Success',
    1000: 'Unknown error',
    1001: 'Timeout',
    1002: 'Rate limit exceeded',
    1004: 'Authentication failed',
    1008: 'Insufficient account balance',
    1013: 'Internal service error',
    1026: 'Video description contains sensitive content',
    1027: 'Generated video contains sensitive content',
    1039: 'Rate limit of tokens exceeded',
    2013: 'Invalid parameters'
} as const;

// Generation settings interface
export interface VideoSettings {
    prompt_optimizer: boolean;
    generation_type: 'image' | 'text';
    model: 'video-01';
    promptOptimizer?: boolean;
    showAdvanced?: boolean;
    callbackUrl?: string;
    generationType?: 'image' | 'text';
}

// Alias for backward compatibility
export type GenerationSettings = VideoSettings;

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
    prompt_optimizer: true,
    generation_type: 'image',
    model: 'video-01'
};
