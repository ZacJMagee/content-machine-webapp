// components/TestVideoPlayer.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VideoDownloadButton from './VideoDownloadButton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const TestVideoPlayer = () => {
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [currentVideo, setCurrentVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const handleLoadVideo = () => {
        if (!videoUrl.trim()) {
            setError('Please enter a video URL');
            return;
        }
        setCurrentVideo(videoUrl);
        setError(null);
    };

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        setVideoStatus('error');
        const videoElement = e.currentTarget;
        setError(videoElement.error?.message || 'Video playback failed');
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Video Player Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Video URL Input */}
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Paste video URL here"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <Button onClick={handleLoadVideo}>Load Video</Button>
                </div>

                {/* Video Player */}
                {currentVideo && (
                    <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden bg-slate-100">
                            <video
                                controls
                                className="w-full rounded-lg"
                                playsInline
                                onError={handleVideoError}
                                onLoadStart={() => {
                                    setVideoStatus('loading');
                                    setError(null);
                                }}
                                onLoadedData={() => {
                                    setVideoStatus('ready');
                                }}
                            >
                                <source src={currentVideo} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        {/* Download Button */}
                        <VideoDownloadButton
                            videoUrl={currentVideo}
                            prompt="test-video"
                            disabled={videoStatus !== 'ready'}
                            onError={setError}
                        />
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Debug Info */}
                <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                    <h3 className="font-semibold mb-2">Debug Information</h3>
                    <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify({
                            videoUrl: currentVideo,
                            status: videoStatus,
                            error: error
                        }, null, 2)}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
};

export default TestVideoPlayer;
