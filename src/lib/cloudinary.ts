import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function uploadGymLogo(
  buffer: Buffer,
  gymSlug: string
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "box-turno/logos",
        public_id: `gym-${gymSlug}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Error al subir logo a Cloudinary"));
        } else {
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function uploadAnnouncementImage(
  buffer: Buffer,
  gymId: string,
  announcementId: string
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `box-turno/announcements/${gymId}`,
        public_id: announcementId,
        overwrite: true,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 630, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Error al subir imagen de noticia a Cloudinary"));
        } else {
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}
