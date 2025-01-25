'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateImage } from '@/app/actions';
import { PROMPT_SUGGESTIONS, DEFAULT_IMAGE_SETTINGS } from '@/constants/image-generation';
import type { ImageSettings } from '@/types/image-generation';
import type { GenerationResponse } from '@/types/api';
import DownloadButton from '@/components/DownloadButton';
import ImageSettingsComponent from '@/components/ImageSettings';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GenerationProgress {
    status: 'starting' | 'succeeded' | 'failed';
    logs: string;
    started_at: string;
    completed_at?: string;
    metrics?: {
        predict_time: number;
    };
}

function ImageGenerationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [settings, setSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

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

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        
        const startProgress: GenerationProgress = {
            status: 'starting',
            logs: 'Initializing generation process...',
            started_at: new Date().toISOString()
        };
        setGenerationProgress(startProgress);

        try {
            const result = await generateImage({
                prompt,
                ...settings,
                ...(settings.aspect_ratio === 'custom' && settings.width && settings.height ? {
                    width: settings.width,
                    height: settings.height
                } : {})
            }) as GenerationResponse;

            if (result.success && result.output) {
                setGeneratedImage(result.output);
                const metrics = result.metrics?.predict_time 
                    ? { predict_time: result.metrics.predict_time }
                    : undefined;
                    
                setGenerationProgress({
                    status: 'succeeded',
                    logs: result.logs || 'Image generated successfully',
                    started_at: startProgress.started_at,
                    completed_at: new Date().toISOString(),
                    metrics
                });
            } else {
                throw new Error(result.error || 'Failed to generate image');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setError(errorMessage);
            setGenerationProgress({
                status: 'failed',
                logs: `Error: ${errorMessage}`,
                started_at: startProgress.started_at,
                completed_at: new Date().toISOString()
            });
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

                            <div className="space-y-2">
                                <Label>Style Suggestions</Label>
                                <div className="flex flex-wrap gap-2">
                                    {PROMPT_SUGGESTIONS.map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleAddSuggestion(suggestion)}
                                            className="text-xs border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50"
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
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

                        {generationProgress && (
                            <Card className="border-gray-800/50 bg-black/20 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">
                                            Status: {generationProgress.status.charAt(0).toUpperCase() + generationProgress.status.slice(1)}
                                        </p>
                                        {generationProgress.metrics?.predict_time && (
                                            <p className="text-sm text-gray-400">
                                                Generation time: {generationProgress.metrics.predict_time.toFixed(2)}s
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">
                                        {generationProgress.logs}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
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
