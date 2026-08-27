"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import Splash from "./Splash";

export default function Home() {
  const router = useRouter();
  const { session, loading } = useApp();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/start" : "/login");
  }, [session, loading, router]);

  // Toon de splash i.p.v. een zwart scherm terwijl we doorsturen.
  return <Splash />;
}
