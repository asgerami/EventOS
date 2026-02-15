import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function TicketPage({ params }: PageProps) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  const registration = await prisma.registration.findFirst({
    where: { confirmationToken: token.trim() },
    select: {
      firstName: true,
      lastName: true,
      status: true,
      event: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      },
      ticketType: { select: { name: true } },
    },
  });

  if (!registration) notFound();

  const location = registration.event.location as { venue?: string; city?: string; country?: string } | null;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{registration.event.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {registration.ticketType.name} · {registration.status}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-2xl font-semibold">
                {registration.firstName} {registration.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(registration.event.startDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {location?.venue && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {location.venue}
                  {location.city && ` · ${location.city}`}
                </p>
              )}
            </div>

            <div className="flex justify-center rounded-lg border bg-white p-4">
              <img
                src={`/api/ticket/${encodeURIComponent(token)}/qr`}
                alt="Ticket QR code"
                width={280}
                height={280}
                className="h-[280px] w-[280px]"
              />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Show this QR code at check-in
            </p>

            <div className="pt-2">
              <a
                href={`/api/ticket/${encodeURIComponent(token)}/badge`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-md border bg-muted/50 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
              >
                Download badge (PDF)
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground underline">
            EventOS
          </Link>
        </p>
      </div>
    </div>
  );
}
