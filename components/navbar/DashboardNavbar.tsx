"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bell, Search, Menu } from "lucide-react";

export function DashboardNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border-thin h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 -ml-2 text-muted hover:text-foreground transition-colors cursor-pointer" onClick={onMenuClick}>
           <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center bg-surface-elevated border border-border-thin rounded-full px-3 py-1.5 w-64 lg:w-80 focus-within:border-primary/50 focus-within:shadow-[0_0_10px_rgba(124,58,237,0.1)] transition-all">
          <Search className="w-4 h-4 text-muted mr-2" />
          <input 
            type="text" 
            placeholder="Search proposals, addresses..." 
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
         <div className="flex items-center gap-2">
           <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" label="Connect Wallet" />
         </div>
         <button className="relative p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface-elevated border border-transparent hover:border-border-thin cursor-pointer">
           <Bell className="w-5 h-5" />
           <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
         </button>
      </div>
    </header>
  );
}
