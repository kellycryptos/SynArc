"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { ConnectModal } from "@/components/ConnectModal";

export function PlaceholderConnect() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 w-full md:w-auto"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect</span>
      </button>

      <ConnectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
