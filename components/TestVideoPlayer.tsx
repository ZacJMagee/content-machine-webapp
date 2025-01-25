'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SaveIcon } from "lucide-react";

const TestVideoPlayer = () => {
    // Pre-fill the video URL
    const defaultVideoUrl = "https://public-cdn-video-data-algeng.oss-cn-wulanchabu.aliyuncs.com/inference_output%2Fvideo%2F2025-01-25%2F48570be8-d652-4da9-9c5b-054f7d9da347%2Foutput.mp4?Expires=1737848589&OSSAccessKeyId=LTAI5tAmwsjSaaZVA6cEFAUu&Signature=gUETVtn2i1EKHZ2kFSMfJ5FnaKQ%3D";
    
    const [videoUrl, setVideoUrl] = useState<string>(defaultVideoUrl);
    const [currentVideo, setCurrentVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [downloading, setDownloading] = useState(false);

    // Extract fileId from the URL
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

    // Auto-load the video when component mounts
    useEffect(() => {
        if (defaultVideoUrl) {
            setCurrentVideo(defaultVideoUrl);
        }
    }, []);

    const handleLoadVideo = () => {
        if (!videoUrl.trim()) {
            setError('Please enter a video URL');
            return;
        }
        setCurrentVideo(videoUrl);
        setError(null);
    };

    const handleDownload = async () => {
        if (!currentVideo) return;
        
        try {
            setDownloading(true);
            setError(null);
            
            const fileId = extractFileId(currentVideo);
            if (!fileId) {
                throw new Error('Could not extract file ID from video URL');
            }

            console.log('Starting video download:', {
                fileId,
                timestamp: new Date().toISOString()
            });

            // Use our existing video generation endpoint
            const response = await fetch(`/api/generate-video?fileId=${fileId}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Download failed: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            // Create filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `test-video-${timestamp}.mp4`;
            
            // Create and trigger download
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            
            console.log('Starting download:', {
                filename,
                size: blob.size,
                type: blob.type
            });

            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            console.log('Download completed');
            
        } catch (err) {
            console.error('Download failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to download video';
            setError(errorMessage);
        } finally {
            setDownloading(false);
        }
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
                        <Button
                            onClick={handleDownload}
                            disabled={videoStatus !== 'ready' || downloading}
                            variant="outline"
                            className="gap-2"
                        >
                            <SaveIcon className="w-4 h-4" />
                            {downloading ? 'Downloading...' : 'Save to Computer'}
                        </Button>
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
                            fileId: currentVideo ? extractFileId(currentVideo) : null,
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
