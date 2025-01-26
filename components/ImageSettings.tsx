import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Info, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ImageSettings, LoraWeight, ImageSize, ImageSizePreset } from '@/types/image-generation';
import { IMAGE_SIZE_PRESETS, OUTPUT_FORMATS } from '@/constants/image-generation';

interface ImageSettingsComponentProps {
  settings: ImageSettings;
  onSettingsChange: (newSettings: ImageSettings) => void;
}

const ImageSettingsComponent = ({ settings, onSettingsChange }: ImageSettingsComponentProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSize, setCustomSize] = useState(false);

  // Helper function to update a single setting
  const updateSetting = <K extends keyof ImageSettings>(
    key: K,
    value: ImageSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Helper function to add a new LoRA
  const addLora = () => {
    const newLoras = [...settings.loras, { path: '', scale: 1 }];
    updateSetting('loras', newLoras);
  };

  // Helper function to update a LoRA
  const updateLora = (index: number, field: keyof LoraWeight, value: string | number) => {
    const newLoras = [...settings.loras];
    newLoras[index] = { ...newLoras[index], [field]: value };
    updateSetting('loras', newLoras);
  };

  // Helper function to remove a LoRA
  const removeLora = (index: number) => {
    const newLoras = settings.loras.filter((_, i) => i !== index);
    updateSetting('loras', newLoras);
  };

  // Component for setting labels with tooltips
  const SettingLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="w-[200px] text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // Section wrapper component
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Section title="Basic Settings">
        {/* Image Size Selection */}
        <div className="space-y-2">
          <SettingLabel
            label="Image Size"
            tooltip="Choose from preset sizes or specify custom dimensions"
          />
          <div className="space-y-4">
            <Select
              value={customSize ? 'custom' : (settings.image_size as ImageSizePreset)}
              onValueChange={(value) => {
                if (value === 'custom') {
                  setCustomSize(true);
                  updateSetting('image_size', { width: 512, height: 512 });
                } else {
                  setCustomSize(false);
                  updateSetting('image_size', value as ImageSizePreset);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(IMAGE_SIZE_PRESETS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Size</SelectItem>
              </SelectContent>
            </Select>

            {customSize && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Width (px)</Label>
                  <Input
                    type="number"
                    min={256}
                    max={1024}
                    step={64}
                    value={(settings.image_size as { width: number }).width}
                    onChange={(e) => {
                      const width = Math.min(1024, Math.max(256, parseInt(e.target.value)));
                      updateSetting('image_size', {
                        ...(settings.image_size as { width: number; height: number }),
                        width
                      });
                    }}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Height (px)</Label>
                  <Input
                    type="number"
                    min={256}
                    max={1024}
                    step={64}
                    value={(settings.image_size as { height: number }).height}
                    onChange={(e) => {
                      const height = Math.min(1024, Math.max(256, parseInt(e.target.value)));
                      updateSetting('image_size', {
                        ...(settings.image_size as { width: number; height: number }),
                        height
                      });
                    }}
                    className="h-8"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Format */}
        <div className="space-y-2">
          <SettingLabel
            label="Output Format"
            tooltip="Choose the image output format"
          />
          <Select
            value={settings.output_format}
            onValueChange={(value) => updateSetting('output_format', value as 'jpeg' | 'png')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTPUT_FORMATS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Number of Images */}
        <div className="space-y-2">
          <SettingLabel
            label="Number of Images"
            tooltip="Generate multiple variations at once"
          />
          <Select
            value={settings.num_images.toString()}
            onValueChange={(value) => updateSetting('num_images', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'Image' : 'Images'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sync Mode Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <SettingLabel
              label="Synchronous Generation"
              tooltip="Wait for immediate results vs. queue for processing"
            />
            <p className="text-xs text-muted-foreground">
              Immediate results but may be slower to start
            </p>
          </div>
          <Switch
            checked={settings.sync_mode}
            onCheckedChange={(checked) => updateSetting('sync_mode', checked)}
          />
        </div>
      </Section>

      {/* Advanced Settings Toggle */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Advanced Settings
          </div>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </Button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <Section title="Advanced Settings">
          <div className="space-y-6">
            {/* Generation Settings */}
            <div className="space-y-4">
              {/* Guidance Scale */}
              <div className="space-y-2">
                <SettingLabel
                  label={`Guidance Scale (${settings.guidance_scale.toFixed(1)})`}
                  tooltip="How closely to follow the prompt. Higher values = more literal interpretation"
                />
                <Slider
                  value={[settings.guidance_scale]}
                  min={1}
                  max={20}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('guidance_scale', value)}
                  className="py-3"
                />
              </div>

              {/* Inference Steps */}
              <div className="space-y-2">
                <SettingLabel
                  label={`Inference Steps (${settings.num_inference_steps})`}
                  tooltip="More steps = higher quality but slower generation"
                />
                <Slider
                  value={[settings.num_inference_steps]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={([value]) => updateSetting('num_inference_steps', value)}
                  className="py-3"
                />
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <SettingLabel
                  label="Seed"
                  tooltip="Set for reproducible results (optional)"
                />
                <Input
                  type="number"
                  value={settings.seed || ''}
                  onChange={(e) => updateSetting('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Random seed (optional)"
                  className="h-8"
                />
              </div>

              {/* Safety Checker */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <SettingLabel
                    label="Safety Checker"
                    tooltip="Filter potentially inappropriate content"
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps prevent inappropriate content generation
                  </p>
                </div>
                <Switch
                  checked={settings.enable_safety_checker}
                  onCheckedChange={(checked) => updateSetting('enable_safety_checker', checked)}
                />
              </div>
            </div>

            {/* LoRA Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SettingLabel
                  label="LoRA Weights"
                  tooltip="Add custom LoRA models to influence the generation"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLora}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add LoRA
                </Button>
              </div>

              {settings.loras.map((lora, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">LoRA {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLora(index)}
                        className="h-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Path or URL</Label>
                        <Input
                          value={lora.path}
                          onChange={(e) => updateLora(index, 'path', e.target.value)}
                          placeholder="e.g., path/to/lora or https://..."
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">{`Scale (${lora.scale.toFixed(2)})`}</Label>
                        <Slider
                          value={[lora.scale]}
                          min={0}
                          max={2}
                          step={0.01}
                          onValueChange={([value]) => updateLora(index, 'scale', value)}
                          className="py-3"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};

export default ImageSettingsComponent;
