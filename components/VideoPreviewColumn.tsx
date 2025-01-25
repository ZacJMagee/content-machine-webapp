import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, VideoIcon, ExternalLink, Download } from "lucide-react";
import { GenerationProgress } from "@/types/video-generation";

interface VideoPreviewColumnProps {
    generatedVideo: string | null;
    error: string | null;
    generationProgress: GenerationProgress;
    prompt: string;
}

type VideoPlayerStatus = 'loading' | 'ready' | 'error';

export const VideoPreviewColumn = ({
    generatedVideo,
    error: externalError,
    generationProgress,
    prompt
}: VideoPreviewColumnProps) => {
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<VideoPlayerStatus>('loading');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (generatedVideo) {
            console.log('Video URL received:', {
                url: generatedVideo,
                timestamp: new Date().toISOString()
            });
        }
    }, [generatedVideo]);

    // Extract fileId from the video URL
    const extractFileId = (url: string): string | null => {
        try {
            const decodedUrl = decodeURIComponent(url);
            const match = decodedUrl.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
            return match ? match[1] : null;
        } catch (err) {
            console.error('Error extracting file ID:', err);
            return null;
        }
    };

    // Updated download handler using our API route
    const handleDownload = async () => {
        if (!generatedVideo || isDownloading) return;

        try {
            setIsDownloading(true);
            setVideoError(null);

            console.log('Starting video download:', {
                url: generatedVideo,
                timestamp: new Date().toISOString()
            });

            // Pass the video URL to the endpoint
            const encodedUrl = encodeURIComponent(generatedVideo);
            const response = await fetch(`/api/generate-video?url=${encodedUrl}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Failed to fetch video: ${response.statusText}`);
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            // Create filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const sanitizedPrompt = prompt
            .split(' ')
            .slice(0, 5)
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '');

            const filename = `${sanitizedPrompt}-${timestamp}.mp4`;

            // Create and trigger download
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);

            console.log('Initiating download:', {
                filename,
                size: blob.size,
                type: blob.type
            });

            a.click();

            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            console.log('Download completed successfully');

        } catch (err) {
            console.error('Download failed:', err);
            setVideoError(err instanceof Error ? err.message : 'Failed to download video');
        } finally {
            setIsDownloading(false);
        }
    };

    // Rest of your existing render functions remain the same
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

    const renderPlaceholder = () => (
        <div className="text-center text-muted-foreground">
            <VideoIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Your generated video will appear here</p>
        </div>
    );

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

            {(externalError || videoError || generationProgress.status !== 'idle') && 
                renderErrorAndProgress()}
        </div>
    );
};
