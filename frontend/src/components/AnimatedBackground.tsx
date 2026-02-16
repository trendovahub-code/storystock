'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const Orb = ({ color, size, initialX, initialY, duration }: {
    color: string;
    size: number;
    initialX: string;
    initialY: string;
    duration: number;
}) => {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return (
            <div
                className={`fixed rounded-full blur-3xl opacity-20 pointer-events-none ${color}`}
                style={{
                    width: size,
                    height: size,
                    left: initialX,
                    top: initialY,
                    transform: 'translate(-50%, -50%)',
                }}
            />
        );
    }

    return (
        <motion.div
            className={`fixed rounded-full blur-3xl opacity-30 pointer-events-none ${color}`}
            style={{
                width: size,
                height: size,
                left: initialX,
                top: initialY,
            }}
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fef3c7] to-[#ecfdf3]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_55%)] animate-gradient bg-[length:200%_200%]" />
            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none" />

            {/* Animated Orbs */}
            <Orb
                color="bg-orange-400"
                size={420}
                initialX="18%"
                initialY="28%"
                duration={26}
            />
            <Orb
                color="bg-emerald-400"
                size={520}
                initialX="80%"
                initialY="70%"
                duration={30}
            />
            <Orb
                color="bg-amber-400"
                size={360}
                initialX="48%"
                initialY="52%"
                duration={22}
            />
            <Orb
                color="bg-lime-400"
                size={320}
                initialX="12%"
                initialY="88%"
                duration={34}
            />
        </div>
    );
}
