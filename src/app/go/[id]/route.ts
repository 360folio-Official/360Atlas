import { NextResponse } from "next/server";
import { getListingById } from "@/lib/data";

// Every tour open goes through here so it can be counted for the member's
// analytics. Logging to click_events is added with the database connection.
export async function GET(_request: Request, { params }: RouteContext<"/go/[id]">) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(listing.tourUrl, 302);
}
