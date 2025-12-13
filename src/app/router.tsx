import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { ReviewPage } from '../pages/ReviewPage';
import { ExamPage } from '../pages/ExamPage';
import { ResultPage } from '../pages/ResultPage';

const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />,
    },
    {
        path: '/review',
        element: <ReviewPage />,
    },
    {
        path: '/exam',
        element: <ExamPage />,
    },
    {
        path: '/result',
        element: <ResultPage />,
    }
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
