import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Info, ChevronDown, ChevronUp, ImageIcon, VideoIcon } from "lucide-react";
import { VideoSettings as GenerationSettings } from "@/types/video-generation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Define debug info interface
interface DebugInfo {
    timestamp: string;
    type: 'event' | 'error' | 'video';
    message: string;
    details?: any;
}

interface VideoSettingsColumnProps {
    settings: GenerationSettings;
    onSettingsChange: (settings: GenerationSettings) => void;
    firstFrame: File | null;
    isLoading: boolean;
    videoUrl?: string;
}

export const VideoSettingsColumn = ({
    settings,
    onSettingsChange,
    firstFrame,
    isLoading,
    videoUrl
}: VideoSettingsColumnProps) => {
    // Debug state
    const [showDebug, setShowDebug] = useState(false);
    const [debugLog, setDebugLog] = useState<DebugInfo[]>([]);

    // Helper function to update a single setting
    const updateSetting = <K extends keyof GenerationSettings>(
        key: K,
        value: GenerationSettings[K]
    ) => {
        const newSettings = {
            ...settings,
            [key]: value
        };
        onSettingsChange(newSettings);
        
        // Log setting changes to debug
        addDebugLog('event', 'Setting Updated', {
            setting: key,
            oldValue: settings[key],
            newValue: value
        });
    };

    // Debug logging helper
    const addDebugLog = (type: 'event' | 'error' | 'video', message: string, details?: any) => {
        const logEntry: DebugInfo = {
            timestamp: new Date().toISOString(),
            type,
            message,
            details
        };
        setDebugLog(prev => [...prev, logEntry]);
        console.log(`[${type.toUpperCase()}] ${message}`, details || '');
    };

    // Log system events and video URL updates
    useEffect(() => {
        addDebugLog('event', 'Generation type changed', {
            type: settings.generation_type
        });
    }, [settings.generation_type]);

    useEffect(() => {
        if (videoUrl) {
            addDebugLog('video', 'Video generation completed', {
                url: videoUrl
            });
        }
    }, [videoUrl]);

    // Log errors and image state changes
    useEffect(() => {
        if (firstFrame) {
            addDebugLog('event', 'Image uploaded', {
                name: firstFrame.name,
                size: firstFrame.size,
                type: firstFrame.type
            });
        }
    }, [firstFrame]);

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

    // Debug panel component
    const renderDebugPanel = () => (
        <Card className="mt-4 border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generation Debug Info</CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDebugLog([])}
                >
                    Clear Log
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current State */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Current State:</h3>
                    <div className="bg-muted rounded-md p-2">
                        <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify({
                                generationType: settings.generation_type,
                                promptOptimizer: settings.promptOptimizer,
                                hasImage: !!firstFrame,
                                imageDetails: firstFrame ? {
                                    name: firstFrame.name,
                                    size: firstFrame.size,
                                    type: firstFrame.type
                                } : null,
                                isLoading,
                                videoUrl: videoUrl || null,
                                showAdvanced: settings.showAdvanced,
                                callbackUrl: settings.callbackUrl
                            }, null, 2)}
                        </pre>
                    </div>
                </div>

                {/* Event Log */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Event Log:</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {debugLog.map((log, index) => (
                            <div key={index} className={`rounded-md p-2 text-xs ${
                                log.type === 'error' ? 'bg-red-100 dark:bg-red-900' :
                                log.type === 'video' ? 'bg-green-100 dark:bg-green-900' :
                                'bg-muted'
                            }`}>
                                <p className={`${
                                    log.type === 'error' ? 'text-red-800 dark:text-red-200' :
                                    log.type === 'video' ? 'text-green-800 dark:text-green-200' :
                                    'text-muted-foreground'
                                }`}>
                                    [{new Date(log.timestamp).toLocaleTimeString()}] [{log.type.toUpperCase()}] {log.message}
                                </p>
                                {log.details && (
                                    <pre className="mt-1 whitespace-pre-wrap">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
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

                                        {/* Debug Panel Toggle */}
                                        <Collapsible>
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => setShowDebug(!showDebug)}
                                                >
                                                    {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                {showDebug && renderDebugPanel()}
                                            </CollapsibleContent>
                                        </Collapsible>
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
