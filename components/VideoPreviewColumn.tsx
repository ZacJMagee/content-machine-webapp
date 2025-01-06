// src/app/video-generation/components/VideoPreviewColumn.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, VideoIcon } from "lucide-react";
import { GenerationProgress } from "@/types/video-generation";

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
    const handleDownload = () => {
        if (!generatedVideo) return;
        
        const a = document.createElement('a');
        a.href = generatedVideo;
        a.download = `generated-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                            <div className="relative rounded-lg overflow-hidden">
                                <video
                                    controls
                                    className="w-full rounded-lg max-w-2xl mx-auto"
                                    src={generatedVideo}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => window.open(generatedVideo, '_blank')}
                                    variant="outline"
                                >
                                    Open in New Tab
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    variant="outline"
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
            {(error || generationProgress.status !== 'idle') && (
                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
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
