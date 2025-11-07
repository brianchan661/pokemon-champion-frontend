import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary specifically for image loading failures
 * Provides graceful fallback when image components fail
 */
export class ImageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Image loading error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}