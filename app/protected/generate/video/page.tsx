// app/protected/generate/video/page.tsx
'use client';

import { useState } from 'react';
import { VideoIcon } from 'lucide-react';
import { VideoInputColumn } from '@/components/VideoInputColumn';
import { VideoPreviewColumn } from '@/components/VideoPreviewColumn';
import { VideoSettingsColumn } from '@/components/VideoSettingsColumn';

import {
    VideoSettings,
    DEFAULT_VIDEO_SETTINGS,
    VideoGenerationRequest,
    VideoGenerationResponse,
    VideoStatusResponse,
    VideoFileResponse,
    API_ERROR_CODES,
    GenerationProgress
} from '@/types/video-generation';

const VideoGenerationPage = () => {
    // Core state management
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [settings, setSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
        status: 'idle',
        message: '',
        timestamp: new Date().toISOString()
    });

    // File state
    const [firstFrame, setFirstFrame] = useState<File | null>(null);
    const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null);

    // Helper functions
    const imageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleGenerationTypeChange = (value: 'image' | 'text') => {
        setSettings(prev => ({
            ...prev,
            generation_type: value
        }));
        if (value === 'text') {
            setFirstFrame(null);
            setFirstFramePreview(null);
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

    const pollGenerationStatus = async (taskId: string): Promise<string> => {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/video/status?task_id=${taskId}`,
                    { credentials: 'include' }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: VideoStatusResponse = await response.json();
                const progress = Math.min((attempts / maxAttempts) * 100, 90);

                setGenerationProgress(prev => ({
                    ...prev,
                    status: data.status === 'Success' ? 'completed'
                        : data.status === 'Failed' ? 'failed'
                            : data.status.toLowerCase() as 'preparing' | 'processing',
                    message: `Status: ${data.status} (${Math.round(progress)}%)`,
                    progress,
                    timestamp: new Date().toISOString()
                }));

                if (data.status === 'Success' && data.file_id) {
                    return data.file_id;
                }

                if (data.status === 'Failed') {
                    throw new Error(data.base_resp.status_msg || 'Video generation failed');
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;

            } catch (error) {
                console.error('Error in pollGenerationStatus:', error);
                throw error;
            }
        }

        throw new Error('Generation timed out');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

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

            const requestData = {
                model: settings.model,
                prompt: prompt.trim() || undefined,
                prompt_optimizer: settings.prompt_optimizer,
                first_frame_image: undefined as string | undefined
            } satisfies VideoGenerationRequest;

            if (settings.generation_type === 'image' && firstFrame) {
                requestData.first_frame_image = await imageToBase64(firstFrame);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/generate`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.base_resp?.status_msg || 'Failed to start generation');
            }

            const data: VideoGenerationResponse = await response.json();
            const fileId = await pollGenerationStatus(data.task_id);

            const videoResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/video/retrieve?file_id=${fileId}`,
                { credentials: 'include' }
            );

            if (!videoResponse.ok) {
                throw new Error('Failed to get video URL');
            }

            const videoData: VideoFileResponse = await videoResponse.json();
            setGeneratedVideo(videoData.download_url);

            setGenerationProgress(prev => ({
                ...prev,
                status: 'completed',
                message: 'Video generated successfully!',
                progress: 100
            }));

        } catch (err) {
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
        <div className="min-h-screen flex flex-col">
            {/* Warning Banner */}
            <div className="bg-yellow-200 text-yellow-900 text-center p-2 font-semibold">
                ⚠️ This feature is currently under development and may not function as expected.
            </div>

            {/* Header */}
            <div className="flex-none p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <VideoIcon className="w-8 h-8" />
                        Video Generation
                    </h1>
                    <p className="text-muted-foreground">
                        Create AI-generated videos from {settings.generation_type === 'image' ? 'images' : 'text descriptions'}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-3 gap-4">
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

                        <VideoPreviewColumn
                            generatedVideo={generatedVideo}
                            error={error}
                            generationProgress={generationProgress}
                            prompt={prompt}
                        />

                        <VideoSettingsColumn
                            settings={settings}
                            onSettingsChange={setSettings}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerationPage;
