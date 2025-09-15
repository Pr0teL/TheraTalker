"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { useTokens } from "@/components/token-provider";
import { toast, Toaster } from "sonner";

export default function Purchase() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tokens, setTokens } = useTokens();

  const [loadingPackId, setLoadingPackId] = useState<number | null>(null);

  // Редирект на авторизацию
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: window.location.href });
    }
  }, [status]);

  if (status === "loading") return <Spinner />;

  const packs = [
    { id: 1, amount: 600, price: 590 },
    { id: 2, amount: 1200, price: 1090 },
    { id: 3, amount: 3000, price: 2490 },
  ];

  const handlePurchase = async (packId: number) => {
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return;

    setLoadingPackId(packId);

    try {
      const resp = await fetch("/api/purchase-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: pack.amount }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        // обработка ошибки
        console.error("Purchase failed:", data.error);
        toast.error("Ошибка при покупке: " + (data.error || "Неизвестная ошибка"));
      } else {
        // успешно — обновляем токены в UI
        if (data.tokens !== undefined) {
          setTokens(data.tokens);
        } else {
          // если ответ не вернул новое значение, просто добавим
          setTokens(tokens + pack.amount);
        }
        toast.success(`Вы купили ${pack.amount} токенов за ${pack.price}₽`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Ошибка сети или сервера");
    } finally {
      setLoadingPackId(null);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-80px)] flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-8">Пополните баланс токенов</h1>
      <div className="grid gap-6 md:grid-cols-3 w-full max-w-5xl">
        {packs.map((pack) => (
          <Card key={pack.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-blue-800" />
                {pack.amount} токенов
              </CardTitle>
              <CardDescription>Мгновенное зачисление</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <div className="text-2xl font-semibold">{pack.price}₽</div>
              <Button
                className="w-full"
                onClick={() => handlePurchase(pack.id)}
                disabled={loadingPackId === pack.id}
              >
                {loadingPackId === pack.id ? "Обработка..." : "Купить"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="mt-10 text-sm text-muted-foreground text-center max-w-xl">
        Все покупки токенов являются окончательными и возврату не подлежат. В
        случае возникновения технических проблем с сервисом, пожалуйста,
        обратитесь за помощью в нашу службу поддержки.
      </span>
      <Toaster />
    </div>
  );
}
