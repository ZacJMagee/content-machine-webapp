'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoDownloadButtonProps {
  fileId: string;
  prompt: string;
  disabled?: boolean;
  onError?: (error: string) => void;
}

const VideoDownloadButton = ({ 
  fileId, 
  prompt, 
  disabled = false,
  onError 
}: VideoDownloadButtonProps) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!fileId) return;
    
    try {
      setDownloading(true);
      setError(null);
      
      console.log('Starting video download:', {
        fileId,
        timestamp: new Date().toISOString()
      });

      // Use the video generation endpoint with GET method
      const response = await fetch(`/api/generate-video?fileId=${fileId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = prompt
        .split(' ')
        .slice(0, 5)
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      
      const filename = `${baseFilename}-${timestamp}.mp4`;
      
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to download video';
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
        disabled={disabled || !fileId || downloading}
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
