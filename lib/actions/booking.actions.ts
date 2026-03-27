"use server";

import Booking from "@/database/booking.model";
import Event from "@/database/event.model";

import connectDB from "@/lib/mongodb";

export const createBooking = async ({
  eventId,
  slug,
  email,
}: {
  eventId: string;
  slug: string;
  email: string;
}) => {
  try {
    await connectDB();

    const event = await Event.findById(eventId).select("_id slug").lean();
    if (!event || event.slug !== slug) {
      return { success: false };
    }

    await Booking.create({ eventId: event._id, slug: event.slug, email });

    return { success: true };
  } catch (e) {
    const err = e as { name?: string; code?: number };
    console.error("create booking failed", { name: err.name, code: err.code });
    return { success: false };
  }
};
