// app/protected/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ImageIcon, VideoIcon, UserIcon } from "lucide-react";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect("/sign-in");
  }
  
  return (
    <div className="flex-1 container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user.email}</h1>
        <p className="text-muted-foreground">
          Choose what you'd like to create today
        </p>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Image Generation Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={20} />
              Image Generation
            </CardTitle>
            <CardDescription>
              Create stunning AI-generated images from text descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/protected/generate/image">
              <Button className="w-full">
                Generate Images
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Video Generation Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <VideoIcon size={20} />
              Video Generation
            </CardTitle>
            <CardDescription>
              Transform your ideas into AI-powered videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/protected/generate/video">
              <Button className="w-full">
                Generate Videos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon size={20} />
            Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Signed in as: {user.email}</p>
            <p>Account ID: {user.id}</p>
            <p>Last Sign In: {new Date(user.last_sign_in_at || '').toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
