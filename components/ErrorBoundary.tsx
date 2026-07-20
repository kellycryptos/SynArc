"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary caught error in ${this.props.sectionName || 'App'}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
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
        <div className="min-h-[400px] flex items-center justify-center p-6 my-6 rounded-2xl bg-surface-elevated/40 border border-danger/30 backdrop-blur-md shadow-2xl">
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center mx-auto text-danger shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-white font-heading">
                Something went wrong
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                An unexpected error occurred in {this.props.sectionName ? `the ${this.props.sectionName} component` : "this component"}. The rest of the page remains safe.
              </p>
            </div>

            {process.env.NODE_ENV !== "production" && this.state.error && (
              <div className="p-3 rounded-xl bg-black/60 border border-danger/20 font-mono text-[11px] text-danger text-left overflow-x-auto max-h-32">
                <span className="font-bold">{this.state.error.name}: </span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-surface border border-border-thin hover:border-primary/40 text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-xs font-bold text-white-keep transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.25)]"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SectionErrorBoundary caught error in ${this.props.sectionName || 'Section'}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-xl bg-danger/5 border border-danger/20 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold font-heading">
              {this.props.sectionName ? `${this.props.sectionName} section failed to load` : "Section error"}
            </span>
          </div>
          <p className="text-[11px] text-muted leading-normal">
            This module encountered an issue, but the rest of the application is working normally.
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
