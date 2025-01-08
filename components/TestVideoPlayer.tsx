'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const TestVideoPlayer = () => {
    const testVideoUrl = "https://public-cdn-video-data-algeng.oss-cn-wulanchabu.aliyuncs.com/inference_output%2Fvideo%2F2025-01-09%2Fdf4c4d34-fa76-4b90-9bc7-d43d0ee1db1c%2Foutput.mp4?Expires=1736385145&OSSAccessKeyId=LTAI5tAmwsjSaaZVA6cEFAUu&Signature=xELSPU%2F90qKFOrUoWC0ZSlB8C7Q%3D";

    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const handleDownload = async () => {
        try {
            const response = await fetch(testVideoUrl, {
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
            a.download = `test-video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            setVideoError(error instanceof Error ? error.message : 'Download failed');
        }
    };

    return (
        <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle>Video Player Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 min-h-[240px]">
                    <video
                        controls
                        className="w-full rounded-lg"
                        src={testVideoUrl}
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
                        <source src={testVideoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>

                {videoError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{videoError}</AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={() => window.open(testVideoUrl, '_blank')}
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

                <div className="text-sm text-muted-foreground">
                    <p>Video Status: {videoStatus}</p>
                    <p className="break-all mt-2">
                        <span className="font-medium">Test URL:</span> {testVideoUrl}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default TestVideoPlayer;
