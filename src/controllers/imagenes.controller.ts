import { Request, Response } from 'express';

import { pool } from '../db';
import { uploadBuffer } from '../utils/cloudinaryUpload';

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
      `SELECT id, url, precio, codigo, nombre_original, created_at FROM imagenes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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

export const uploadImagenes = async (req: Request, res: Response) => {
  try {
    const { categoria_id, prefijo, precios } = req.body;
    const archivos = req.files as Express.Multer.File[];
    const preciosArray = precios ? JSON.parse(precios) : [];

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const results: any[] = [];

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      const precio = preciosArray[i] !== undefined ? parseFloat(preciosArray[i]) : 0;

      const uploadRes = await uploadBuffer(file.buffer, "catalogo");
      const url = uploadRes.secure_url;

      const [insertRes]: any = await conn.query(
        "INSERT INTO imagenes (categoria_id, url, precio, prefijo, nombre_original) VALUES (?, ?, ?, ?, ?)",
        [categoria_id, url, precio, prefijo || null, file.originalname]
      );

      const newId = insertRes.insertId;
      const codigo = (prefijo || "") + "-" + newId;

      await conn.query("UPDATE imagenes SET codigo = ? WHERE id = ?", [codigo, newId]);
      results.push({ id: newId, url, precio, codigo });
    }

    await conn.commit();
    conn.release();

    res.json({ ok: true, created: results });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
