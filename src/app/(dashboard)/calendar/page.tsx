import { serverTRPC } from "@/lib/trpc/server";
import { EventCalendar } from "@/components/dashboard/event-calendar";

export default async function CalendarPage() {
  const trpc = await serverTRPC();
  const venues = await trpc.venue.list();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <EventCalendar
        venues={venues.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}
