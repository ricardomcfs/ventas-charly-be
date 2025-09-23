import { Router } from 'express';

import { getCategorias } from '../controllers/categorias.controller';

const router = Router();

router.get("/", getCategorias);

export default router;
