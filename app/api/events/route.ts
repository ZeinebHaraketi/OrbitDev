import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    let event;

    try {
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 },
      );
    }

    const file = formData.get("image") as File;

    if (!file)
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );

    let tags = JSON.parse(formData.get("tags") as string);
    let agenda = JSON.parse(formData.get("agenda") as string);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "OrbitDev" },
          (error, results) => {
            if (error) return reject(error);

            resolve(results as { secure_url: string; public_id: string });
          },
        )
        .end(buffer);
    });

    event.image = uploadResult.secure_url;

    // const createdEvent = await Event.create({
    //   ...event,
    //   tags: tags,
    //   agenda: agenda,
    // });

    let createdEvent;
    try {
      createdEvent = await Event.create({
        ...event,
        tags,
        agenda,
      });
    } catch (error) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
      throw error;
    }

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error("event creation failed", e);
    return NextResponse.json(
      { message: "Event creation failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 },
    );
  } catch (e) {
    console.error("event fetching failed", e);
    return NextResponse.json(
      { message: "Event fetching failed" },
      { status: 500 },
    );
  }
}
