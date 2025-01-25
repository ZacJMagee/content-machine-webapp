import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, VideoIcon, ExternalLink, Download } from "lucide-react";
import { GenerationProgress } from "@/types/video-generation";
import VideoDownloadButton from './VideoDownloadButton';

// Define our component's props interface
interface VideoPreviewColumnProps {
    generatedVideo: string | null;
    error: string | null;
    generationProgress: GenerationProgress;
    prompt: string;
}

// Define the possible states for our video player
type VideoPlayerStatus = 'loading' | 'ready' | 'error';

export const VideoPreviewColumn = ({
    generatedVideo,
    error: externalError,
    generationProgress,
    prompt
}: VideoPreviewColumnProps) => {
    // State management for video player
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<VideoPlayerStatus>('loading');
    const [isDownloading, setIsDownloading] = useState(false);

    // Log when we receive a new video URL for debugging purposes
    useEffect(() => {
        if (generatedVideo) {
            console.log('Video URL received:', {
                url: generatedVideo,
                timestamp: new Date().toISOString()
            });
        }
    }, [generatedVideo]);

    // Handle video download functionality
    const handleDownload = async () => {
        if (!generatedVideo || isDownloading) return;
        
        try {
            setIsDownloading(true);
            console.log('Starting video download...', {
                url: generatedVideo,
                timestamp: new Date().toISOString()
            });
            
            const response = await fetch(generatedVideo, {
                method: 'GET',
                headers: {
                    'Accept': 'video/mp4,video/*;q=0.8,*/*;q=0.5',
                }
            });
            
            if (!response.ok) {
                throw new Error(`Download failed with status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Create a meaningful filename using the prompt and timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const sanitizedPrompt = prompt
                .split(' ')
                .slice(0, 5)
                .join('-')
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '');
            const filename = `${sanitizedPrompt}-${timestamp}.mp4`;
            
            // Create and trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            
            console.log('Downloading video:', {
                filename,
                size: blob.size,
                type: blob.type
            });
            
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Download completed successfully');
        } catch (error) {
            console.error('Download failed:', error);
            setVideoError(error instanceof Error ? error.message : 'Download failed');
        } finally {
            setIsDownloading(false);
        }
    };

    // Render the video player section
    const renderVideoPlayer = () => (
        <div className="space-y-4 w-full">
            <div className="relative rounded-lg overflow-hidden bg-slate-100">
                <video
                    controls
                    className="w-full rounded-lg max-w-2xl mx-auto"
                    playsInline
                    onError={(e) => {
                        setVideoStatus('error');
                        const videoElement = e.currentTarget;
                        setVideoError(videoElement.error?.message || 'Video playback failed');
                    }}
                    onLoadStart={() => {
                        setVideoStatus('loading');
                        setVideoError(null);
                    }}
                    onLoadedData={() => {
                        setVideoStatus('ready');
                    }}
                >
                    <source src={generatedVideo!} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            
            {/* Video control buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={() => window.open(generatedVideo!, '_blank')}
                    variant="outline"
                    disabled={videoStatus === 'error'}
                    className="gap-2"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                </Button>
                <Button
                    onClick={handleDownload}
                    variant="outline"
                    disabled={videoStatus === 'error' || isDownloading}
                    className="gap-2"
                >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : 'Download Video'}
                </Button>
            </div>
        </div>
    );

    // Render the placeholder when no video is available
    const renderPlaceholder = () => (
        <div className="text-center text-muted-foreground">
            <VideoIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Your generated video will appear here</p>
        </div>
    );

    // Render error and progress information
    const renderErrorAndProgress = () => {
        const currentError = externalError || videoError;
        
        return (
            <div className="space-y-4">
                {currentError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{currentError}</AlertDescription>
                    </Alert>
                )}
                
                {generationProgress.status !== 'idle' && (
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    Status: {
                                        generationProgress.status.charAt(0).toUpperCase() + 
                                        generationProgress.status.slice(1)
                                    }
                                </p>
                                {generationProgress.progress !== undefined && (
                                    <p className="text-sm text-muted-foreground">
                                        {Math.round(generationProgress.progress)}%
                                    </p>
                                )}
                            </div>
                            
                            {generationProgress.progress !== undefined && (
                                <Progress 
                                    value={generationProgress.progress} 
                                    className="h-2"
                                />
                            )}
                            
                            <p className="text-sm text-muted-foreground">
                                {generationProgress.message}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Generated Video</CardTitle>
                    <CardDescription>
                        {generatedVideo ? prompt : 'Your generated video will appear here'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4">
                    {generatedVideo ? renderVideoPlayer() : renderPlaceholder()}
                </CardContent>
            </Card>

            {/* Show errors and progress information if necessary */}
            {(externalError || videoError || generationProgress.status !== 'idle') && 
                renderErrorAndProgress()}
        </div>
    );
};
