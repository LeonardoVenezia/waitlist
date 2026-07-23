"use client";

import { useEffect } from "react";

export function PaddleInit() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    const check = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Paddle) {
        clearInterval(check);
        try {
          const env = token.startsWith("test_") ? "sandbox" : "production";
          (window as any).Paddle.Initialize({ token, environment: env });
        } catch (e) {
          console.error("Paddle init error:", e);
        }
      }
    }, 200);

    return () => clearInterval(check);
  }, []);

  return null;
}
