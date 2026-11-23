"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps a crashing demo from taking the whole page down. Shows what failed,
 * so "I can't see anything" becomes an actual error message.
 */
export class DemoBoundary extends Component<{ children: ReactNode; slug: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[labs] demo "${this.props.slug}" crashed:`, error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="max-w-sm rounded-3xl bg-inset p-5 text-body">
        <p className="font-semibold">This demo failed to render.</p>
        <p className="mt-1 break-words text-caption text-muted-foreground">{this.state.error.message}</p>
        <button type="button" className="mt-3 rounded-full bg-inset-2 px-4 py-1.5 text-caption" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
