import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, Outlet } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';

// --- QUANTUM LOADING STATE ---
// The Loading Screen itself must obey the "Lighting Rule" and "Focus Rule".
// It is not just a spinner; it is the event horizon of the application.
const LoadingScreen = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-deep)] text-white overflow-hidden relative">
        {/* Ambient Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full animate-pulse" />

        <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 animate-ping" />
                <Loader2 className="h-16 w-16 text-indigo-400 animate-spin relative z-10" />
            </div>

            <h2 className="mt-8 text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent animate-fade-in-up">
                INITIALIZING CORE
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs font-mono text-indigo-400/60 uppercase tracking-[0.2em]">
                <Zap size={12} />
                <span>System Optimization: Active</span>
            </div>
        </div>
    </div>
);

// --- PREDICTIVE PREFETCHING MECHANISM ---
// "The best way to predict the future is to load it before it happens."
// We manually trigger the dynamic import when the system is idle or likely to engage.

const factories = {
    landing: () => import('../pages/LandingPage'),
    review: () => import('../pages/ReviewPage'),
    exam: () => import('../pages/ExamPage'),
    result: () => import('../pages/ResultPage'),
};

// Lazy Wrappers with Named Export Adapters
const LandingPage = lazy(() => factories.landing().then(module => ({ default: module.LandingPage })));
const ReviewPage = lazy(() => factories.review().then(module => ({ default: module.ReviewPage })));
const ExamPage = lazy(() => factories.exam().then(module => ({ default: module.ExamPage })));
const ResultPage = lazy(() => factories.result().then(module => ({ default: module.ResultPage })));

// Prefetcher Component (The Observer)
function RouteObserver() {
    const location = useLocation();

    useEffect(() => {
        // Simple Heuristic: If we are at /, we will likely go to /review next.
        // If at /review, /exam is next.
        const path = location.pathname;

        const prefetch = (factory: () => Promise<any>) => {
            factory(); // Trigger the promise, browser caches the module.
        };

        if (path === '/') prefetch(factories.review);
        if (path === '/review') prefetch(factories.exam);
        if (path === '/exam') prefetch(factories.result);

    }, [location]);

    return <Outlet />;
}


const router = createBrowserRouter([
    {
        element: <RouteObserver />, // Wrap routes with observer
        children: [
            {
                path: '/',
                element: <Suspense fallback={<LoadingScreen />}><LandingPage /></Suspense>,
            },
            {
                path: '/review',
                element: <Suspense fallback={<LoadingScreen />}><ReviewPage /></Suspense>,
            },
            {
                path: '/exam',
                element: <Suspense fallback={<LoadingScreen />}><ExamPage /></Suspense>,
            },
            {
                path: '/result',
                element: <Suspense fallback={<LoadingScreen />}><ResultPage /></Suspense>,
            }
        ]
    }
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
