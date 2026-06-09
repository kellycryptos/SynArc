"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { ShieldAlert, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <GlassCard className="p-8 md:p-10 max-w-lg relative overflow-hidden border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] flex flex-col items-center gap-6" hover={false}>
            {/* Ambient Glows */}
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 relative">
              <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-white font-heading">Something went wrong</h2>
              <p className="text-xs text-text-tertiary max-w-sm leading-relaxed mx-auto">
                An unexpected error occurred while rendering this component. This is often caused by temporary network issues or stale wallet sessions.
              </p>
              {this.state.error && (
                <div className="text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg max-w-md overflow-x-auto text-left whitespace-pre-wrap select-all">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-surface border border-border-thin hover:border-primary/30 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Application
            </button>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
