import { CampusCalendar } from "@/components/campus-calendar";
export const metadata = {
  alternates: { canonical: "/calendar" },
  title: "Campus calendar · ICG",
};
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Find your day</p>
          <h1>Campus calendar</h1>
          <p>What’s happening at PLP — and what happened before.</p>
        </div>
      </header>
      <CampusCalendar query={await searchParams} />
    </>
  );
}
