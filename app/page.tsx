"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";

export default function Home() {
  const router = useRouter();
  const { session, loading } = useApp();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/start" : "/login");
  }, [session, loading, router]);

  return null;
}
