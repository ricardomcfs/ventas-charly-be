import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import categoriasRoutes from './routes/categorias.routes';
import imagenesRoutes from './routes/imagenes.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categorias", categoriasRoutes);
app.use("/api/imagenes", imagenesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
