'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateImage } from '@/app/actions';
import { PROMPT_SUGGESTIONS, DEFAULT_IMAGE_SETTINGS, type ImageSettings } from '@/constants/image-generation';
import { GenerationResponse } from '@/types/api';
import DownloadButton from '@/components/DownloadButton';
import ImageSettingsComponent from '@/components/ImageSettings';
import { Alert, AlertDescription } from "@/components/ui/alert";

const ImageGenerationPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [settings, setSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

    const handleAddSuggestion = (suggestion: string) => {
        setPrompt((current) => {
            if (!current.trim()) return suggestion;
            if (current.toLowerCase().includes(suggestion.toLowerCase())) return current;
            return `${current}, ${suggestion.toLowerCase()}`;
        });
    };

    const handleSubmit = async (e: React.MouseEvent) => {
        if (!prompt.trim()) {
            setError('Please provide a description for the image');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setGenerationProgress({
            status: 'starting',
            logs: 'Initializing generation process...',
            started_at: new Date().toISOString()
        });

        try {
            const result = await generateImage({
                prompt,
                ...settings,
                ...(settings.aspect_ratio === 'custom' ? {
                    width: settings.width,
                    height: settings.height
                } : {})
            }) as GenerationResponse;

            if (result.success && result.output) {
                setGeneratedImage(result.output);
                setGenerationProgress(prev => ({
                    ...prev!,
                    status: 'succeeded',
                    logs: result.logs || 'Image generated successfully',
                    metrics: result.metrics,
                    completed_at: new Date().toISOString()
                }));
            } else {
                throw new Error(result.error || 'Failed to generate image');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setError(errorMessage);
            setGenerationProgress(prev => ({
                ...prev!,
                status: 'failed',
                logs: `Error: ${errorMessage}`,
                completed_at: new Date().toISOString()
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col">
            <div className="flex-none p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    Image Generation
                </h1>
                <p className="text-muted-foreground">
                    Create AI-generated images from text descriptions
                </p>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-auto">
                {/* Left Column - Prompt and Suggestions */}
                <div className="h-full flex flex-col gap-4">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Image Description</CardTitle>
                            <CardDescription>
                                Describe what you want to generate
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Description</Label>
                                    <Textarea
                                        id="prompt"
                                        placeholder="Describe the image you want to generate..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="h-32 resize-none"
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
                                                onClick={() => handleAddSuggestion(suggestion)}
                                                className="text-xs"
                                            >
                                                {suggestion}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !prompt.trim()}
                                    className="w-full"
                                >
                                    {isLoading ? 'Generating...' : 'Generate Image'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Column - Image Preview */}
                <div className="h-full flex flex-col gap-4">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Generated Image</CardTitle>
                            <CardDescription>
                                {generatedImage ? prompt : 'Your generated image will appear here'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-4">
                            {generatedImage ? (
                                <div className="space-y-4 w-full">
                                    <div className="relative rounded-lg overflow-hidden">
                                        <img
                                            src={generatedImage}
                                            alt="Generated image"
                                            className="w-full h-auto"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => window.open(generatedImage, '_blank')}
                                            variant="outline"
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
                                <div className="text-center text-muted-foreground">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Your generated image will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {(error || generationProgress) && (
                        <div className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {generationProgress && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                Status: {generationProgress.status.charAt(0).toUpperCase() + generationProgress.status.slice(1)}
                                            </p>
                                            {generationProgress.metrics?.predict_time && (
                                                <p className="text-sm text-muted-foreground">
                                                    Generation time: {generationProgress.metrics.predict_time.toFixed(2)}s
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {generationProgress.logs}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column - Settings */}
                <div className="h-full flex flex-col gap-4">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Generation Settings</CardTitle>
                            <CardDescription>
                                Customize your image generation parameters
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <ImageSettingsComponent 
                                    settings={settings}
                                    onSettingsChange={setSettings}
                                />
                                
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerationPage;
