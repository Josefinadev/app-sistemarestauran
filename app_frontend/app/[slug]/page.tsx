import { redirect } from "next/navigation";

/**
 * /{slug} — Redirecciona al menú del restaurante
 * El cliente que escanea el QR llega aquí y va directo al menú.
 */
export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/menu`);
}
