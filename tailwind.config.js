/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        transitionTimingFunction: {
            'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        animation: {
            'fade-in-up': 'fadeInUp 0.5s ease-out',
            'slide-in': 'slideIn 0.3s ease-out',
            shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            scan: 'scan 3s ease-in-out infinite',
            'gradient-x': 'gradient-x 3s ease infinite'
        },
        keyframes: {
            fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(20px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            slideIn: {
                '0%': { transform: 'translateX(100%)' },
                '100%': { transform: 'translateX(0)' },
            },
            shake: {
                '0%, 100%': { transform: 'translateX(0)' },
                '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
            },
            scan: {
                '0%': { transform: 'translateY(-100%)' },
                '100%': { transform: 'translateY(100vh)' } /* Generic vertical scan */
            },
            'gradient-x': {
                '0%, 100%': {
                    'background-size': '200% 200%',
                    'background-position': 'left center'
                },
                '50%': {
                    'background-size': '200% 200%',
                    'background-position': 'right center'
                }
            }
        }
    },
    plugins: [],
}
