"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircleQuestion, Speech } from "lucide-react";
import Spinner from "@/components/ui/spinner";

interface Message {
    _id: string;
    authorType: "user" | "specialist";
    content: string;
    createdAt: string;
}

interface Chat {
    _id: string;
    mode: "between" | "vent";
    status: "open" | "closed";
    createdAt: string;
    lastAuthorType: string;
    messages?: Message[];
}

const modeInfo = {
    between: {
        title: "Между строк",
        icon: <MessageCircleQuestion className="w-4 h-4 text-muted-foreground" />,
    },
    vent: {
        title: "Выговориться",
        icon: <Speech className="w-4 h-4 text-muted-foreground" />,
    },
};

export function Specialist() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/chats?status=open")
            .then((res) => res.json())
            .then(setChats)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedChat) return;
        fetch(`/api/chats/${selectedChat._id}/messages`)
            .then((res) => res.json())
            .then((msgs: Message[]) => {
                setSelectedChat((prev) => prev ? { ...prev, messages: msgs } : null);
            });
    }, [selectedChat?._id]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [selectedChat?.messages]);

    const handleSend = async () => {
        if (!selectedChat || !message.trim()) return;
        setSending(true);

        // Отправляем сообщение
        const res = await fetch(`/api/chats/${selectedChat._id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message, authorType: "specialist" }),
        });

        const newMessage: Message = await res.json();

        // Обновляем сообщения и lastAuthorType в выбранном чате
        setSelectedChat((prev) =>
            prev
                ? {
                    ...prev,
                    messages: [...(prev.messages || []), newMessage],
                    lastAuthorType: "specialist", // обновляем
                }
                : null
        );

        // Обновляем список чатов (lastAuthorType)
        setChats((prev) =>
            prev.map((c) =>
                c._id === selectedChat._id
                    ? { ...c, lastAuthorType: "specialist" }
                    : c
            )
        );

        setMessage("");
        setSending(false);
    };

    return (
        <div className="h-[calc(100dvh-80px)] flex flex-col md:flex-row divide-y md:divide-x md:divide-y-0 border-t w-full">
            {/* Список чатов */}
            <div
                className={`${selectedChat ? "hidden md:block" : "block"
                    } w-full md:w-1/3 max-w-md overflow-y-auto bg-muted/20 p-4`}
            >
                <h2 className="text-lg font-semibold mb-4">Запросы</h2>
                {loading ? (
                    <Spinner />
                ) : (
                    <ScrollArea className="space-y-2">
                        {chats.length === 0 && (
                            <div className="text-muted-foreground text-sm">Нет новых чатов</div>
                        )}
                        {chats
                            .slice()
                            .sort((a, b) => {
                                if (a.lastAuthorType !== 'specialist' && b.lastAuthorType === 'specialist') return -1;
                                if (a.lastAuthorType === 'specialist' && b.lastAuthorType !== 'specialist') return 1;
                                return 0;
                            })
                            .map((chat) => (
                                <button
                                    key={chat._id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`w-full text-left p-3 rounded-lg border shadow-sm bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition ${selectedChat?._id === chat._id ? "border-primary" : "border-muted"
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm mb-1">
                                            {modeInfo[chat.mode].icon}
                                            <span>{modeInfo[chat.mode].title}</span>
                                        </div>
                                        <div>
                                            {chat.lastAuthorType !== 'specialist' && (
                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(chat.createdAt).toLocaleString()}
                                    </div>
                                </button>
                            ))}
                    </ScrollArea>
                )}
            </div>

            {/* Окно чата */}
            <div
                className={`${selectedChat ? "flex" : "hidden"
                    } flex-col w-full md:flex md:flex-1 p-4 h-[calc(100dvh-80px)] md:h-auto min-h-0`}
            >
                {selectedChat ? (
                    <>
                        <div className="mb-2 flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                {modeInfo[selectedChat.mode].title}
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedChat(null)}
                                className="md:hidden"
                            >
                                Назад
                            </Button>
                        </div>

                        {/* Сообщения */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 min-h-0"
                        >
                            {selectedChat.messages?.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`max-w-[75%] w-fit px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words relative
                  ${msg.authorType === "user"
                                            ? "bg-muted text-left self-start"
                                            : "bg-primary text-white text-left self-end ml-auto"
                                        }`}
                                >
                                    {msg.content}
                                    <div
                                        className={`text-[10px] mt-1 text-right ${msg.authorType === "user"
                                            ? "text-gray-500"
                                            : "text-white/70"
                                            }`}
                                    >
                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Ответ */}
                        <div className="border-t pt-4">
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                rows={4}
                                placeholder="Напишите ваш ответ..."
                                className="mb-2"
                            />
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <Button
                                    onClick={handleSend}
                                    disabled={!message.trim() || sending}
                                    className="sm:w-auto w-full"
                                >
                                    <Send className="w-4 h-4 mr-2" /> Отправить
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-muted-foreground flex-1 hidden md:flex items-center justify-center text-center px-6">
                        Выберите чат, чтобы просмотреть и ответить
                    </div>
                )}
            </div>
        </div>
    );

}
