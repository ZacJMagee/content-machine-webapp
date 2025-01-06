'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateImage } from '@/app/actions';
import { PROMPT_SUGGESTIONS, DEFAULT_IMAGE_SETTINGS, type ImageSettings } from '@/constants/image-generation';
import { GenerationResponse } from '@/types/api';
import DownloadButton from '@/components/DownloadButton';
import ImageSettingsComponent from '@/components/ImageSettings';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GenerationProgress {
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  logs: string;
  metrics?: {
    predict_time?: number;
  };
  started_at: string;
  completed_at?: string;
}

const ImageGenerationPage = () => {
    // Core state management with explicit types for better type safety
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [settings, setSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

    // Handle prompt suggestions
    const handleAddSuggestion = (suggestion: string) => {
        setPrompt((current) => {
            if (!current.trim()) return suggestion;
            // Avoid duplicate style suggestions
            if (current.toLowerCase().includes(suggestion.toLowerCase())) return current;
            return `${current}, ${suggestion.toLowerCase()}`;
        });
    };

    // Handle form submission with improved error handling and progress tracking
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate inputs
        if (!prompt.trim()) {
            setError('Please provide a description for the image');
            return;
        }

        // Reset states and initialize progress
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setGenerationProgress({
            status: 'starting',
            logs: 'Initializing generation process...',
            started_at: new Date().toISOString()
        });

        try {
            // Update progress to processing
            setGenerationProgress(prev => ({
                ...prev!,
                status: 'processing',
                logs: 'Processing image generation...'
            }));

            // Call the image generation API with all settings
            const result = await generateImage({
                prompt,
                ...settings,
                // Ensure custom size settings are included when needed
                ...(settings.aspect_ratio === 'custom' ? {
                    width: settings.width,
                    height: settings.height
                } : {})
            }) as GenerationResponse;

            if (result.success && result.output) {
                // Handle successful generation
                setGeneratedImage(result.output);
                setGenerationProgress(prev => ({
                    ...prev!,
                    status: 'succeeded',
                    logs: result.logs || 'Image generated successfully',
                    metrics: result.metrics,
                    completed_at: new Date().toISOString()
                }));
            } else {
                // Handle generation failure
                throw new Error(result.error || 'Failed to generate image');
            }
        } catch (error) {
            // Enhanced error handling
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'An unexpected error occurred during image generation';
            
            setError(errorMessage);
            console.error('Image generation error:', error);
            
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
        <div className="flex-1 w-full flex flex-col gap-8 p-8">
            {/* Page Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    Image Generation
                </h1>
                <p className="text-muted-foreground">
                    Create AI-generated images from text descriptions
                </p>
            </div>

            {/* Image Generation Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New Image</CardTitle>
                    <CardDescription>
                        Describe the image you want to generate and customize the settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Prompt Input Section */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Description</Label>
                            <Textarea
                                id="prompt"
                                placeholder="Describe the image you want to generate..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="h-32 resize-none"
                                required
                            />
                        </div>

                        {/* Style Suggestions */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Style Suggestions</Label>
                            <div className="flex flex-wrap gap-2">
                                {PROMPT_SUGGESTIONS.map((suggestion) => (
                                    <Button
                                        key={suggestion}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddSuggestion(suggestion)}
                                        className="text-xs"
                                        type="button"
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Settings Component */}
                        <ImageSettingsComponent 
                            settings={settings}
                            onSettingsChange={setSettings}
                        />

                        {/* Error Display */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Generation Progress Display */}
                        {generationProgress && (
                            <div className="space-y-2 p-4 bg-muted rounded-lg">
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
                                <p className="text-sm text-muted-foreground">
                                    {generationProgress.logs}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading || !prompt.trim()}
                            className="w-full"
                        >
                            {isLoading ? 'Generating...' : 'Generate Image'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Generated Image Display */}
            {generatedImage && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Image</CardTitle>
                        <CardDescription>
                            {prompt}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden">
                            <img
                                src={generatedImage}
                                alt="Generated image"
                                className="w-full max-w-2xl mx-auto"
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
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ImageGenerationPage;
