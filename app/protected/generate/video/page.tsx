'use client';

// React and Core imports
import { useState } from 'react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";


// Icons
import {
    VideoIcon,
    ImageIcon,
    Settings2,
    ChevronDown,
    ChevronUp,
    XIcon,
    AlertCircle
} from "lucide-react";

// Project Constants and Types

import { VIDEO_REQUIREMENTS } from '@/constants/video-generation';

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;
type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number];


// First, let's define proper types based on the API documentation
interface VideoGenerationResponse {
  task_id: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface VideoStatusResponse {
  task_id: string;
  status: 'Preparing' | 'Processing' | 'Success' | 'Fail';  // Note: API uses 'Fail' not 'Failed'
  file_id?: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface VideoUrlResponse {
    file_id: string;
    download_url: string;
    filename: string;
    base_resp: {
        status_code: number;
        status_msg: string;
    };
}

// Core state interfaces
interface GenerationSettings {
    generationType: 'image' | 'text';
    promptOptimizer: boolean;
    callbackUrl: string;
    showAdvanced: boolean;
}

interface GenerationProgress {
    status: 'idle' | 'preparing' | 'processing' | 'completed' | 'failed';
    message: string;
    timestamp: string;
    progress?: number;
}

const VideoGenerationPage = () => {
    // Core state management
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
        status: 'idle',
        message: '',
        timestamp: new Date().toISOString()
    });

    // Settings and image state
    const [settings, setSettings] = useState<GenerationSettings>({
        generationType: 'image',
        promptOptimizer: true,
        callbackUrl: '',
        showAdvanced: false,
    });
    const [firstFrame, setFirstFrame] = useState<File | null>(null);
    const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null);
    // First, let's create a mapping function to convert API status to our internal status
    // Update our status mapping function to match exact API responses
const mapApiStatusToInternalStatus = (apiStatus: string): GenerationProgress['status'] => {
  switch (apiStatus) {
    case 'Preparing':
      return 'preparing';
    case 'Processing':
      return 'processing';
    case 'Success':
      return 'completed';
    case 'Fail':  // API uses 'Fail' not 'Failed'
      return 'failed';
    default:
      return 'idle';
  }
};

// Now let's update our polling function
const pollGenerationStatus = async (taskId: string): Promise<string> => {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `https://api.minimaxi.chat/v1/query/video_generation?task_id=${taskId}`,
        {
          headers: {
            'authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_TOKEN}`,
            'content-type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VideoStatusResponse = await response.json();
      console.log('Status Response:', data); // Debug log

      // Check for base response status first
      if (data.base_resp.status_code !== 0) {
        throw new Error(data.base_resp.status_msg || 'API returned an error');
      }

      const progress = Math.min((attempts / maxAttempts) * 100, 90);
      
      // Update progress using the exact status from API
      setGenerationProgress(prev => ({
        ...prev,
        status: mapApiStatusToInternalStatus(data.status),
        message: `Status: ${data.status} (${Math.round(progress)}%)`,
        progress,
        timestamp: new Date().toISOString()
      }));

      // Handle different statuses
      if (data.status === 'Success' && data.file_id) {
        return data.file_id;
      }

      if (data.status === 'Fail') {
        throw new Error(data.base_resp.status_msg || 'Video generation failed');
      }

      // Continue polling for 'Preparing' and 'Processing' statuses
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

    } catch (error) {
      console.error('Error in pollGenerationStatus:', error);
      // Preserve the original error message
      throw error instanceof Error ? error : new Error('Failed to check status');
    }
  }

  throw new Error('Generation timed out');
};

    // Get video download URL
    const getVideoUrl = async (fileId: string): Promise<string> => {
        const response = await fetch(
            `https://api.minimaxi.chat/v1/files/retrieve?GroupId=${process.env.NEXT_PUBLIC_MINIMAX_GROUP_ID}&file_id=${fileId}`,
            {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_TOKEN}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get video URL');
        }

        const data: VideoUrlResponse = await response.json();
        return data.download_url;
    };

    // Convert image to base64
    const imageToBase64 = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handle the core generation process
    const generateVideo = async (): Promise<string> => {
        // Prepare the request body
        const requestBody: any = {
            model: "video-01",
            prompt: prompt.trim() || undefined,
            prompt_optimizer: settings.promptOptimizer
        };

        // Add image data if in image mode
        if (settings.generationType === 'image' && firstFrame) {
            requestBody.first_frame_image = await imageToBase64(firstFrame);
        }

        // Add callback URL if provided
        if (settings.callbackUrl) {
            requestBody.callback_url = settings.callbackUrl;
        }

        // Initiate generation
        const response = await fetch('https://api.minimaxi.chat/v1/video_generation', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_TOKEN}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.base_resp?.status_msg || 'Failed to start generation');
        }

        const data: GenerationResponse = await response.json();
        const fileId = await pollGenerationStatus(data.task_id);
        return await getVideoUrl(fileId);
    };

    // Main form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (settings.generationType === 'image' && !firstFrame) {
            setError('Please upload an image first');
            return;
        }

        if (settings.generationType === 'text' && !prompt.trim()) {
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

            const videoUrl = await generateVideo();

            setGenerationProgress({
                status: 'completed',
                message: 'Video generated successfully!',
                timestamp: new Date().toISOString(),
                progress: 100
            });

            setGeneratedVideo(videoUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate video');
            setGenerationProgress({
                status: 'failed',
                message: 'Generation failed. Please try again.',
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsLoading(false);
        }
    };
    // Add these functions inside your VideoGenerationPage component, 
    // before the return statement

    // 1. Handle generation type changes
    const handleGenerationTypeChange = (value: 'image' | 'text') => {
        // Reset relevant state when changing generation type
        setSettings(prev => ({
            ...prev,
            generationType: value
        }));

        // Clear image-related state when switching to text mode
        if (value === 'text') {
            setFirstFrame(null);
            setFirstFramePreview(null);
        }

        // Clear error state
        setError(null);
    };

    // 2. Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. First, validate file size
        if (file.size > VIDEO_REQUIREMENTS.maxFileSize) {
            setError('File size exceeds 20MB limit');
            return;
        }

        // 2. Then, validate file type using our new MIME type checking
        if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
            setError('Unsupported file format. Please use JPG, JPEG, or PNG');
            return;
        }

        // 3. After validations pass, create preview URL
        const previewUrl = URL.createObjectURL(file);

        // 4. Load image to check dimensions and aspect ratio
        const img = new Image();
        img.onload = () => {
            // Check minimum dimension
            if (img.width < VIDEO_REQUIREMENTS.minDimension ||
                img.height < VIDEO_REQUIREMENTS.minDimension) {
                setError(`Image must be at least ${VIDEO_REQUIREMENTS.minDimension}px on each side`);
                URL.revokeObjectURL(previewUrl);
                return;
            }

            // Check aspect ratio
            const aspectRatio = img.width / img.height;
            if (aspectRatio < VIDEO_REQUIREMENTS.aspectRatioMin ||
                aspectRatio > VIDEO_REQUIREMENTS.aspectRatioMax) {
                setError('Image aspect ratio must be between 2:5 and 5:2');
                URL.revokeObjectURL(previewUrl);
                return;
            }

            // If all validations pass, set the file and preview
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

    // 3. Handle image removal
    const handleRemoveImage = () => {
        if (firstFramePreview) {
            URL.revokeObjectURL(firstFramePreview);
        }
        setFirstFrame(null);
        setFirstFramePreview(null);
        setError(null);
    };

    return (
        <div className="flex-1 w-full flex flex-col gap-8 p-8">
            {/* Page Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <VideoIcon className="w-8 h-8" />
                    Video Generation
                </h1>
                <p className="text-muted-foreground">
                    Create AI-generated videos from {settings.generationType === 'image' ? 'images' : 'text descriptions'}
                </p>
            </div>

            {/* Main Input Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New Video</CardTitle>
                    <CardDescription>
                        Choose your generation method and provide inputs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Generation Type Selector */}
                        <div className="space-y-2">
                            <Label>Generation Method</Label>
                            <RadioGroup
                                value={settings.generationType}
                                onValueChange={(value: 'image' | 'text') =>
                                    handleGenerationTypeChange(value)
                                }
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="relative flex items-center justify-center">
                                    <RadioGroupItem value="image" id="image" className="peer sr-only" />
                                    <Label
                                        htmlFor="image"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full"
                                    >
                                        <ImageIcon className="mb-2 h-6 w-6" />
                                        <div className="text-center">
                                            <p className="font-medium">Image to Video</p>
                                            <p className="text-sm text-muted-foreground">
                                                Start with an image
                                            </p>
                                        </div>
                                    </Label>
                                </div>

                                <div className="relative flex items-center justify-center">
                                    <RadioGroupItem value="text" id="text" className="peer sr-only" />
                                    <Label
                                        htmlFor="text"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full"
                                    >
                                        <VideoIcon className="mb-2 h-6 w-6" />
                                        <div className="text-center">
                                            <p className="font-medium">Text to Video</p>
                                            <p className="text-sm text-muted-foreground">
                                                Start with description
                                            </p>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Image Upload - Only shown for image-to-video */}
                        {settings.generationType === 'image' && (
                            <div className="space-y-2">
                                <Label>First Frame Image</Label>
                                <div className="flex flex-col gap-4">
                                    {!firstFramePreview ? (
                                        <div className="border-2 border-dashed rounded-lg p-4">
                                            <Input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={handleImageUpload}
                                                className="cursor-pointer"
                                            />
                                            <p className="text-sm text-muted-foreground mt-2">
                                                JPG, JPEG, or PNG. Max 20MB.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <img
                                                src={firstFramePreview}
                                                alt="First frame preview"
                                                className="rounded-lg max-h-64 w-auto"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={handleRemoveImage}
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description Input */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt">
                                Description {settings.generationType === 'text' && '(Required)'}
                            </Label>
                            <Textarea
                                id="prompt"
                                placeholder={settings.generationType === 'image'
                                    ? "Optionally describe how you want the image to animate..."
                                    : "Describe the video you want to generate..."
                                }
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="h-32 resize-none"
                                required={settings.generationType === 'text'}
                            />
                            {settings.generationType === 'image' && (
                                <p className="text-sm text-muted-foreground">
                                    If no description is provided, the AI will automatically determine the video progression.
                                </p>
                            )}
                        </div>

                        {/* Advanced Settings Section */}
                        <div className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center justify-between"
                                onClick={() => setSettings(prev => ({
                                    ...prev,
                                    showAdvanced: !prev.showAdvanced
                                }))}
                            >
                                <span className="flex items-center gap-2">
                                    <Settings2 className="w-4 h-4" />
                                    Advanced Settings
                                </span>
                                {settings.showAdvanced ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </Button>

                            {settings.showAdvanced && (
                                <Card className="border border-muted">
                                    <CardContent className="pt-6 space-y-6">
                                        {/* Prompt Optimizer Setting */}
                                        <div className="flex items-start space-x-2">
                                            <Checkbox
                                                id="promptOptimizer"
                                                checked={settings.promptOptimizer}
                                                onCheckedChange={(checked) =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        promptOptimizer: checked as boolean
                                                    }))
                                                }
                                            />
                                            <div className="space-y-1 leading-none">
                                                <Label htmlFor="promptOptimizer">
                                                    Prompt Optimizer
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Allow AI to optimize your description for better results
                                                </p>
                                            </div>
                                        </div>

                                        {/* Image Requirements - Only show for image mode */}
                                        {settings.generationType === 'image' && (
                                            <div className="space-y-2 bg-muted p-4 rounded-lg">
                                                <h4 className="font-medium text-sm">Image Requirements:</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    <li>• Format: JPG, JPEG, or PNG</li>
                                                    <li>• Aspect ratio: between 2:5 and 5:2</li>
                                                    <li>• Minimum size: 300px on shortest side</li>
                                                    <li>• Maximum file size: 20MB</li>
                                                </ul>
                                            </div>
                                        )}

                                        {/* Status Updates Configuration */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="callbackUrl">
                                                    Callback URL (Optional)
                                                </Label>
                                                <Badge variant="outline" className="text-xs">
                                                    Advanced
                                                </Badge>
                                            </div>
                                            <Input
                                                id="callbackUrl"
                                                placeholder="https://your-domain.com/callback"
                                                value={settings.callbackUrl}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    callbackUrl: e.target.value
                                                }))}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Receive real-time status updates as your video generates
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Generation Progress */}
                        {generationProgress.status !== 'idle' && (
                            <div className="space-y-2 p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        Status: {generationProgress.status}
                                    </p>
                                    {generationProgress.progress !== undefined && (
                                        <p className="text-sm text-muted-foreground">
                                            {Math.round(generationProgress.progress)}%
                                        </p>
                                    )}
                                </div>
                                <Progress
                                    value={generationProgress.progress}
                                    className="h-2"
                                />
                                <p className="text-sm text-muted-foreground">
                                    {generationProgress.message}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading ||
                                (settings.generationType === 'image' && !firstFrame) ||
                                (settings.generationType === 'text' && !prompt.trim())
                            }
                            className="w-full"
                        >
                            {isLoading ? 'Generating...' : 'Generate Video'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Generated Video Display */}
            {generatedVideo && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Video</CardTitle>
                        <CardDescription>{prompt}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <video
                            controls
                            className="w-full rounded-lg max-w-2xl mx-auto"
                            src={generatedVideo}
                        />
                        <div className="flex gap-3">
                            <Button
                                onClick={() => window.open(generatedVideo, '_blank')}
                                variant="outline"
                            >
                                Open in New Tab
                            </Button>
                            <Button
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = generatedVideo;
                                    a.download = `generated-video-${Date.now()}.mp4`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }}
                                variant="outline"
                            >
                                Download Video
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default VideoGenerationPage;
