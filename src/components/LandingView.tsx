import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { BookOpen, Wifi, BatteryCharging, Coffee, ArrowRight, User } from 'lucide-react';

interface LandingProps {
  onLoginClick: () => void;
}

export default function LandingView({ onLoginClick }: LandingProps) {
  
  // Features List - Hardcoded for instant load
  const features = [
    { icon: Wifi, title: "High Speed WiFi", desc: "Unlimited 5G access for video lectures" },
    { icon: BookOpen, title: "Exam Resources", desc: "Latest books & monthly magazines" },
    { icon: BatteryCharging, title: "Power Backup", desc: "24/7 Electricity for uninterrupted study" },
    { icon: Coffee, title: "Peaceful Zone", desc: "Fully AC, Soundproof & RO Water" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 1. Hero Section - The "Hook" */}
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-primary px-6 pb-16 pt-12 text-center shadow-xl">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
             <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Pathshala</h1>
          <p className="text-primary-foreground/90">Digital Library & Self Study Centre</p>
        </motion.div>
      </div>

      {/* 2. Floating Action Card - The "Call to Action" */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-card shadow-lg border-none">
          <h3 className="font-semibold text-lg mb-1">Start Your Preparation</h3>
          <p className="text-sm text-muted-foreground mb-4 text-gray-500">Access Daily Quizzes, Mock Tests & Vacancy Updates.</p>
          <Button onClick={onLoginClick} className="w-full justify-between group">
            Member Login / Join
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card>
      </div>

      {/* 3. Features Grid - "Why Choose Us?" */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold mb-4 ml-1">Why Pathshala?</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <Card key={i} onClick={onLoginClick} className="flex flex-col items-center justify-center py-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <f.icon className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold text-sm">{f.title}</h4>
              <p className="text-[10px] text-gray-500 mt-1">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Footer Message */}
      <div className="mt-12 text-center p-6 text-gray-400 text-xs">
        <p>Managed by UT Arts</p>
        <p>Serving Rural Aspirants with ❤️</p>
      </div>
    </div>
  );
}