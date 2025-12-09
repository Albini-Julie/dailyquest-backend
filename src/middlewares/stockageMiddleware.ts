import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '..', 'uploads');

// Crée le dossier uploads s’il n’existe pas
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  }),
});