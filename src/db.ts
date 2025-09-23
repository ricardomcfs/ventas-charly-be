import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  port: Number(process.env.MYSQL_PORT) || 14852,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: true // habilita SSL, usa true para verificar el certificado
  }
});
