'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Card className="p-6">
              <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-sm">{this.state.error?.message}</p>
                <Button
                  variant="link"
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  Try again
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
