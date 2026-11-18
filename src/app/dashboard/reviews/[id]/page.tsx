import { ReviewDesk } from "@/components/review-desk";
import { notFound } from "next/navigation";
import { z } from "zod";
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <ReviewDesk id={id} query={await searchParams} />;
}
