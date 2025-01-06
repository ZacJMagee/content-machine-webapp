// components/DownloadButton.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { downloadImage } from '@/utils/download-helper';

interface DownloadButtonProps {
  imageUrl: string | null;
  prompt: string;
  disabled?: boolean;
}

const DownloadButton = ({ imageUrl, prompt, disabled = false }: DownloadButtonProps) => {
  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      // Create filename from prompt and date
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = prompt
        .split(' ')
        .slice(0, 5)
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      
      // Add file extension based on image URL or default to png
      const fileExtension = imageUrl.split('?')[0].split('.').pop() || 'png';
      const filename = `${baseFilename}-${timestamp}.${fileExtension}`;

      await downloadImage(imageUrl, filename);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || !imageUrl}
      variant="outline"
      className="gap-2"
    >
      <SaveIcon className="w-4 h-4" />
      Save to Computer
    </Button>
  );
};

export default DownloadButton;
