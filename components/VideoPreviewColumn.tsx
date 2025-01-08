import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, VideoIcon } from "lucide-react";
import { GenerationProgress } from "@/types/video-generation";
import { useState } from "react";

interface VideoPreviewColumnProps {
    generatedVideo: string | null;
    error: string | null;
    generationProgress: GenerationProgress;
    prompt: string;
}

export const VideoPreviewColumn = ({
    generatedVideo,
    error,
    generationProgress,
    prompt
}: VideoPreviewColumnProps) => {
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const handleDownload = async () => {
        if (!generatedVideo) return;
        
        try {
            const response = await fetch(generatedVideo, {
                method: 'GET',
                headers: {
                    'Accept': 'video/mp4,video/*;q=0.8,*/*;q=0.5',
                }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated-video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            setVideoError(error instanceof Error ? error.message : 'Download failed');
        }
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
                    {generatedVideo ? (
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
                                    <source src={generatedVideo} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => window.open(generatedVideo, '_blank')}
                                    variant="outline"
                                    disabled={videoStatus === 'error'}
                                >
                                    Open in New Tab
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    variant="outline"
                                    disabled={videoStatus === 'error'}
                                >
                                    Download Video
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <VideoIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Your generated video will appear here</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error and Progress Display */}
            {(error || videoError || generationProgress.status !== 'idle') && (
                <div className="space-y-4">
                    {(error || videoError) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error || videoError}</AlertDescription>
                        </Alert>
                    )}
                    
                    {generationProgress.status !== 'idle' && (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        Status: {generationProgress.status.charAt(0).toUpperCase() + 
                                                generationProgress.status.slice(1)}
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
            )}
        </div>
    );
};
