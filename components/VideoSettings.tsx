// components/VideoSettings.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageIcon, VideoIcon, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { VideoSettings as VideoSettingsType } from '@/constants/video-generation';

interface VideoSettingsProps {
    settings: VideoSettingsType;
    onSettingsChange: (settings: VideoSettingsType) => void;
    isGenerating?: boolean;
}

const VideoSettings: React.FC<VideoSettingsProps> = ({
    settings,
    onSettingsChange,
    isGenerating = false
}) => {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    // Update a single setting while preserving others
    const updateSetting = <K extends keyof VideoSettingsType>(
        key: K,
        value: VideoSettingsType[K]
    ) => {
        onSettingsChange({
            ...settings,
            [key]: value
        });
    };

    return (
        <div className="space-y-4">
            {/* Generation Type Selection */}
            <div className="space-y-2">
                <Label>Generation Method</Label>
                <RadioGroup
                    value={settings.generation_type}
                    onValueChange={(value) => updateSetting('generation_type', value as 'image' | 'text')}
                    className="flex space-x-4"
                    disabled={isGenerating}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <Label htmlFor="image" className="flex items-center space-x-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>Image to Video</span>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="text" />
                        <Label htmlFor="text" className="flex items-center space-x-2">
                            <VideoIcon className="w-4 h-4" />
                            <span>Text to Video</span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Advanced Settings Toggle Button */}
            <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={isGenerating}
            >
                <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Advanced Settings
                </span>
                {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </Button>

            {/* Advanced Settings Panel */}
            {showAdvanced && (
                <Card className="border border-muted">
                    <CardContent className="pt-6 space-y-6">
                        {/* Prompt Optimizer Setting */}
                        <div className="flex items-center justify-between space-x-4">
                            <div className="space-y-1">
                                <Label>Prompt Optimizer</Label>
                                <p className="text-sm text-muted-foreground">
                                    Let AI optimize your description for better results
                                </p>
                            </div>
                            <Switch
                                checked={settings.prompt_optimizer}
                                onCheckedChange={(checked) => updateSetting('prompt_optimizer', checked)}
                                disabled={isGenerating}
                            />
                        </div>

                        {/* Requirements Info */}
                        {settings.generation_type === 'image' && (
                            <div className="space-y-2 bg-muted p-4 rounded-lg">
                                <h4 className="font-medium text-sm">Image Requirements:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Format: JPG, JPEG, or PNG</li>
                                    <li>• Aspect ratio: between 2:5 and 5:2</li>
                                    <li>• Minimum size: 300px on shortest side</li>
                                    <li>• Maximum file size: 20MB</li>
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default VideoSettings;
