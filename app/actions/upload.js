'use server'

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "@/lib/s3-client";

export async function uploadToS3(formData) {
  try {
    const file = formData.get('file');
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `products/${fileName}`,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct the public URL (assuming public read access or CloudFront)
    const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "ap-south-1";
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/products/${fileName}`;

    return { success: true, url };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return { success: false, error: error.message };
  }
}
