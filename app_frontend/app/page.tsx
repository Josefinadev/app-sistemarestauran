"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Redirige a /login — esta página raíz no se usa directamente */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}