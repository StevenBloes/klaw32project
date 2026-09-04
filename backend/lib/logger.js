/**************************************************************************
  A self-maintaining, JSON structured, daily-rotating logging system
  with automatic cleanup and pretty printing.
**************************************************************************/

import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { formatInTimeZone } from 'date-fns-tz';


const CLEANUP_RETENTION_DAYS = 14;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logDir = join(__dirname, '../logs');

let lastCleanupDate = null;

// clean up old log files, only runs once every day
function cleanupOldLogs(){
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  if (lastCleanupDate === key){
    return
  } else {
    lastCleanupDate = key;

    const now = Date.now();
    const cutoff = CLEANUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    fs.readdir(logDir, (err, files) => {
      if (err){
        console.error('Log cleanup error:', err);
      } else {
        files.forEach( file => {
          const filePath = join(logDir, file);
          fs.stat(filePath, (err, stats) => {
            if(err){
              console.error('Log cleanup error:', err);
            } else {
              const age = now - stats.mtimeMs;
              if(age > cutoff){
                fs.unlink(filePath, () => {})
              }
            }
          });
        });
      }
    })
  }
}


// returns the file for the current day
function getDatedFileName(baseName){
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}_${baseName}`;
}

// check if file exists
function checkFile(file){
  if(!fs.existsSync(file)) {
    fs.writeFileSync(file, '');
  }
}

// function
export function writeLog(data, baseName = 'app') {
  cleanupOldLogs();

  const logFile = join(logDir, getDatedFileName(baseName));
  checkFile(logFile);

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    data = { raw_message: data };
  }

  const entry = {
    timestamp: formatInTimeZone(new Date(), "Europe/Brussels", "yyyy-MM-dd HH:mm:ss"),
    ...data
  }

  // insert a return after every item
  const json = JSON.stringify(entry, null, 2) + '\n'

  fs.appendFile(logFile, json, err => {
    if (err){
      console.error('Failed to write log: ', err);
    }
  });
}
