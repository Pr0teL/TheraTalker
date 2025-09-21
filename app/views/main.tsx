"use client";

import { MorphingText } from "@/components/magicui/morphing-text";
import { Ripple } from "@/components/magicui/ripple";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, MessageCircleQuestion, Speech } from "lucide-react";
import Link from "next/link";

export function Main() {
    return (
        <section id="hero" className="py-10 px-4">
            <div className="container max-w-6xl mx-auto">
                {/* Заголовок */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
                        TheraTalker
                    </h1>
                    <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Сервис психологической поддержки с живыми профессионалами. Без ботов. Без лишних шагов. Только вы и эксперт.
                    </p>
                </div>
                <Ripple className="opacity-80"/>
                <div className="text-center">
                    <Link href="/chat-menu">
                    <Button
                        // variant="outline"
                        // className=""
                    >
                       Написать специалисту <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
