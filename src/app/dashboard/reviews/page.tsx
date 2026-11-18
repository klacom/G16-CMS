import { ReviewDesk } from "@/components/review-desk";
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <ReviewDesk query={await searchParams} />;
}
