import { Wallet } from "lucide-react";

export function PlaceholderConnect() {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
      <Wallet className="w-4 h-4" />
      <span>Connect</span>
    </button>
  );
}
