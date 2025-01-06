import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Info, ChevronDown, ChevronUp } from "lucide-react";

interface ImageSettingsProps {
  settings: any;
  onSettingsChange: (newSettings: any) => void;
}

const ImageSettings = ({ settings, onSettingsChange }: ImageSettingsProps) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Helper function to update a single setting
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
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
    <div className="h-full overflow-y-auto">
      <Card className="w-full">
        <CardContent className="pt-6 space-y-8">
          {/* Basic Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Settings</h3>
            
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <SettingLabel 
                label="Aspect Ratio" 
                tooltip="The width-to-height ratio of the generated image"
              />
              <Select
                value={settings.aspect_ratio}
                onValueChange={(value) => {
                  updateSetting('aspect_ratio', value);
                  if (value === 'custom') {
                    updateSetting('go_fast', false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                  <SelectItem value="3:2">Standard (3:2)</SelectItem>
                  <SelectItem value="4:3">Classic (4:3)</SelectItem>
                  <SelectItem value="custom">Custom Size</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Size Inputs */}
              {settings.aspect_ratio === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Width (px)</Label>
                    <Input
                      type="number"
                      min={256}
                      max={1440}
                      step={16}
                      value={settings.width}
                      onChange={(e) => updateSetting('width', Math.min(1440, Math.max(256, parseInt(e.target.value))))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (px)</Label>
                    <Input
                      type="number"
                      min={256}
                      max={1440}
                      step={16}
                      value={settings.height}
                      onChange={(e) => updateSetting('height', Math.min(1440, Math.max(256, parseInt(e.target.value))))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <SettingLabel 
                label="Output Format" 
                tooltip="The file format for the generated image"
              />
              <Select
                value={settings.output_format}
                onValueChange={(value) => updateSetting('output_format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (Recommended)</SelectItem>
                  <SelectItem value="png">PNG (Lossless)</SelectItem>
                  <SelectItem value="jpg">JPG (Smaller size)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Outputs */}
            <div className="space-y-2">
              <SettingLabel 
                label="Number of Outputs" 
                tooltip="Generate multiple variations at once (1-4 images)"
              />
              <Select
                value={settings.num_outputs.toString()}
                onValueChange={(value) => updateSetting('num_outputs', parseInt(value))}
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
          </div>

          {/* Quality Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Settings</h3>
            
            {/* Output Quality */}
            <div className="space-y-2">
              <SettingLabel 
                label={`Output Quality (${settings.output_quality})`}
                tooltip="Higher values give better quality but larger file sizes (except for PNG)"
              />
              <Slider
                value={[settings.output_quality]}
                min={1}
                max={100}
                step={1}
                onValueChange={([value]) => updateSetting('output_quality', value)}
              />
            </div>

            {/* Guidance Scale */}
            <div className="space-y-2">
              <SettingLabel 
                label={`Guidance Scale (${settings.guidance_scale})`}
                tooltip="Lower values (2-3.5) give more realistic images. Higher values follow the prompt more strictly"
              />
              <Slider
                value={[settings.guidance_scale]}
                min={1}
                max={10}
                step={0.1}
                onValueChange={([value]) => updateSetting('guidance_scale', value)}
              />
            </div>

            {/* Inference Steps */}
            <div className="space-y-2">
              <SettingLabel 
                label={`Inference Steps (${settings.num_inference_steps})`}
                tooltip="More steps can give more detailed images but take longer to generate"
              />
              <Slider
                value={[settings.num_inference_steps]}
                min={1}
                max={50}
                step={1}
                onValueChange={([value]) => updateSetting('num_inference_steps', value)}
              />
            </div>

            {/* Fast Generation Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SettingLabel 
                  label="Fast Generation"
                  tooltip="Optimize for speed over quality. Unavailable with custom sizes"
                />
                <p className="text-sm text-muted-foreground">
                  Sacrifice quality for faster generation
                </p>
              </div>
              <Switch
                checked={settings.go_fast}
                disabled={settings.aspect_ratio === 'custom'}
                onCheckedChange={(checked) => updateSetting('go_fast', checked)}
              />
            </div>
          </div>

          {/* Advanced Settings Toggle Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <span className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Advanced Settings
              </div>
              {showAdvancedSettings ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </Button>

          {/* Advanced Settings Section */}
          {showAdvancedSettings && (
            <div className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <SettingLabel 
                  label="Model"
                  tooltip="'dev' model works best with ~28 steps, 'schnell' only needs 4 steps"
                />
                <Select
                  value={settings.model}
                  onValueChange={(value) => updateSetting('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dev">Dev (Better Quality)</SelectItem>
                    <SelectItem value="schnell">Schnell (Faster)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Megapixels */}
              <div className="space-y-2">
                <SettingLabel 
                  label="Resolution"
                  tooltip="Higher resolution gives more detailed images but takes longer to generate"
                />
                <Select
                  value={settings.megapixels}
                  onValueChange={(value) => updateSetting('megapixels', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Standard (1MP)</SelectItem>
                    <SelectItem value="0.25">Low (0.25MP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* LoRA Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <SettingLabel 
                    label={`LoRA Scale (${settings.lora_scale})`}
                    tooltip="Determines how strongly the main LoRA should be applied"
                  />
                  <Slider
                    value={[settings.lora_scale]}
                    min={-1}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => updateSetting('lora_scale', value)}
                  />
                </div>

                {/* Extra LoRA Input */}
                <div className="space-y-2">
                  <SettingLabel 
                    label="Extra LoRA"
                    tooltip="Load additional LoRA weights (e.g., 'fofr/flux-pixar-cars')"
                  />
                  <Input
                    value={settings.extra_lora || ''}
                    onChange={(e) => updateSetting('extra_lora', e.target.value)}
                    placeholder="Enter LoRA identifier or URL"
                  />
                </div>

                {/* Extra LoRA Scale */}
                <div className="space-y-2">
                  <SettingLabel 
                    label={`Extra LoRA Scale (${settings.extra_lora_scale})`}
                    tooltip="Determines how strongly the extra LoRA should be applied"
                  />
                  <Slider
                    value={[settings.extra_lora_scale]}
                    min={-1}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => updateSetting('extra_lora_scale', value)}
                  />
                </div>
              </div>

              {/* Seed Input */}
              <div className="space-y-2">
                <SettingLabel 
                  label="Seed"
                  tooltip="Set a specific seed for reproducible results (optional)"
                />
                <Input
                  type="number"
                  value={settings.seed || ''}
                  onChange={(e) => updateSetting('seed', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Random seed (optional)"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageSettings;
