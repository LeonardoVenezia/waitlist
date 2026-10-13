"use client";

import { useEffect } from "react";

type PaddleGlobal = { Initialize: (opts: { token: string }) => void };

export function PaddleInit() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    const check = setInterval(() => {
      const paddle = (window as unknown as { Paddle?: PaddleGlobal }).Paddle;
      if (paddle) {
        clearInterval(check);
        try {
          paddle.Initialize({ token });
        } catch (e) {
          console.error("Paddle init error:", e);
        }
      }
    }, 200);

    return () => clearInterval(check);
  }, []);

  return null;
}
