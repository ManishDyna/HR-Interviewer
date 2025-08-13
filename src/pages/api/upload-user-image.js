import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), "public/user-images"),
      keepExtensions: true,
    });

    // Create upload directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "public/user-images");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        res.status(500).json({ error: "Image upload failed" });
        return;
      }

      // In formidable v3+, files.userImage is an array
      const file = Array.isArray(files.userImage)
        ? files.userImage[0]
        : files.userImage;

      if (!file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      try {
        const fileName = `${Date.now()}_${file.originalFilename}`;
        const outputPath = path.join(outputDir, fileName);

        // Use the temporary path that formidable created
        fs.renameSync(file.filepath, outputPath);

        const imageUrl = `/user-images/${fileName}`;
        res.status(200).json({ imageUrl });
      } catch (error) {
        console.error("File processing error:", error);
        res.status(500).json({ error: "Failed to process uploaded file" });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
}