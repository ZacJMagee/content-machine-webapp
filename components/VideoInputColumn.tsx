import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ImageIcon, VideoIcon, XIcon } from "lucide-react";
import { VideoSettings } from "@/types/video-generation";

interface VideoInputColumnProps {
    settings: VideoSettings;
    prompt: string;
    isLoading: boolean;
    firstFrame: File | null;
    firstFramePreview: string | null;
    onPromptChange: (value: string) => void;
    onGenerationTypeChange: (value: 'image' | 'text') => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImageRemove: () => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const VideoInputColumn = ({
    settings,
    prompt,
    isLoading,
    firstFrame,
    firstFramePreview,
    onPromptChange,
    onGenerationTypeChange,
    onImageUpload,
    onImageRemove,
    onSubmit
}: VideoInputColumnProps) => {
    return (
        <div className="h-full flex flex-col gap-4">
            <Card className="flex-1 border-gray-800/50 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Video Description</CardTitle>
                    <CardDescription className="text-gray-400">
                        Choose your generation method and provide inputs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* Generation Type Selector */}
                        <div className="space-y-2">
                            <Label>Generation Method</Label>
                            <RadioGroup
                                value={settings.generation_type}
                                onValueChange={onGenerationTypeChange}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="relative flex items-center justify-center">
                                    <RadioGroupItem value="image" id="image" className="peer sr-only" />
                                    <Label
                                        htmlFor="image"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-gray-800/50 bg-gray-900/50 p-4 hover:bg-gray-800/50 hover:border-gray-700/50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer w-full transition-colors"
                                    >
                                        <ImageIcon className="mb-2 h-6 w-6" />
                                        <div className="text-center">
                                            <p className="font-medium">Image to Video</p>
                                            <p className="text-sm text-gray-400">
                                                Start with an image
                                            </p>
                                        </div>
                                    </Label>
                                </div>

                                <div className="relative flex items-center justify-center">
                                    <RadioGroupItem value="text" id="text" className="peer sr-only" />
                                    <Label
                                        htmlFor="text"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-gray-800/50 bg-gray-900/50 p-4 hover:bg-gray-800/50 hover:border-gray-700/50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer w-full transition-colors"
                                    >
                                        <VideoIcon className="mb-2 h-6 w-6" />
                                        <div className="text-center">
                                            <p className="font-medium">Text to Video</p>
                                            <p className="text-sm text-gray-400">
                                                Start with description
                                            </p>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Image Upload Section */}
                        {settings.generation_type === 'image' && (
                            <div className="space-y-2">
                                <Label>First Frame Image</Label>
                                <div className="flex flex-col gap-4">
                                    {!firstFramePreview ? (
                                        <div className="border-2 border-dashed border-gray-800/50 rounded-lg p-6 text-center bg-gray-900/20">
                                            <Input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={onImageUpload}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <Label 
                                                htmlFor="image-upload" 
                                                className="flex flex-col items-center gap-2 cursor-pointer"
                                            >
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                                <div className="text-sm text-gray-400">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    JPG, JPEG, or PNG (max. 20MB)
                                                </p>
                                            </Label>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <img
                                                src={firstFramePreview}
                                                alt="First frame preview"
                                                className="rounded-lg max-h-64 w-auto mx-auto"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={onImageRemove}
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description Input */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt">
                                Description {settings.generation_type === 'text' && '(Required)'}
                            </Label>
                            <Textarea
                                id="prompt"
                                placeholder={settings.generation_type === 'image'
                                    ? "Optionally describe how you want the image to animate..."
                                    : "Describe the video you want to generate..."
                                }
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                className="h-32 resize-none bg-gray-900/50 border-gray-800/50"
                                required={settings.generation_type === 'text'}
                            />
                            {settings.generation_type === 'image' && (
                                <p className="text-sm text-gray-400">
                                    If no description is provided, the AI will automatically determine the video progression.
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading ||
                                (settings.generation_type === 'image' && !firstFrame) ||
                                (settings.generation_type === 'text' && !prompt.trim())
                            }
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        >
                            {isLoading ? 'Generating...' : 'Generate Video'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VideoInputColumn;
