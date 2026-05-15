const fs = require("fs");
const path = require("path");
const multer = require("multer");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let cloudinary;
let CloudinaryStorage;
let useCloudinary = false;

if (cloudName && apiKey && apiSecret) {
  cloudinary = require("cloudinary").v2;
  ({ CloudinaryStorage } = require("multer-storage-cloudinary"));
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  useCloudinary = true;
}

const makeUploader = (folder, allowedFormats = []) => {
  if (useCloudinary) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: allowedFormats,
        resource_type: "auto",
      },
    });
    return multer({ storage });
  }

  const uploadPath = path.join(__dirname, "../../uploads", folder);
  fs.mkdirSync(uploadPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, filename);
    },
  });

  return multer({ storage });
};

module.exports = { makeUploader };
