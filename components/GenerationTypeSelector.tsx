// components/GenerationTypeSelector.tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, VideoIcon } from "lucide-react";

interface GenerationTypeSelectorProps {
  value: 'image' | 'text';
  onChange: (value: 'image' | 'text') => void;
  disabled?: boolean;
}

const GenerationTypeSelector = ({
  value,
  onChange,
  disabled = false
}: GenerationTypeSelectorProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <RadioGroup
          value={value}
          onValueChange={onChange as (value: string) => void}
          className="grid grid-cols-2 gap-4"
        >
          <div className="relative flex items-center justify-center">
            <RadioGroupItem
              value="image"
              id="image"
              className="peer sr-only"
              disabled={disabled}
            />
            <Label
              htmlFor="image"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <ImageIcon className="mb-2 h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Image to Video</p>
                <p className="text-sm text-muted-foreground">
                  Start with an image
                </p>
              </div>
            </Label>
          </div>

          <div className="relative flex items-center justify-center">
            <RadioGroupItem
              value="text"
              id="text"
              className="peer sr-only"
              disabled={disabled}
            />
            <Label
              htmlFor="text"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <VideoIcon className="mb-2 h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Text to Video</p>
                <p className="text-sm text-muted-foreground">
                  Start with a description
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default GenerationTypeSelector;
