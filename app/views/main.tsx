"use client";

import { AuroraText } from "@/components/magicui/aurora-text";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";

export function Main() {

    const fadeUpVariants = {
        initial: {
            opacity: 0,
            y: 24,
        },
        animate: {
            opacity: 1,
            y: 0,
        },
    };

    return (
        <section id="hero">
            <div className="relative h-full overflow-hidden py-14">
                <div className="container z-10 flex flex-col">
                    <div className="mt-20 grid grid-cols-1">
                        <div className="flex flex-col items-center gap-6 pb-8 text-center">
                            <h1
                                className="text-balance bg-gradient-to-br from-black from-30% to-black/60 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl"
                            >
                                <AuroraText>Start</AuroraText>loom
                            </h1>

                            <p
                                className="text-balance text-lg tracking-tight text-gray-400 md:text-xl"
                            >
                                Идеальный шаблон для быстрого создания стартапов/веб‑сервисов.<br />
                                В основе — Next.js, NextAuth, shadcn/ui и MagicUI.<br />
                                Запускай не только быстро, но и красиво!
                            </p>

                            <div
                                className="flex flex-col gap-4 lg:flex-row"
                            >
                                <a
                                    href="#"
                                    className={cn(
                                        // colors
                                        "bg-black  text-white shadow hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",

                                        // layout
                                        "group relative inline-flex h-9 w-full items-center justify-center gap-2 overflow-hidden whitespace-pre rounded-md px-4 py-2 text-base font-semibold tracking-tighter focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 md:flex",

                                        // animation
                                        "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-2",
                                    )}
                                >
                                    Документация
                                    <ChevronRight className="size-4 translate-x-0 transition-all duration-300 ease-out group-hover:translate-x-1" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}