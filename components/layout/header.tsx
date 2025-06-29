'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { logout } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-[#008ea9] px-6 shadow-md">
      <div className="flex flex-1 items-center gap-4 md:gap-2 lg:gap-4">
        <div className="flex items-center">
          {/* Sleek Modern Logo */}
          <div className="relative group cursor-pointer">
            {/* Main Container - Better Proportioned */}
            <div className="relative flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 hover:scale-[1.01]">
              
              {/* Subtle Background Animation */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-transparent to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Refined Medical Icon */}
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/90 to-white/70 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  {/* Modern medical icon */}
                  <svg className="w-4 h-4 text-[#008ea9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    <circle cx="12" cy="8" r="1" fill="currentColor"/>
                  </svg>
                </div>
                
                {/* Status indicator */}
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border border-white shadow-sm animate-pulse"></div>
              </div>
              
              {/* Clean Typography */}
              <div className="flex flex-col">
                {/* Main Title */}
                <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                  Bio<span className="text-cyan-200 font-extrabold">Clinic</span>
                </h1>
                
                {/* Compact Subtitle */}
                <span className="text-[10px] text-white/70 font-medium tracking-wider uppercase leading-none">
                  Health Tech
                </span>
              </div>
              
              {/* Modern Year Badge */}
              <div className="ml-2 px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-100 text-[9px] font-bold rounded-md backdrop-blur-sm">
                2025
              </div>
            </div>
            
            {/* Subtle Glow */}
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
          </div>
        </div>
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-white/10 transition-colors duration-200 rounded-lg"
        >
          <Bell className="h-4 w-4 text-white" />
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-[10px] font-medium text-[#008ea9] flex items-center justify-center shadow-md">
            4
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-white/10 transition-colors duration-200 rounded-lg"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-white" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mt-2">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              <User className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-primary/10 cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-primary/10 cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}