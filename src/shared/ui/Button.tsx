import * as React from "react"
import { cn } from "../lib/utils";
// Note: We don't have radix-ui installed yet, simulating Slot behavior or falling back to simple button if needed.
// Actually, let's keep it simple and premium without heavy deps like radix if not asked, but Slot is standard for robust design systems.
// For now, I'll remove Slot to avoid install complexity unless requested, but keep the cva structure.

// We need 'class-variance-authority' for this premium design pattern.
// I will assume it's available or I should have installed it. I didn't install 'class-variance-authority'.
// Let me quick-fix this by just using a tailored component without CVA for now to save time, or better, install it.
// Installing it is 'cleaner'. I will add a step to install it next turn if I fail here.
// Actually, I can write a simple version without CVA for now to avoid blocking.

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

        const variants = {
            primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5",
            secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200",
            outline: "border-2 border-slate-200 bg-transparent hover:border-indigo-500 hover:text-indigo-600 text-slate-600",
            ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
            danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        };

        const sizes = {
            sm: "h-9 px-4 text-xs",
            md: "h-11 px-8 text-sm",
            lg: "h-14 px-10 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                    </span>
                ) : children}
            </button>
        )
    }
)
Button.displayName = "Button"
