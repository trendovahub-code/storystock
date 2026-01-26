import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string
    helperText?: string
    label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, ...props }, ref) => {
        return (
            <div className="flex flex-col space-y-1.5 w-full">
                {label && (
                    <label className="text-sm font-medium text-slate-700 leading-none">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                        error && "border-danger-500 focus-visible:ring-danger-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {helperText && !error && (
                    <p className="text-xs text-slate-500">{helperText}</p>
                )}
                {error && (
                    <p className="text-xs text-danger-500 font-medium">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
