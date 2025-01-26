'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateImage } from '@/app/actions';
import { DEFAULT_IMAGE_SETTINGS } from '@/constants/image-generation';
import type { GenerationResponse } from '@/types/api';
import DownloadButton from '@/components/DownloadButton';
import ImageSettingsComponent from '@/components/ImageSettings';
import { Alert, AlertDescription } from "@/components/ui/alert";
import GenerationLogs, { LogEntry } from '@/components/GenerationLogs';
import { fal } from "@fal-ai/client";

import {
    FluxLoraInput,
    FluxLoraOutput,
    QueueStatusUpdate,
    ImageSettings
} from '@/types/image-generation';

type QueueStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
interface LogMessage {
    message: string;
}

interface QueueStatusResponse {
    status: QueueStatus;
    logs?: LogMessage[];
    output?: any;
}

interface QueueUpdate {
    status: QueueStatus;
    logs?: Array<{
        message: string;
    }>;
    error?: string;
    output?: {
        error?: string;
    };
}
// Keep your existing interface
interface GenerationProgress {
    status: 'starting' | 'succeeded' | 'failed';
    logs: string;
    started_at: string;
    completed_at?: string;
    metrics?: {
        predict_time: number;
    };
}

// Define the endpoint type for fal-ai/flux-lora
export interface FluxLoraEndpoint {
    input: FluxLoraInput;
    output: FluxLoraOutput;  // Note: Changed from 'response' to 'output'
}

function ImageGenerationPage() {
    // Existing state
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [settings, setSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

    // New state for detailed logs
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);

    // Helper function to add logs
    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        setLogs(prevLogs => [...prevLogs, {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        }]);
    };

    const handleAddSuggestion = (suggestion: string) => {
        setPrompt((current) => {
            if (!current.trim()) return suggestion;
            if (current.toLowerCase().includes(suggestion.toLowerCase())) return current;
            return `${current}, ${suggestion.toLowerCase()}`;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            setError('Please provide a description for the image');
            return;
        }

        // Reset states
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setLogs([]);
        setProgress(0);
        setStatus('STARTING');

        try {
            addLog('Starting image generation...', 'info');

            // Step 1: Submit the generation request
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    image_size: 'landscape_4_3',
                    num_inference_steps: 28,
                    guidance_scale: 3.5,
                    num_images: 1,
                    enable_safety_checker: true,
                    output_format: 'jpeg',
                    sync_mode: false // Important: we're using queue mode
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit generation request');
            }

            const { request_id }: QueueResponse = await response.json();

            if (!request_id) {
                throw new Error('No request ID received');
            }

            addLog('Request submitted successfully', 'info');

            // Step 2: Poll for status updates
            let completed = false;
            while (!completed) {
                // Wait 1 second between polls
                await new Promise(resolve => setTimeout(resolve, 1000));

                const statusResponse = await fetch(`/api/generate-image/status?requestId=${request_id}`);
                if (!statusResponse.ok) {
                    throw new Error('Failed to check generation status');
                }

                const statusData = await statusResponse.json();

                // Update UI based on status
                setStatus(statusData.status);
                setProgress(statusData.progress);

                // Handle logs if any
                if (statusData.logs) {
                    statusData.logs.forEach((message: string) => {
                        addLog(message, 'progress');
                    });
                }

                // Check if the generation is complete
                if (statusData.status === 'completed' && statusData.result) {
                    completed = true;
                    const result = statusData.result as GenerationResponse;

                    if (!result.images?.[0]?.url) {
                        throw new Error('No image URL in completed result');
                    }

                    setGeneratedImage(result.images[0].url);
                    addLog('Image generated successfully!', 'success');

                    if (result.seed) {
                        addLog(`Generation seed: ${result.seed}`, 'info');
                    }
                }

                // Check for failure
                if (statusData.status === 'failed') {
                    throw new Error(statusData.error || 'Generation failed');
                }
            }

        } catch (error) {
            console.error('Generation error:', error);

            const errorMessage = error instanceof Error
                ? error.message
                : 'An unexpected error occurred';

            setError(errorMessage);
            addLog(errorMessage, 'error');
            setStatus('FAILED');
            setProgress(0);

        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex-1 overflow-auto bg-[#0a0a0f] p-8">
            {/* Page Title */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    Image Generation
                </h2>
                <p className="text-gray-400 mt-2">
                    Create AI-generated images from text descriptions
                </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Column */}
                <Card className="lg:col-span-3 lg:sticky lg:top-8 self-start border-gray-800/50 bg-black/20 backdrop-blur-sm">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-xl">Image Description</CardTitle>
                        <CardDescription className="text-gray-400">
                            Describe what you want to generate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="prompt">Description</Label>
                                <Textarea
                                    id="prompt"
                                    placeholder="Describe the image you want to generate..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="h-32 resize-none bg-gray-900/50 border-gray-800/50"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !prompt.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                            >
                                {isLoading ? 'Generating...' : 'Generate Image'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Preview Column */}
                <Card className="lg:col-span-6 min-h-[700px] border-gray-800/50 bg-black/20 backdrop-blur-sm">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-xl">Generated Image</CardTitle>
                        <CardDescription className="text-gray-400">
                            {generatedImage ? prompt : 'Your generated image will appear here'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="min-h-[500px] flex items-center justify-center rounded-lg border border-gray-800/50 bg-gray-900/20 p-4">
                            {generatedImage ? (
                                <div className="space-y-4 w-full p-2">
                                    <div className="relative rounded-lg overflow-hidden bg-gray-900/50">
                                        <img
                                            src={generatedImage}
                                            alt={prompt}
                                            className="w-full h-auto object-contain max-h-[600px]"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => window.open(generatedImage, '_blank')}
                                            variant="outline"
                                            className="border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50"
                                        >
                                            Open Full Size
                                        </Button>
                                        <DownloadButton
                                            imageUrl={generatedImage}
                                            prompt={prompt}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-4">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Your generated image will appear here</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-red-400">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Generation Logs Component */}
                        <GenerationLogs
                            logs={logs}
                            status={status}
                            progress={progress}
                        />
                    </CardContent>
                </Card>

                {/* Settings Column */}
                <Card className="lg:col-span-3 lg:sticky lg:top-8 self-start border-gray-800/50 bg-black/20 backdrop-blur-sm">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-xl">Generation Settings</CardTitle>
                        <CardDescription className="text-gray-400">
                            Customize your image generation parameters
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <ImageSettingsComponent
                            settings={settings}
                            onSettingsChange={setSettings}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default ImageGenerationPage;
