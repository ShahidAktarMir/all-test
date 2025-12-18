import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Lazy load pages for "Super Ultra Fast" initial load
const LandingPage = lazy(() => import('../pages/LandingPage').then(module => ({ default: module.LandingPage })));
const ReviewPage = lazy(() => import('../pages/ReviewPage').then(module => ({ default: module.ReviewPage })));
const ExamPage = lazy(() => import('../pages/ExamPage').then(module => ({ default: module.ExamPage })));
const ResultPage = lazy(() => import('../pages/ResultPage').then(module => ({ default: module.ResultPage })));

const LoadingScreen = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-700 animate-pulse">Loading Ultimate Engine...</h2>
    </div>
);

const router = createBrowserRouter([
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
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
