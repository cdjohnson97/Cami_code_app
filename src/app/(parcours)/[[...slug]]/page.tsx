import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allRouteSegments, routeFromSegments, titleFor } from "@/lib/routes";

// Renders nothing itself (the app is in ../layout.tsx): this page only decides which URLs exist
// and gives each one its <title>. Every valid URL is pre-rendered at build time; any other path
// is a 404 instead of silently showing the home page.

type Props = { params: Promise<{ slug?: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return allRouteSegments().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const route = routeFromSegments(slug);
  return route ? { title: titleFor(route) } : {};
}

export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  if (!routeFromSegments(slug)) notFound();
  return null;
}
