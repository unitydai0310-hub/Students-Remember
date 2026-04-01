import { Router } from "express";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const router = Router();

/**
 * POST /api/upload
 * Upload a student photo to S3
 * Body: { file: base64string, fileName: string }
 * Response: { photoUrl: string, photoKey: string }
 */
router.post("/upload", async (req, res) => {
  try {
    const { file, fileName } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: "Missing file or fileName" });
    }

    // Decode base64
    const buffer = Buffer.from(file.split(",")[1] || file, "base64");

    // Generate unique file key
    const fileKey = `students/${nanoid()}/${fileName}`;

    // Upload to S3
    const { url } = await storagePut(fileKey, buffer, "image/jpeg");

    res.json({
      photoUrl: url,
      photoKey: fileKey,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
