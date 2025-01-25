'use client';

import { useState, useEffect } from 'react';
import { Settings, LogOut, Image, Video, Brain, ArrowUpCircle, HelpCircle, Home, Music, Workflow, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function ProtectedPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const menuItems = [
    { id: 'home', icon: Home, label: 'Overview', path: '/protected' },
    { id: 'image', icon: Image, label: 'Image Generation', path: '/protected/generate/image' },
    { id: 'video', icon: Video, label: 'Video Generation', path: '/protected/generate/video' },
    { id: 'model', icon: Brain, label: 'Create Your AI Model', path: '#' },
    { id: 'imagelora', icon: Workflow, label: 'Create Image LORA', path: '#' },
    { id: 'videolora', icon: Workflow, label: 'Create Video LORA', path: '#' },
    { id: 'lipsync', icon: Music, label: 'Lipsync', path: '#' },
    { id: 'upscale', icon: ArrowUpCircle, label: 'Upscaler', path: '#' }
  ];

  const guideCards = [
    {
      title: "Master Image Generation",
      description: "Learn how to create stunning images with Flux AI. From basic prompts to advanced techniques.",
      icon: Image,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Custom Model Training",
      description: "Discover how to train and fine-tune your own AI models for specialized content generation.",
      icon: Brain,
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: "Perfect Lipsync Guide",
      description: "Create seamless lip-synchronized videos with our advanced AI technology.",
      icon: Music,
      gradient: "from-pink-500 to-red-600"
    }
  ];

  const handleNav = (path: string) => {
    if (path !== '#') {
      router.push(path);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800/50 flex flex-col backdrop-blur-sm bg-black/20">
        <div className="p-6 border-b border-gray-800/50">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Generator
          </h1>
        </div>
        
        <div className="p-4 border-b border-gray-800/50">
          <div className="text-sm text-gray-400">{user?.email}</div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleNav(item.path)}
              className={`flex w-full p-3 mb-2 rounded-lg transition-all duration-200 justify-start ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 text-white hover:text-white' 
                  : 'hover:bg-gray-800/50'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <Button
            variant="ghost"
            className="flex w-full p-3 hover:bg-gray-800/50 rounded-lg mb-2 justify-start"
            onClick={() => router.push('/settings')}
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="flex w-full p-3 hover:bg-gray-800/50 rounded-lg mb-2 justify-start"
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            Support
          </Button>
          <Button
            variant="ghost"
            className="flex w-full p-3 hover:bg-gray-800/50 rounded-lg justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Learn & Create
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guideCards.map((card, index) => (
              <div 
                key={index} 
                className="relative group rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700/50">
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl ml-3 font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed">{card.description}</p>
                  <button className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Read Guide
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
