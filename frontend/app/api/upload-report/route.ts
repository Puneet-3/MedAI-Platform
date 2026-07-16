import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const reportType = formData.get("reportType") as string || "Chest X-Ray";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize file extension and generate filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;

    let fileUrl = "";
    
    // Check if Supabase storage credentials are configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      // 1. Upload to Supabase Storage Bucket 'medical-reports'
      const uploadUrl = `${supabaseUrl}/storage/v1/object/medical-reports/${fileName}`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": file.type,
          "x-upsert": "true"
        },
        body: buffer
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Supabase upload failed: ${errorText}`);
      }

      // 2. Generate signed URL (expires in 1 hour)
      const signUrl = `${supabaseUrl}/storage/v1/object/sign/medical-reports/${fileName}`;
      const signRes = await fetch(signUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ expiresIn: 3600 })
      });

      if (!signRes.ok) {
        throw new Error("Failed to generate signed URL");
      }

      const signData = await signRes.json();
      fileUrl = `${supabaseUrl}/storage/v1${signData.signedURL}`;
    } else {
      // Fallback: Local file system upload for offline / dev testing
      const uploadDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = join(uploadDir, fileName);
      writeFileSync(filePath, buffer);
      
      // Determine the public URL path
      // In local dev, if Next.js runs on http://localhost:3000, we can use the absolute local url or relative path
      // Since FastAPI runs on localhost:8080, we should construct an absolute url for the FastAPI endpoint if it requests it.
      // But wait! In FastAPI /analyze endpoint, we made it check if it starts with '/uploads/' and read directly from public/uploads folder!
      // This means we can just pass '/uploads/fileName' and the Python backend will read it locally on disk! Extremely fast and robust!
      fileUrl = `/uploads/${fileName}`;
    }

    // Create report record in DB (status defaults to PENDING)
    let report = await db.report.create({
      data: {
        userId: session.user.id,
        fileUrl,
        reportType,
        status: "PENDING"
      }
    });

    // If it is a Chest X-Ray, trigger PyTorch CNN analysis on FastAPI
    if (reportType === "Chest X-Ray") {
      try {
        const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8080";
        const secret = process.env.FASTAPI_SECRET || "";

        // If local dev upload, we can pass absolute address or local path
        // Since we handled "/uploads/" prefix in main.py, we can send the local relative path directly!
        const analyzeRes = await fetch(`${fastapiUrl}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-fastapi-secret": secret
          },
          body: JSON.stringify({ image_url: fileUrl })
        });

        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          // Update DB record with analysis predictions
          report = await db.report.update({
            where: { id: report.id },
            data: {
              status: "ANALYZED",
              cnnLabel: analyzeData.label,
              cnnConfidence: analyzeData.confidence
            }
          });
        } else {
          const errText = await analyzeRes.text();
          console.error("FastAPI analyze failed:", errText);
        }
      } catch (err) {
        console.error("Failed to connect to FastAPI analyze endpoint:", err);
      }
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      fileUrl,
      status: report.status,
      cnnLabel: report.cnnLabel,
      cnnConfidence: report.cnnConfidence
    });
  } catch (error: any) {
    console.error("Upload report error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
