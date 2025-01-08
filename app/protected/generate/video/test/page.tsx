import { VideoIcon } from 'lucide-react';
import TestVideoPlayer from '@/components/TestVideoPlayer';

export default function VideoTestPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Warning Banner */}
            <div className="bg-yellow-200 text-yellow-900 text-center p-2 font-semibold">
                ⚠️ This is a test page for video playback
            </div>

            {/* Header */}
            <div className="flex-none p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <VideoIcon className="w-8 h-8" />
                        Video Player Test
                    </h1>
                    <p className="text-muted-foreground">
                        Test video playback and download functionality
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-7xl mx-auto">
                    <TestVideoPlayer />
                </div>
            </div>
        </div>
    );
}
