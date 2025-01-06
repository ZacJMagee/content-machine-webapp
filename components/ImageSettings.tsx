import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { ImageSettings } from '@/types/image-generation';

interface ImageSettingsProps {
  settings: ImageSettings;
  onSettingsChange: (newSettings: ImageSettings) => void;
}

const ImageSettingsComponent = ({ settings, onSettingsChange }: ImageSettingsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

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

          {settings.aspect_ratio === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs">Width (px)</Label>
                <Input
                  type="number"
                  min={256}
                  max={1440}
                  step={16}
                  value={settings.width || 512}
                  onChange={(e) => updateSetting('width', Math.min(1440, Math.max(256, parseInt(e.target.value))))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Height (px)</Label>
                <Input
                  type="number"
                  min={256}
                  max={1440}
                  step={16}
                  value={settings.height || 512}
                  onChange={(e) => updateSetting('height', Math.min(1440, Math.max(256, parseInt(e.target.value))))}
                  className="h-8"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quality Settings */}
        <div className="space-y-4">
          {/* Output Format */}
          <div className="space-y-2">
            <SettingLabel 
              label="Output Format" 
              tooltip="The file format for the generated image"
            />
            <Select
              value={settings.output_format}
              onValueChange={(value) => updateSetting('output_format', value as 'webp' | 'png' | 'jpg')}
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

          {/* Output Quality */}
          <div className="space-y-2">
            <SettingLabel 
              label={`Output Quality (${settings.output_quality})`}
              tooltip="Higher values give better quality but larger file sizes"
            />
            <Slider
              value={[settings.output_quality]}
              min={1}
              max={100}
              step={1}
              onValueChange={([value]) => updateSetting('output_quality', value)}
              className="py-3"
            />
          </div>

          {/* Number of Outputs */}
          <div className="space-y-2">
            <SettingLabel 
              label="Number of Images" 
              tooltip="Generate multiple variations at once"
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
            {/* Model Settings */}
            <div className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <SettingLabel 
                  label="Model"
                  tooltip="Choose between quality and speed"
                />
                <Select
                  value={settings.model}
                  onValueChange={(value) => updateSetting('model', value as 'dev' | 'schnell')}
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

              {/* Resolution */}
              <div className="space-y-2">
                <SettingLabel 
                  label="Resolution"
                  tooltip="Higher resolution gives more detailed images"
                />
                <Select
                  value={settings.megapixels}
                  onValueChange={(value) => updateSetting('megapixels', value as '1' | '0.25')}
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
            </div>

            {/* Generation Settings */}
            <div className="space-y-4">
              {/* Prompt Strength */}
              <div className="space-y-2">
                <SettingLabel 
                  label={`Prompt Strength (${settings.prompt_strength.toFixed(2)})`}
                  tooltip="How strongly to follow the prompt description"
                />
                <Slider
                  value={[settings.prompt_strength]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => updateSetting('prompt_strength', value)}
                  className="py-3"
                />
              </div>

              {/* Guidance Scale */}
              <div className="space-y-2">
                <SettingLabel 
                  label={`Guidance Scale (${settings.guidance_scale.toFixed(1)})`}
                  tooltip="Lower values (2-3.5) give more realistic images"
                />
                <Slider
                  value={[settings.guidance_scale]}
                  min={1}
                  max={10}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('guidance_scale', value)}
                  className="py-3"
                />
              </div>

              {/* Inference Steps */}
              <div className="space-y-2">
                <SettingLabel 
                  label={`Inference Steps (${settings.num_inference_steps})`}
                  tooltip="More steps can give more detailed images"
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

              {/* Fast Generation */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <SettingLabel 
                    label="Fast Generation"
                    tooltip="Optimize for speed over quality"
                  />
                  <p className="text-xs text-muted-foreground">
                    Faster generation, lower quality
                  </p>
                </div>
                <Switch
                  checked={settings.go_fast}
                  disabled={settings.aspect_ratio === 'custom'}
                  onCheckedChange={(checked) => updateSetting('go_fast', checked)}
                />
              </div>
            </div>

            {/* LoRA Settings */}
            <div className="space-y-4">
              {/* Main LoRA Scale */}
              <div className="space-y-2">
                <SettingLabel 
                  label={`LoRA Scale (${settings.lora_scale.toFixed(2)})`}
                  tooltip="Strength of the main LoRA effect"
                />
                <Slider
                  value={[settings.lora_scale]}
                  min={-1}
                  max={3}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('lora_scale', value)}
                  className="py-3"
                />
              </div>

              {/* Extra LoRA */}
              <div className="space-y-2">
                <SettingLabel 
                  label="Extra LoRA"
                  tooltip="Additional LoRA identifier or URL"
                />
                <Input
                  value={settings.extra_lora || ''}
                  onChange={(e) => updateSetting('extra_lora', e.target.value)}
                  placeholder="e.g., fofr/flux-pixar-cars"
                  className="h-8"
                />
              </div>

              {/* Extra LoRA Scale */}
              <div className="space-y-2">
                <SettingLabel 
                  label={`Extra LoRA Scale (${settings.extra_lora_scale.toFixed(2)})`}
                  tooltip="Strength of the extra LoRA effect"
                />
                <Slider
                  value={[settings.extra_lora_scale]}
                  min={-1}
                  max={3}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('extra_lora_scale', value)}
                  className="py-3"
                />
              </div>
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
          </div>
        </Section>
      )}
    </div>
  );
};

export default ImageSettingsComponent;
