import * as mariadb from 'mariadb';
import { writeLog } from '../lib/logger.js'


/******************************************************************
  Function to execute a query in the database
******************************************************************/

const pool = mariadb.createPool({
  host: '192.168.28.132',
  user: 'admin',
  password: 'admin',
  database: 'kla_w32_processes',
  connectionLimit: 8
});

export async function runQuery(sql, params = []) {
  let conn;
  const start = Date.now();

  try {
    conn = await pool.getConnection();

    const result = await conn.query(sql, params);
    const duration = Date.now() - start;
    const isSelect = Array.isArray(result);

    const response = {
      rows: isSelect ? result : [],
      affectedRows: !isSelect ? result.affectedRows : 0,
      durationMs: duration,
      insertId: Number(result.insertId) || null
    };

    if(sql.startsWith("UPDATE")){
      writeLog({
        "type": "query",
        "sql": sql.replace(/\s+/g, ' ').trim(),
        "params": params,
        "durationMs": duration
      }, 'db_queries');
    } else if (duration > 200){
      writeLog({
        "type": "query",
        "sql": sql.replace(/\s+/g, ' ').trim(),
        "params": params,
        "durationMs": duration
      }, 'db_queries');
    }

    return response;
  } catch (err) {
    writeLog(
      {
        "type": "error",
        sql,
        params,
        "message": err.message,
        "stack": err.stack
      }, 'db_errors'
    );
    console.error('DB Error: ', err.message);
    throw new Error(`DB Error: ${err.message}`);
  } finally {
    if (conn && typeof conn.release === 'function') {
      try {
        conn.release();
      } catch (err){
        writeLog(
          {
            "type": 'error',
            sql,
            params,
            "message": err.message,
            "stack": err.stack
          }, 'db_errors'
        );
        console.error('DB Error: ', err.message);
        throw new Error(`DB Error: ${err.message}`);
      }
    }
  }
}
