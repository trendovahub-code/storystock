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
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-100 dark:from-primary-900 dark:via-primary-800 dark:to-primary-900">
            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            {/* Animated Orbs */}
            <Orb
                color="bg-indigo-400"
                size={400}
                initialX="20%"
                initialY="30%"
                duration={25}
            />
            <Orb
                color="bg-purple-400"
                size={500}
                initialX="80%"
                initialY="70%"
                duration={30}
            />
            <Orb
                color="bg-emerald-400"
                size={350}
                initialX="50%"
                initialY="50%"
                duration={20}
            />
            <Orb
                color="bg-amber-400"
                size={300}
                initialX="10%"
                initialY="90%"
                duration={35}
            />
        </div>
    );
}
