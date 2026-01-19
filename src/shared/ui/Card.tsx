import * as React from "react";
import { cn } from "../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
}

export function Card({ className, glass = false, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "super-card text-white overflow-hidden", // Force Super-Card physics by default
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
