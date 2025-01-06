// src/app/video-generation/components/VideoSettingsColumn.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Info, ChevronDown, ChevronUp, ImageIcon, VideoIcon } from "lucide-react";
import { GenerationSettings } from "../types";

interface VideoSettingsColumnProps {
    settings: GenerationSettings;
    onSettingsChange: (settings: GenerationSettings) => void;
}

export const VideoSettingsColumn = ({
    settings,
    onSettingsChange
}: VideoSettingsColumnProps) => {
    // Helper function to update a single setting
    const updateSetting = <K extends keyof GenerationSettings>(
        key: K,
        value: GenerationSettings[K]
    ) => {
        onSettingsChange({
            ...settings,
            [key]: value
        });
    };

    // Helper component for tooltips
    const SettingLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
        <div className="flex items-center gap-2">
            <Label>{label}</Label>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="w-[200px] text-sm">{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );

    return (
        <div className="h-full flex flex-col gap-4">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Generation Settings</CardTitle>
                    <CardDescription>
                        Configure your video generation parameters
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Basic Settings Section */}
                    <div className="space-y-4">
                        {/* Prompt Optimizer Setting */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <SettingLabel 
                                    label="Prompt Optimizer"
                                    tooltip="Let AI optimize your description for better results"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Let AI optimize your description for better results
                                </p>
                            </div>
                            <Switch
                                checked={settings.promptOptimizer}
                                onCheckedChange={(checked) => updateSetting('promptOptimizer', checked)}
                            />
                        </div>

                        {/* Advanced Settings Section */}
                        <div className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center justify-between"
                                onClick={() => updateSetting('showAdvanced', !settings.showAdvanced)}
                            >
                                <span className="flex items-center gap-2">
                                    <Settings2 className="w-4 h-4" />
                                    Advanced Settings
                                </span>
                                {settings.showAdvanced ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </Button>

                            {settings.showAdvanced && (
                                <Card className="border border-muted">
                                    <CardContent className="pt-6 space-y-6">
                                        {/* Image Requirements Info */}
                                        {settings.generationType === 'image' && (
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

                                        {/* Callback URL Setting */}
                                        <div className="space-y-2">
                                            <SettingLabel 
                                                label="Callback URL"
                                                tooltip="Receive updates about your video generation"
                                            />
                                            <input
                                                type="url"
                                                placeholder="https://your-domain.com/callback"
                                                value={settings.callbackUrl}
                                                onChange={(e) => updateSetting('callbackUrl', e.target.value)}
                                                className="w-full px-3 py-2 rounded-md border"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Receive real-time status updates as your video generates
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
