import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Module name for error context, e.g. "Chat", "Upload" */
  module?: string;
  /** Custom fallback renderer */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Per-module error boundary with structured fallback UI.
 * Prevents a single module crash from taking down the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, log to Sentry/DataDog with module context
    console.error(`[ErrorBoundary:${this.props.module || "App"}]`, error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return <DefaultFallback error={this.state.error} reset={this.reset} module={this.props.module} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({
  error,
  reset,
  module,
}: {
  error: Error;
  reset: () => void;
  module?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "rgba(244,63,94,0.1)" }}
      >
        <span className="text-[20px]">⚠</span>
      </div>
      <h2 className="text-[15px] mb-1" style={{ fontWeight: 600, color: "#E8EAF6" }}>
        {module ? `${module} encountered an error` : "Something went wrong"}
      </h2>
      <p className="text-[12px] mb-4" style={{ color: "#9BA3C8", maxWidth: 400 }}>
        {error.message || "An unexpected error occurred. Try refreshing or click below to retry."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-[12px] transition-colors hover:opacity-90"
        style={{
          fontWeight: 500,
          backgroundColor: "#5C6CF5",
          color: "#FFFFFF",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
