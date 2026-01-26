import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-slate-900 text-slate-50",
                secondary: "border-transparent bg-slate-100 text-slate-900",
                outline: "text-slate-950",
                "stance-strong": "border-transparent bg-success-500/10 text-success-700",
                "stance-improving": "border-transparent bg-primary-500/10 text-primary-700",
                "stance-mixed": "border-transparent bg-warning-500/10 text-warning-700",
                "stance-risky": "border-transparent bg-danger-500/10 text-danger-700",
                "stance-redflag": "border-transparent bg-danger-500 text-white font-bold",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
