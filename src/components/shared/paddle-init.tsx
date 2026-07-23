"use client";

import { useEffect } from "react";

export function PaddleInit() {
  useEffect(() => {
    const check = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Paddle) {
        clearInterval(check);
        try {
          (window as any).Paddle.Initialize({
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
          });
        } catch (e) {
          console.error("Paddle init error:", e);
        }
      }
    }, 200);

    return () => clearInterval(check);
  }, []);

  return null;
}
