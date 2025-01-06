// app/protected/generate/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

export default function GeneratePage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Generate Content</h1>
        <p className="text-muted-foreground">Choose what type of content you want to generate</p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Generation Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/protected/generate/image">
            <CardHeader>
              <ImageIcon className="w-8 h-8 mb-2" />
              <CardTitle>Image Generation</CardTitle>
              <CardDescription>
                Create AI-generated images from text descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Images</Button>
            </CardContent>
          </Link>
        </Card>

        {/* Video Generation Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/protected/generate/video">
            <CardHeader>
              <VideoIcon className="w-8 h-8 mb-2" />
              <CardTitle>Video Generation</CardTitle>
              <CardDescription>
                Create AI-generated videos from text descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Videos</Button>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
