import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes WHILE an error is being shown, the boundary
   *  clears its own error state so navigating away from a broken page
   *  recovers it — without needing a `key` prop that would force React to
   *  unmount/remount this boundary's entire subtree (and everything
   *  persistent inside it, e.g. a dashboard's sidebar layout) on every
   *  single navigation, error or not. No effect while there's no error. */
  resetKey?: unknown;
  /** Set for a boundary around ONE section of a page (e.g. a settings tab): the fallback is a compact card naming that
   *  section and its error, so the rest of the page keeps working instead of the whole screen going blank. */
  section?: string;
  /** Classes for the section fallback card; defaults to the page-section margin. */
  sectionClassName?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Catches render-time errors and failed lazy-chunk loads anywhere below it so a
// single broken page can't take down the whole app with a blank white screen.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary]${this.props.section ? ` ${this.props.section}:` : ''} Uncaught error:`, error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.section) {
      return (
        <div role="alert" className={`${this.props.sectionClassName ?? 'm-4 sm:m-7'} border border-error-border bg-error-bg rounded-xl p-4 flex flex-wrap items-start gap-x-3 gap-y-2`}>
          <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
          <div className="min-w-[140px] flex-1">
            <p className="text-[13px] font-semibold text-error">{this.props.section} couldn't be shown</p>
            <p className="text-[12px] text-slate mt-0.5 break-words">{this.state.error.message || 'Unexpected error.'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleReset}>Try again</Button>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-12 rounded-full bg-brand-pale-orange flex items-center justify-center">
          <AlertTriangle size={22} className="text-brand-orange" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-carbon">Something went wrong</h1>
          <p className="text-[13px] text-slate mt-1 max-w-[360px]">
            This page ran into an unexpected error. You can try again, or reload the app.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Button variant="ghost" size="sm" onClick={this.handleReset}>
            Try again
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.location.reload()} className="gap-1.5">
            <RotateCw size={13} /> Reload page
          </Button>
        </div>
      </div>
    );
  }
}
