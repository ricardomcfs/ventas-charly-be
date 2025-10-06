import { Request, Response } from 'express';
import multer from 'multer';

import { pool } from '../db';
import { uploadBuffer } from '../utils/cloudinaryUpload';

const upload = multer(); // multer sin storage, solo para parsear multipart/form-data

export const getImagenes = async (req: Request, res: Response) => {
  try {
    const categoria = req.query.categoria ? Number(req.query.categoria) : null;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 24));
    const offset = (page - 1) * limit;

    let where = "";
    const params: any[] = [];
    if (categoria) {
      where = "WHERE categoria_id = ?";
      params.push(categoria);
    }

    const [data] = await pool.query(
      `SELECT id, nombre_archivo, precioPublico, precioMayoreo, codigo FROM imagenes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM imagenes ${where}`,
      params
    );

    const total = (countRows as any)[0].total;
    res.json({ ok: true, data, page, limit, total });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const uploadImagenes = [
  // 👇 ahora multer espera el campo "imagenes"
  upload.array('imagenes', 20), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ ok: false, message: 'No se enviaron imágenes' });
      }

      // 🔑 Recibimos datos extra
      const categoria_id = Array.isArray(req.body.categoria_id) ? req.body.categoria_id[0] : req.body.categoria_id;
      const tienda = Array.isArray(req.body.tienda) ? req.body.tienda[0] : req.body.tienda || null;
      const codigo = Array.isArray(req.body.codigo) ? req.body.codigo[0] : req.body.codigo || null;
      const precioPublico = Array.isArray(req.body.precioPublico) ? req.body.precioPublico[0] : req.body.precioPublico || null;
      const precioMayoreo = Array.isArray(req.body.precioMayoreo) ? req.body.precioMayoreo[0] : req.body.precioMayoreo || null;


      const resultados: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Determinar carpeta según categoría
        let folderName = 'catalogo/otros';
        switch (Number(categoria_id)) {
          case 1:
            folderName = 'catalogo/bolsas-y-mochilas';
            break;
          case 2:
            folderName = 'catalogo/zapatos';
            break;
          case 3:
            folderName = 'catalogo/mascotas';
            break;
        }

        // Subida a Cloudinary usando buffer
        const result = await uploadBuffer(file.buffer, folderName);

        // Guardar en la base de datos
        await pool.query(
          `INSERT INTO imagenes 
            (nombre_tienda, nombre_archivo, precioPublico, precioMayoreo, codigo, activo, categoria_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            tienda,
            result.secure_url,
            precioPublico,
            precioMayoreo,
            `${codigo}-${i+101}`,
            true, // activo por default
            categoria_id
          ]
        );

        resultados.push({
          tienda: tienda,
          url: result.secure_url,
          public_id: result.public_id,
          categoria_id,
          codigo: codigo,
          precioPublico: precioPublico,
          precioMayoreo: precioMayoreo
        });
      }

      return res.json({
        ok: true,
        message: 'Imágenes subidas a Cloudinary correctamente',
        data: resultados
      });

    } catch (error) {
      console.error('Error en uploadImagenes:', error);
      return res.status(500).json({
        ok: false,
        message: 'Error al subir imágenes a Cloudinary',
        error: (error as Error).message
      });
    }
  }
];
