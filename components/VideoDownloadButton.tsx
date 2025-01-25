// components/VideoDownloadButton.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoDownloadButtonProps {
  videoUrl: string | null;
  prompt: string;
  disabled?: boolean;
  onError?: (error: string) => void;
}

const VideoDownloadButton = ({ 
  videoUrl, 
  prompt, 
  disabled = false,
  onError 
}: VideoDownloadButtonProps) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!videoUrl) return;
    
    try {
      setDownloading(true);
      setError(null);
      
      console.log('Starting video download:', {
        url: videoUrl,
        prompt,
        timestamp: new Date().toISOString()
      });

      // Fetch the video file
      const response = await fetch(videoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'video/mp4,video/*;q=0.8,*/*;q=0.5',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create filename from prompt and date
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = prompt
        .split(' ')
        .slice(0, 5)
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      
      const filename = `${baseFilename}-${timestamp}.mp4`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      
      console.log('Downloading video:', {
        filename,
        size: blob.size,
        type: blob.type,
        timestamp: new Date().toISOString()
      });

      // Trigger download
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Video download completed:', {
        filename,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Video download error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: videoUrl,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to download video';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDownload}
        disabled={disabled || !videoUrl || downloading}
        variant="outline"
        className="gap-2"
      >
        <SaveIcon className="w-4 h-4" />
        {downloading ? 'Downloading...' : 'Save to Computer'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VideoDownloadButton;
