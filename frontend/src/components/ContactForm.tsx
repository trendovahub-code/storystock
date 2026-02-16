"use client"

import * as React from "react"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"

type FormState = {
    name: string
    email: string
    message: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialFormState: FormState = {
    name: "",
    email: "",
    message: "",
}
const headingGradientStyle = {
    letterSpacing: "-0.03em",
    backgroundImage: "linear-gradient(90deg, #F27A1A, #F59E0B, #EF4444, #F27A1A)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text" as const,
    WebkitTextFillColor: "transparent",
    backgroundClip: "text" as const,
    animation: "gradient 6s linear infinite",
}

export function ContactForm() {
    const [form, setForm] = React.useState<FormState>(initialFormState)
    const [errors, setErrors] = React.useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const validate = (state: FormState): FormErrors => {
        const nextErrors: FormErrors = {}
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!state.name.trim()) nextErrors.name = "Name is required."
        if (!state.email.trim()) nextErrors.email = "Email is required."
        else if (!emailPattern.test(state.email.trim())) nextErrors.email = "Enter a valid email address."
        if (!state.message.trim()) nextErrors.message = "Message is required."

        return nextErrors
    }

    const onChange = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }))
        }
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const nextErrors = validate(form)
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    message: form.message.trim(),
                }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || "Failed to submit your message.")
            }

            toast.success("Message submitted successfully.")
            setForm(initialFormState)
            setErrors({})
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to submit your message."
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-16">
            <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-xl p-6 md:p-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text inline-block tracking-tight mb-2" style={headingGradientStyle}>Contact Us</h1>
                <p className="text-slate-600 mb-8">Have a question or feedback? Send us a message and we will get back to you.</p>

                <form onSubmit={onSubmit} className="space-y-5">
                    <Input
                        label="Name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={(e) => onChange("name", e.target.value)}
                        error={errors.name}
                        className="text-slate-900"
                        required
                    />

                    <Input
                        type="email"
                        label="Email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => onChange("email", e.target.value)}
                        error={errors.email}
                        className="text-slate-900"
                        required
                    />

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 leading-none">Message</label>
                        <textarea
                            placeholder="Write your message here..."
                            value={form.message}
                            onChange={(e) => onChange("message", e.target.value)}
                            className={`min-h-36 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 ${
                                errors.message ? "border-danger-500 focus-visible:ring-danger-500" : "border-slate-200 focus-visible:ring-primary-500"
                            }`}
                            required
                        />
                        {errors.message && <p className="text-xs text-danger-500 font-medium">{errors.message}</p>}
                    </div>

                    <Button
                        type="submit"
                        loading={isSubmitting}
                        className="w-full md:w-auto rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 border-none font-bold px-8"
                    >
                        Submit
                    </Button>
                </form>
            </div>
        </div>
    )
}
