import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("userImage") as File;

    console.log('Upload API called, file received:', file ? `${file.name} (${file.size} bytes)` : 'null');

    if (!file) {
      console.error('No file provided in formData');
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "public/user-images");
    console.log('Output directory:', outputDir);
    
    try {
      await mkdir(outputDir, { recursive: true });
      console.log('Directory created/verified:', outputDir);
    } catch (error) {
      console.error('Error creating directory:', error);
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const outputPath = path.join(outputDir, fileName);
    console.log('Saving file to:', outputPath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(outputPath, buffer);
    console.log('File saved successfully:', outputPath);

    const imageUrl = `/user-images/${fileName}`;
    console.log('Returning image URL:', imageUrl);
    
    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}

