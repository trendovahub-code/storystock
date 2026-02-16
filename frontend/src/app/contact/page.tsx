import { Metadata } from "next"
import { ContactForm } from "@/components/ContactForm"

export const metadata: Metadata = {
    title: "Contact Us - Trendova Hub",
    description: "Contact Trendova Hub with your questions, feedback, or partnership inquiries.",
}

export default function ContactPage() {
    return <ContactForm />
}

