"use client";

import { useApp } from "@/lib/appauth";
import Splash from "./Splash";

// Toont de splash-animatie zolang de app opstart (auth + profiel laden),
// zodat je geen zwart scherm ziet.
export default function SplashGate() {
  const { loading } = useApp();
  if (!loading) return null;
  return <Splash />;
}
