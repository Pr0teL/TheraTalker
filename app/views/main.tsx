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


                {/* Карточки */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                    <Link href="/chat-menu?mode=between">
                        <Card className="group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                                <div className="flex items-center gap-3 text-primary">
                                    <MessageCircleQuestion className="w-6 h-6" />
                                    <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                        Между строк
                                    </h2>
                                </div>

                                <div className="text-muted-foreground text-sm leading-relaxed space-y-2">
                                    <p>
                                        Сомневаетесь в подтексте переписки? Отправьте фрагмент или пересказ —
                                        психолог поможет увидеть скрытые смыслы и подобрать верную реакцию.
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Анализ эмоционального фона и ролевых паттернов</li>
                                        <li>Расшифровка возможных манипуляций и токсичных элементов</li>
                                        <li>Советы по формулировке ответов и выстраиванию границ</li>
                                    </ul>
                                    <p className="font-medium pt-2">
                                        Один запрос — один развернутый ответ.
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    className="mt-6 w-fit group-hover:bg-primary group-hover:text-white transition"
                                >
                                    Начать <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    
                    <Link href="/chat-menu?mode=vent">
                        <Card className="group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                                <div className="flex items-center gap-3 text-primary">
                                    <Speech className="w-6 h-6" />
                                    <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                        Выговориться
                                    </h2>
                                </div>

                                <div className="text-muted-foreground text-sm leading-relaxed space-y-2">
                                    <p>
                                        Если переполняет тревога или грусть — просто расскажите, что происходит. Психолог выслушает и поможет справиться с переживаниями.
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Без осуждения и оценки</li>
                                        <li>С вниманием и теплом</li>
                                        <li>С фокусом на ваше состояние</li>
                                    </ul>
                                    <p className="font-medium pt-2">
                                        Один запрос — один развернутый ответ.
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    className="mt-6 w-fit group-hover:bg-primary group-hover:text-white transition"
                                >
                                    Начать <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div> */}
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
