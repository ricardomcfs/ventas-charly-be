import { Router } from 'express';
import multer from 'multer';

import { getImagenes, uploadImagenes } from '../controllers/imagenes.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getImagenes);
router.post("/admin/imagenes", uploadImagenes);

export default router;
