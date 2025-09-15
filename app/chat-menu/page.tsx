"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Speech, Info, ChevronLeft, Zap } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { useTokens } from "@/components/token-provider";
import Link from "next/link";

type ChatStatus = "open" | "closed";

interface Message {
  _id: string;
  authorType: "user" | "specialist";
  content: string;
  createdAt: string;
}

interface Chat {
  _id: string;
  mode: "between" | "vent";
  status: ChatStatus;
  createdAt: string;
  messages?: Message[];
  lastMessage?: string | null;
  lastCreatedAt?: string;
  lastAuthorType?: "user" | "specialist" | null;
}


const modeInfo = {
  between: {
    title: "Между строк",
    icon: <MessageCircleQuestion className="w-7 h-7 text-primary" />,
    desc: (
      <>
        <div className="flex items-center gap-3 mb-2">
          <MessageCircleQuestion className="w-7 h-7 text-primary" />
          <span className="font-semibold text-lg">Разбор текста сообщений</span>
        </div>
        <ul className="list-disc list-inside mt-2 mb-2 text-sm space-y-1 pl-2">
          <li><b>Что это:</b> Психолог анализирует фрагмент вашей переписки (до 1000 символов).</li>
          <li><b>Как проходит:</b> Вы отправляете текст, психолог даёт развёрнутый ответ с анализом подтекста.</li>
          <li><b>Стоимость:</b> <span className="font-semibold text-primary inline-flex items-center">590&nbsp;<Zap className="h-3 w-3" /></span>.</li>
          <li><b>Кто отвечает:</b> Только живые сертифицированные психологи.</li>
        </ul>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Info className="w-4 h-4" />
          Среднее время ответа — 2-3 часа.
        </div>
      </>
    ),
  },
  vent: {
    title: "Выговориться",
    icon: <Speech className="w-7 h-7 text-primary" />,
    desc: (
      <>
        <div className="flex items-center gap-3 mb-2">
          <Speech className="w-7 h-7 text-primary" />
          <span className="font-semibold text-lg">Эмоциональная разгрузка</span>
        </div>
        <ul className="list-disc list-inside mt-2 mb-2 text-sm space-y-1 pl-2">
          <li><b>Что это:</b> Вы описываете ситуацию (до 1500 символов).</li>
          <li><b>Как проходит:</b> Психолог отвечает с поддержкой и эмпатией.</li>
          <li><b>Стоимость:</b> <span className="font-semibold text-primary inline-flex items-center">490&nbsp;<Zap className="h-3 w-3" /></span>.</li>
          <li><b>Кто отвечает:</b> Только живые сертифицированные психологи.</li>
        </ul>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Info className="w-4 h-4" />
          Среднее время ответа — 2-3 часа.
        </div>
      </>
    ),
  },
};

const userMessageLimitInitial = 1; // начальный лимит сообщений от пользователя

function sortChats(chats: Chat[]) {
  const order = { open: 0, closed: 1 };
  return [...chats].sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    if (tb !== ta) return tb - ta;
    return order[a.status] - order[b.status];
  });
}

export default function ChatMenu() {
  const [mode, setMode] = useState<"between" | "vent">("between");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"input" | "pay" | "done">("input");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [payMessageOpen, setPayMessageOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [userMessageLimit, setUserMessageLimit] = useState(1);
  const [notEnoughOpen, setNotEnoughOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const { tokens, setTokens } = useTokens();

  // Редирект на авторизацию
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: window.location.href });
    }
  }, [status]);

  // Прочитать mode из URL
  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "between" || m === "vent") setMode(m);
  }, [searchParams]);

  // Загрузить чаты
  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadingChats(true);
    fetch("/api/chats")
      .then(r => r.json())
      .then((data: Chat[]) => setChats(sortChats(data)))
      .catch(console.error)
      .finally(() => setLoadingChats(false));
  }, [status]);

  // Загрузить сообщения текущего чата
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    fetch(`/api/chats/${selectedChat._id}/messages`)
      .then(r => r.json())
      .then((msgs: Message[]) => {
        setSelectedChat(c => c ? { ...c, messages: msgs } : c);
        setUserMessageLimit((userMessageLimitInitial + 1) - msgs.filter(m => m.authorType === "user").length)
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedChat?._id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [selectedChat?.messages]);

  if (status === "loading" || loadingChats) return <Spinner />;

  const charLimits = { between: 1000, vent: 1500 };

  const handleAsk = () => {
    if (tokens < (mode === "between" ? 590 : 490)) {
      setNotEnoughOpen(true);
      return;
    }
    setStep("input");
    setQuestion("");
    setError("");
    setDialogOpen(true);
  };
  const handleNext = () => {
    if (!question.trim()) return setError("Введите ваш запрос");
    if (question.length > charLimits[mode]) return setError(`Максимум ${charLimits[mode]} символов`);
    setError(""); setStep("pay");
  };
  const handlePay = async () => {
    try {
      // создаём чат
      const resChat = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const newChat: Chat = await resChat.json();
      // добавляем первое сообщение
      await fetch(`/api/chats/${newChat._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: `initial-${mode}`,
          authorType: "user",
          content: question,
          isPaid: true,
        }),
      });
      setChats(prev => sortChats([{ ...newChat, lastAuthorType: 'user', lastMessage: question }, ...prev]));
      if (mode === "vent") {
        setTokens(tokens - 490);
      }
      else if (mode === "between") {
        setTokens(tokens - 590);
      }
      setStep("done");
    } catch {
      setError("Ошибка создания чата");
      setStep("input");
    }
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setStep("input");
    setQuestion("");
    setError("");
  };
  const handleSend = async () => {
    if (!selectedChat || !sendMessage.trim()) return;

    if (tokens < 249) {
      setNotEnoughOpen(true);
      return;
    }
    // Показываем окно оплаты вместо немедленной отправки
    setPendingMessage(sendMessage);
    setPayMessageOpen(true);
  };
  const handlePayAndSend = async () => {
    setSending(true);
    try {
      // Здесь должна быть интеграция с оплатой (заглушка)
      // await payForMessage(249);
      // После успешной оплаты отправляем сообщение
      const res = await fetch(`/api/chats/${selectedChat!._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorType: "user", content: pendingMessage, isPaid: true, type: `additional`, }),
      });
      const newMsg = await res.json();
      setTokens(tokens - 249);
      setSelectedChat((prev) =>
        prev
          ? {
            ...prev,
            messages: [...(prev.messages || []), newMsg],
            lastAuthorType: "user",
            lastMessage: newMsg.content,
          }
          : prev
      );
      setChats((prev) =>
        prev.map((c) =>
          c._id === selectedChat!._id
            ? { ...c, lastAuthorType: "user", lastMessage: newMsg.content }
            : c
        )
      );
      setSendMessage("");
      setPayMessageOpen(false);
      setPendingMessage("");
      setUserMessageLimit((prev) => Math.max(prev - 1, 0)); // уменьшаем лимит
    } catch {
      // обработка ошибки
    }
    setSending(false);
  };

  return (
    <>
      {/* Диалог создания */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6">
          {step === "input" && (
            <>
              <DialogHeader>
                <DialogTitle className="mb-2">{modeInfo[mode].title}</DialogTitle>
                <DialogDescription className="mb-4">
                  {mode === "between"
                    ? "Вставьте сюда фрагмент переписки..."
                    : "Опишите вашу ситуацию..."}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={question}
                onChange={e => { setQuestion(e.target.value); setError(""); }}
                maxLength={charLimits[mode]}
                rows={6}
                placeholder={
                  mode === "between"
                    ? "Вставьте текст переписки..."
                    : "Опишите ситуацию..."
                }
                className="mt-1"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {question.length}/{charLimits[mode]}
                </span>
                {error && <span className="text-xs text-red-500">{error}</span>}
              </div>
              <DialogFooter className="mt-4 flex gap-2">
                <Button onClick={handleNext} className="w-full">Далее</Button>
              </DialogFooter>
            </>
          )}
          {step === "pay" && (
            <>
              <DialogHeader>
                <DialogTitle className="mb-2">Оплата</DialogTitle>
                <DialogDescription className="mb-4">
                  Для отправки запроса необходимо оплатить услугу.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center gap-4 mb-4">
                <div className="text-4xl font-extrabold text-primary">
                  {mode === "between" ? "590" : "490"}&nbsp;<Zap className="inline-block h-7 w-7 -mt-1" />
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Оплата разового обращения к психологу.<br />
                  После оплаты ваш запрос будет отправлен.
                  <br />
                  <span className="text-xs block mt-2">
                    Отвечают только живые сертифицированные психологи центра Григория Мисютина (<a href="https://psycentergm.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">psycentergm.com</a>).
                    <br />
                    Среднее время ответа — 2-3 часа (по МСК, 9:00–21:00). Максимальный срок — до 24 часов.
                  </span>
                </div>
              </div>
              {/* тут ваш UI оплаты */}
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("input")} className="w-1/2">
                  Назад
                </Button>
                <Button onClick={handlePay} className="w-1/2">Оплатить</Button>
              </DialogFooter>
            </>
          )}
          {step === "done" && (
            <>
              <DialogHeader>
                <DialogTitle>Запрос отправлен!</DialogTitle>
                <DialogDescription>
                  Ваш чат создан и ожидает ответа психолога.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button onClick={handleDialogClose}>Закрыть</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог оплаты сообщения */}
      <Dialog open={payMessageOpen} onOpenChange={setPayMessageOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Оплата сообщения</DialogTitle>
            <DialogDescription>
              Для отправки дополнительного сообщения требуется оплата — <span className="font-bold text-primary inline-flex items-center">249&nbsp;<Zap className="h-3 w-3" /></span>.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 text-sm text-muted-foreground">
            После оплаты сообщение будет отправлено психологу.
          </div>
          {/* Здесь ваш UI оплаты */}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPayMessageOpen(false)} className="w-1/2">
              Отмена
            </Button>
            <Button onClick={handlePayAndSend} className="w-1/2" disabled={sending}>
              Оплатить и отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notEnoughOpen} onOpenChange={setNotEnoughOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Не хватает токенов</DialogTitle>
            <DialogDescription>
              Для отправки сообщения требуется пополнить токены <span className="font-bold text-primary inline-flex items-center"><Zap className="h-3 w-3" /></span>.
            </DialogDescription>
          </DialogHeader>
          {/* <div className="my-4 text-sm text-muted-foreground">
            После оплаты сообщение будет отправлено психологу.
          </div> */}
          {/* Здесь ваш UI оплаты */}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setNotEnoughOpen(false)} className="w-1/2">
              Закрыть
            </Button>
            <Link href="/purchase" className="w-1/2">
              <Button className="w-full" >
                Пополнить
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-0 flex flex-col md:flex-row bg-white dark:bg-black overflow-hidden md:h-[calc(100dvh-80px)]">
        {/* Левая панель (без изменений) */}
        <div className="w-full md:w-1/2 flex-1 flex flex-col justify-center px-2 py-4 md:px-0 md:py-0 border-b md:border-b-0 md:border-r border-muted-foreground/20 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
          <div className="max-w-lg mx-auto w-full p-4 md:p-8 rounded-2xl shadow-xl bg-white/90 dark:bg-zinc-900/90 flex flex-col gap-6 md:gap-8">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-center">Новый запрос психологу</h2>
            <div className="flex gap-2 md:gap-4 justify-center">
              <button
                className={`flex flex-col items-center gap-1 px-3 py-2 md:px-5 md:py-3 rounded-xl border transition-all shadow-sm ${mode === "between"
                  ? "bg-primary/10 border-primary text-primary scale-105"
                  : "bg-gray-100 dark:bg-zinc-800 border-transparent text-muted-foreground hover:bg-primary/5"}`}
                onClick={() => setMode("between")}
              >
                <MessageCircleQuestion className="w-6 h-6 md:w-7 md:h-7 mb-1" />
                <span className="font-semibold text-xs md:text-sm">Между строк</span>
              </button>
              <button
                className={`flex flex-col items-center gap-1 px-3 py-2 md:px-5 md:py-3 rounded-xl border transition-all shadow-sm ${mode === "vent"
                  ? "bg-primary/10 border-primary text-primary scale-105"
                  : "bg-gray-100 dark:bg-zinc-800 border-transparent text-muted-foreground hover:bg-primary/5"}`}
                onClick={() => setMode("vent")}
              >
                <Speech className="w-6 h-6 md:w-7 md:h-7 mb-1" />
                <span className="font-semibold text-xs md:text-sm">Выговориться</span>
              </button>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 border border-muted-foreground/10 p-3 md:p-5 shadow-sm text-xs md:text-base">
              {modeInfo[mode].desc}
            </div>
            <div className="flex justify-center">
              <Button className="w-full max-w-xs py-2 md:py-3 text-base md:text-lg font-semibold shadow-md" onClick={handleAsk}>
                Спросить
              </Button>
            </div>
          </div>
        </div>

        {/* Правая часть */}
        <div className="w-full md:w-1/2 flex-1 flex flex-col bg-white dark:bg-black">
          {selectedChat ? (
            <>
              <div className="sticky top-0 z-10 bg-white dark:bg-black pt-3 pb-2 px-3 md:px-6 border-b border-muted-foreground/10 flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedChat(null)}>
                  <ChevronLeft className="w-4 h-4" /> Назад
                </Button>
                <h2 className="text-xl md:text-2xl font-bold">
                  {modeInfo[selectedChat.mode].title}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-sm" ref={scrollRef}>
                {loadingMessages ? <Spinner /> : (
                  <>
                    {selectedChat.messages?.map((msg) => (
                      <div
                        key={msg._id}
                        className={`max-w-[75%] w-fit px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words relative
                          ${msg.authorType === "user"
                            ? "bg-primary text-white text-left self-end ml-auto"
                            : "bg-muted text-left self-start"
                          }`}
                        style={{ marginLeft: msg.authorType === "user" ? "auto" : undefined }}
                      >
                        {msg.content}
                        <div
                          className={`text-[10px] mt-1 text-right ${msg.authorType === "user"
                            ? "text-white/70"
                            : "text-gray-500"
                            }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                    {selectedChat.status === "closed" && (
                      <div className="text-muted-foreground text-sm italic">Сессия завершена.</div>
                    )}
                  </>
                )}
              </div>
              {/* Форма отправки сообщения, если чат открыт */}
              {(selectedChat.status !== "closed") && (
                <div className="border-t pt-4 px-4 md:px-6 pb-4 bg-white dark:bg-black">
                  <Textarea
                    value={sendMessage}
                    onChange={e => setSendMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!sending && userMessageLimit > 0) {
                          handleSend();
                        }
                      }
                    }}
                    rows={3}
                    placeholder="Напишите сообщение психологу..."
                    className="mb-2"
                  />
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      Осталось сообщений: <b>{userMessageLimit}</b>
                    </span>
                    {userMessageLimit <= 0 && (
                      <span className="text-xs text-red-500">Лимит сообщений исчерпан</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSend}
                      disabled={!sendMessage.trim() || sending || userMessageLimit <= 0}
                      className="w-full sm:w-auto"
                    >
                      Отправить
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="sticky top-0 z-10 bg-white dark:bg-black pt-3 pb-2 px-3 md:px-6 border-b border-muted-foreground/10">
                <h2 className="text-xl md:text-2xl font-bold">Ваши сессии</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 md:p-6 flex flex-col gap-2 md:gap-3">
                {chats.length === 0 ? (
                  <div className="text-center text-muted-foreground text-base py-12">
                    Сессий пока нет
                  </div>
                ) : (
                  chats.map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => setSelectedChat(chat)}
                      className={`text-left rounded-lg border p-3 md:p-4 flex flex-col gap-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${(chat.status !== "closed" && chat.lastAuthorType === "specialist") ? "border-green-400"
                        : (chat.status !== "closed" && chat.lastAuthorType === "user") ? "border-yellow-400"
                          : "border-muted-foreground/20"
                        }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-xs md:text-sm">
                          {chat.mode === "between"
                            ? <MessageCircleQuestion className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                            : <Speech className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                          }
                          {modeInfo[chat.mode].title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${(chat.status !== "closed" && chat.lastAuthorType === "specialist") ? "bg-green-100 text-green-800"
                          : (chat.status !== "closed" && chat.lastAuthorType === "user") ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                          }`}>
                          {(chat.status !== "closed" && chat.lastAuthorType === "specialist") ? "Есть ответ"
                            : (chat.status !== "closed" && chat.lastAuthorType === "user") ? "Ожидает ответа"
                              : "Завершён"}
                        </span>
                      </div>
                      <div className="text-xs md:text-sm overflow-x-auto line-clamp-2">
                        {chat.lastAuthorType === "specialist" && <><span className="font-bold">Психолог:</span> {chat.lastMessage}</>}
                        {chat.lastAuthorType === "user" && <><span className="font-bold">Вы:</span> {chat.lastMessage}</>}
                        {/* <span className="text-primary">Вы:</span> {chat.lastAuthorType ==="user" && chat.lastMessage} */}
                      </div>
                      {/* {chat.status!=="pending" && (
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2 line-clamp-2">
                          {chat.messages?.find(m => m.authorType==="specialist")?.content}
                        </div>
                      )} */}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
