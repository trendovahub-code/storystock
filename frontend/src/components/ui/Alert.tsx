import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
    "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
    {
        variants: {
            variant: {
                default: "bg-white text-slate-900 border-slate-200",
                success: "border-success-500/20 bg-success-500/5 text-success-700 [&>svg]:text-success-600",
                warning: "border-warning-500/20 bg-warning-500/5 text-warning-700 [&>svg]:text-warning-600",
                error: "border-danger-500/20 bg-danger-500/5 text-danger-700 [&>svg]:text-danger-600",
                info: "border-primary-500/20 bg-primary-500/5 text-primary-700 [&>svg]:text-primary-600",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const icons = {
    default: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
}

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    onClose?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "default", children, onClose, ...props }, ref) => {
        const Icon = icons[variant as keyof typeof icons] || icons.default

        return (
            <div
                ref={ref}
                role="alert"
                className={cn(alertVariants({ variant }), className)}
                {...props}
            >
                <Icon className="h-4 w-4" />
                <div className="flex flex-col gap-1">
                    {children}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-md opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        )
    }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm opacity-90", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
