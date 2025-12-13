import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100 border border-red-100">
                        <AlertTriangle size={48} />
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">System Malfunction</h1>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
                        A critical error occurred. The system has paused to prevent data corruption.
                    </p>

                    <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs text-left w-full max-w-lg mb-8 overflow-auto max-h-48 border border-slate-700 shadow-inner">
                        {this.state.error?.toString()}
                    </div>

                    <Button
                        size="lg"
                        onClick={() => window.location.href = '/'}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                    >
                        <RefreshCw className="mr-2" /> System Reboot
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
