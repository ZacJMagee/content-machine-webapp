'use client';

import { useState } from 'react';
import { VideoIcon } from 'lucide-react';
import { VideoInputColumn } from '@/components/VideoInputColumn';
import { VideoPreviewColumn } from '@/components/VideoPreviewColumn';
import { VideoSettingsColumn } from '@/components/VideoSettingsColumn';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

import {
    VideoSettings,
    DEFAULT_VIDEO_SETTINGS,
    VideoGenerationRequest,
    VideoGenerationResponse,
    VideoStatusResponse,
    VideoFileResponse,
    GenerationProgress
} from '@/types/video-generation';

// API Constants based on documentation
const API_CONFIG = {
    baseUrl: 'https://api.minimaxi.chat/v1',
    endpoints: {
        generate: '/video_generation',
        status: '/query/video_generation',
        retrieve: '/files/retrieve'
    },
    statuses: {
        PREPARING: 'Preparing',
        PROCESSING: 'Processing',
        SUCCESS: 'Success',
        FAIL: 'Fail'
    },
    errorCodes: {
        SUCCESS: 0,
        RATE_LIMIT: 1002,
        AUTH_FAILED: 1004,
        INSUFFICIENT_BALANCE: 1008,
        INVALID_PARAMS: 1013,
        SENSITIVE_CONTENT: 1026,
        INVALID_API_KEY: 2049
    },
    polling: {
        maxAttempts: 120,
        interval: 1000,
        timeout: 120000 // 2 minutes
    }
};

// Logging utility for better debugging
const debugLog = (context: string, data: any) => {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [${context}]`, JSON.stringify(data, null, 2));
};

const VideoGenerationPage = () => {
    // Core state management
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<VideoFileResponse | null>(null);
    const [settings, setSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
        status: 'idle',
        message: '',
        timestamp: new Date().toISOString()
    });

    // File state
    const [firstFrame, setFirstFrame] = useState<File | null>(null);
    const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null);

    // Helper function to make API requests with proper error handling
    const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
        const requestId = Math.random().toString(36).substring(7);
        const url = `${API_CONFIG.baseUrl}${endpoint}`;

        debugLog('API Request', {
            requestId,
            url,
            method: options.method || 'GET'
        });

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_KEY}`,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            debugLog('API Response', { requestId, data });

            // Check for API-specific error codes
            if (data.base_resp?.status_code !== API_CONFIG.errorCodes.SUCCESS) {
                throw new Error(getErrorMessage(data.base_resp?.status_code));
            }

            return data;
        } catch (error) {
            debugLog('API Error', { requestId, error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    };

    // Helper function for handling error codes
    const getErrorMessage = (code: number): string => {
        const errorMessages: Record<number, string> = {
            [API_CONFIG.errorCodes.RATE_LIMIT]: 'Rate limit exceeded. Please try again later.',
            [API_CONFIG.errorCodes.AUTH_FAILED]: 'Authentication failed. Please check your API key.',
            [API_CONFIG.errorCodes.INSUFFICIENT_BALANCE]: 'Insufficient account balance.',
            [API_CONFIG.errorCodes.INVALID_PARAMS]: 'Invalid parameters provided.',
            [API_CONFIG.errorCodes.SENSITIVE_CONTENT]: 'Content flagged as sensitive.',
            [API_CONFIG.errorCodes.INVALID_API_KEY]: 'Invalid API key.',
        };
        return errorMessages[code] || 'An unknown error occurred';
    };

    // Helper function for base64 conversion
    const imageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Function to poll for video generation status
    const pollGenerationStatus = async (taskId: string): Promise<string> => {
        const MAX_POLL_TIME = 15 * 60 * 1000;  // 15 minutes in milliseconds
        const POLL_INTERVAL = 2000;             // 2 seconds between polls
        let attempts = 0;
        const startTime = Date.now();

        while (Date.now() - startTime < MAX_POLL_TIME) {
            try {
                const data = await makeApiRequest(`${API_CONFIG.endpoints.status}?task_id=${taskId}`);

                const elapsed = Date.now() - startTime;
                attempts++;

                // Log current status
                debugLog('Progress Update', {
                    taskId,
                    status: data.status,
                    progress: getProgressFromStatus(data.status, elapsed, MAX_POLL_TIME),
                    attempt: attempts,
                    elapsed
                });

                // Update UI progress
                setGenerationProgress(prev => ({
                    ...prev,
                    status: data.status.toLowerCase() as GenerationProgress['status'],
                    message: `Status: ${data.status}`,
                    progress: getProgressFromStatus(data.status, elapsed, MAX_POLL_TIME),
                    timestamp: new Date().toISOString()
                }));

                if (data.status === API_CONFIG.statuses.SUCCESS && data.file_id) {
                    return data.file_id;
                }

                if (data.status === API_CONFIG.statuses.FAIL) {
                    throw new Error(data.base_resp.status_msg || 'Video generation failed');
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            } catch (error) {
                debugLog('Polling Error', {
                    taskId,
                    attempt: attempts,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        }

        throw new Error(`Video generation timed out after ${MAX_POLL_TIME / 1000 / 60} minutes`);
    };

    // Helper function to calculate progress
    const getProgressFromStatus = (status: string, elapsed: number, maxTime: number): number => {
        switch (status) {
            case API_CONFIG.statuses.PREPARING:
                return Math.min(25, (elapsed / maxTime) * 100);
            case API_CONFIG.statuses.PROCESSING:
                // Scale from 25% to 95% based on elapsed time
                const progressPercent = (elapsed / maxTime) * 70;  // 70% range (95-25)
                return Math.min(95, 25 + progressPercent);
            case API_CONFIG.statuses.SUCCESS:
                return 100;
            case API_CONFIG.statuses.FAIL:
                return 0;
            default:
                return 0;
        }
    };

    // Event handlers
    const handleGenerationTypeChange = (value: 'image' | 'text') => {
        setSettings(prev => ({
            ...prev,
            generation_type: value
        }));
        if (value === 'text') {
            handleRemoveImage();
        }
        setError(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            setError('File size exceeds 20MB limit');
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setError('Unsupported file format. Please use JPG, JPEG, or PNG');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            if (img.width < 300 || img.height < 300) {
                setError('Image must be at least 300px on each side');
                URL.revokeObjectURL(previewUrl);
                return;
            }

            const aspectRatio = img.width / img.height;
            if (aspectRatio < 0.4 || aspectRatio > 2.5) {
                setError('Image aspect ratio must be between 2:5 and 5:2');
                URL.revokeObjectURL(previewUrl);
                return;
            }

            setFirstFrame(file);
            setFirstFramePreview(previewUrl);
            setError(null);
        };

        img.onerror = () => {
            setError('Failed to load image. Please try another file.');
            URL.revokeObjectURL(previewUrl);
        };

        img.src = previewUrl;
    };

    const handleRemoveImage = () => {
        if (firstFramePreview) {
            URL.revokeObjectURL(firstFramePreview);
        }
        setFirstFrame(null);
        setFirstFramePreview(null);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVideoData(null);

        if (settings.generation_type === 'image' && !firstFrame) {
            setError('Please upload an image first');
            return;
        }

        if (settings.generation_type === 'text' && !prompt.trim()) {
            setError('Please provide a description');
            return;
        }

        try {
            setIsLoading(true);
            setGenerationProgress({
                status: 'preparing',
                message: 'Initializing video generation...',
                timestamp: new Date().toISOString(),
                progress: 0
            });

            const requestData: VideoGenerationRequest = {
                model: 'video-01',
                prompt: prompt.trim() || undefined,
                prompt_optimizer: settings.prompt_optimizer
            };

            if (settings.generation_type === 'image' && firstFrame) {
                debugLog('Processing Image', {
                    fileName: firstFrame.name,
                    fileSize: firstFrame.size,
                    fileType: firstFrame.type
                });
                requestData.first_frame_image = await imageToBase64(firstFrame);
            }

            // Generate video
            const generationResponse = await makeApiRequest(API_CONFIG.endpoints.generate, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            // Poll for completion
            const fileId = await pollGenerationStatus(generationResponse.task_id);

            // Retrieve video URL
            const videoResponse = await makeApiRequest(
                `${API_CONFIG.endpoints.retrieve}?group_id=${process.env.NEXT_PUBLIC_GROUP_ID}&file_id=${fileId}`
            ) as VideoFileResponse;

            setVideoData(videoResponse);
            setGenerationProgress({
                status: 'completed',
                message: 'Video generated successfully!',
                progress: 100,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            debugLog('Generation Error', {
                error: err instanceof Error ? err.message : 'Unknown error'
            });

            setError(err instanceof Error ? err.message : 'Failed to generate video');
            setGenerationProgress(prev => ({
                ...prev,
                status: 'failed',
                message: 'Generation failed. Please try again.',
            }));
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex-1 overflow-auto bg-[#0a0a0f]">

            {/* Header */}
            <div className="p-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <VideoIcon className="w-8 h-8" />
                    Video Generation
                </h2>
                <p className="text-gray-400 mt-2">
                    Create AI-generated videos from {settings.generation_type === 'image' ? 'images' : 'text descriptions'}
                </p>
            </div>

            {/* Main Content */}
            <div className="p-8 pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3">
                        <VideoInputColumn
                            settings={settings}
                            prompt={prompt}
                            isLoading={isLoading}
                            firstFrame={firstFrame}
                            firstFramePreview={firstFramePreview}
                            onPromptChange={setPrompt}
                            onGenerationTypeChange={handleGenerationTypeChange}
                            onImageUpload={handleImageUpload}
                            onImageRemove={handleRemoveImage}
                            onSubmit={handleSubmit}
                        />
                    </div>

                    <div className="lg:col-span-6">
                        <VideoPreviewColumn
                            generatedVideo={videoData?.file?.download_url || null}
                            error={error}
                            generationProgress={generationProgress}
                            prompt={prompt}
                        />
                    </div>

                    <div className="lg:col-span-3">
                        <VideoSettingsColumn
                            settings={settings}
                            onSettingsChange={setSettings}
                            firstFrame={firstFrame}
                            isLoading={isLoading}
                            videoUrl={videoData?.file?.download_url}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerationPage;

