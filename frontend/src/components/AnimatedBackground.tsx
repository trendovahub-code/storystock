'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const Orb = ({ color, size, initialX, initialY, duration, animate = true }: {
    color: string;
    size: number;
    initialX: string;
    initialY: string;
    duration: number;
    animate?: boolean;
}) => {
    const commonStyle = {
        width: size,
        height: size,
        left: initialX,
        top: initialY,
        transform: 'translate(-50%, -50%)',
    };

    if (!animate) {
        return (
            <div
                className={`fixed rounded-full blur-3xl opacity-20 pointer-events-none ${color}`}
                style={commonStyle}
            />
        );
    }

    return (
        <motion.div
            className={`fixed rounded-full blur-3xl opacity-30 pointer-events-none ${color}`}
            style={commonStyle}
            animate={{
                x: [0, 100, -50, 0],
                y: [0, -50, 100, 0],
                scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
};

export default function AnimatedBackground() {
    const shouldReduceMotion = useReducedMotion();
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
    );

    useEffect(() => {
        const media = window.matchMedia("(max-width: 768px)");
        const syncMobile = () => setIsMobile(media.matches);
        media.addEventListener("change", syncMobile);
        return () => media.removeEventListener("change", syncMobile);
    }, []);

    const shouldAnimate = !shouldReduceMotion && !isMobile;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fef3c7] to-[#ecfdf3]" aria-hidden>
            <div
                className={`absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_55%)] bg-[length:200%_200%] ${shouldAnimate ? "animate-gradient" : ""}`}
            />
            <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(15,23,42,0.16)_0.8px,transparent_0.8px)] [background-size:3px_3px] pointer-events-none" />

            {/* Animated Orbs */}
            <Orb
                color="bg-orange-400"
                size={isMobile ? 240 : 420}
                initialX="18%"
                initialY="28%"
                duration={26}
                animate={shouldAnimate}
            />
            <Orb
                color="bg-emerald-400"
                size={isMobile ? 280 : 520}
                initialX="80%"
                initialY="70%"
                duration={30}
                animate={shouldAnimate}
            />
            <Orb
                color="bg-amber-400"
                size={isMobile ? 220 : 360}
                initialX="48%"
                initialY="52%"
                duration={22}
                animate={shouldAnimate}
            />
            {!isMobile && (
                <Orb
                    color="bg-lime-400"
                    size={320}
                    initialX="12%"
                    initialY="88%"
                    duration={34}
                    animate={shouldAnimate}
                />
            )}
        </div>
    );
}
