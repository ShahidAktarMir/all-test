import * as React from "react";
import { cn } from "../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
}

export function Card({ className, glass = false, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-100 bg-white shadow-sm",
                glass && "backdrop-blur-md bg-white/70 border-white/20 shadow-xl", // Premium glass effect
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pb-2", className)} {...props}>{children}</div>
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-2", className)} {...props}>{children}</div>
}
