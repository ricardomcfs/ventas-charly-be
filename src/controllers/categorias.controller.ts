import { Request, Response } from 'express';

import { pool } from '../db';

export const getCategorias = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM categorias ORDER BY id");
    res.json({ ok: true, categorias: rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
