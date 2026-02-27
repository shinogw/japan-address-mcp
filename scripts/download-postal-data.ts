#!/usr/bin/env npx ts-node

/**
 * 日本郵便の郵便番号データをダウンロードし、JSONに変換するスクリプト
 * 
 * データソース: https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html
 * ファイル: ken_all.zip (全国一括データ)
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { createUnzip } from "zlib";
import { pipeline } from "stream/promises";
import { createWriteStream, createReadStream } from "fs";

// 日本郵便の郵便番号データURL
const POSTAL_DATA_URL = "https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";

// 出力ディレクトリ
const DATA_DIR = path.join(process.cwd(), "data");
const ZIP_FILE = path.join(DATA_DIR, "ken_all.zip");
const CSV_FILE = path.join(DATA_DIR, "ken_all.csv");
const JSON_FILE = path.join(DATA_DIR, "ken_all.json");

// 郵便番号データの型定義
interface PostalRecord {
  jisCode: string;        // 全国地方公共団体コード
  oldPostalCode: string;  // 旧郵便番号(5桁)
  postalCode: string;     // 郵便番号(7桁)
  prefectureKana: string; // 都道府県名カナ
  cityKana: string;       // 市区町村名カナ
  townKana: string;       // 町域名カナ
  prefecture: string;     // 都道府県名
  city: string;           // 市区町村名
  town: string;           // 町域名
  hasMultipleZip: boolean;    // 一町域に複数の郵便番号
  hasKoazaBanchi: boolean;    // 小字毎に番地が起番
  hasChome: boolean;          // 丁目を有する町域
  hasMultipleTown: boolean;   // 一つの郵便番号に複数町域
  updateCode: number;         // 更新の表示 (0:変更なし, 1:変更, 2:廃止)
  updateReason: number;       // 変更理由
}

/**
 * ファイルをダウンロード
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  console.log(`Downloading ${url}...`);
  
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // リダイレクト処理
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Downloaded to ${destPath}`);
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {}); // 失敗したらファイル削除
      reject(err);
    });
  });
}

/**
 * ZIPファイルを解凍
 */
async function unzipFile(zipPath: string, destDir: string): Promise<string> {
  console.log(`Extracting ${zipPath}...`);
  
  // Node.js標準のzlibはZIPアーカイブを直接扱えないので、
  // 簡易的にunzipコマンドを使用
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  
  await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`);
  
  // 解凍されたCSVファイルを探す
  const files = fs.readdirSync(destDir);
  const csvFile = files.find(f => f.toLowerCase().endsWith(".csv"));
  
  if (!csvFile) {
    throw new Error("CSV file not found in ZIP");
  }
  
  const csvPath = path.join(destDir, csvFile);
  console.log(`Extracted to ${csvPath}`);
  return csvPath;
}

/**
 * Shift-JISからUTF-8に変換してCSVをパース
 */
async function parseCSV(csvPath: string): Promise<PostalRecord[]> {
  console.log(`Parsing ${csvPath}...`);
  
  // iconv-liteを使わずにnativeのTextDecoderを使用
  // Node.jsはShift_JISをサポートしていないので、nkfコマンドを使用
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  
  // iconvでShift-JIS(CP932)からUTF-8に変換
  const utf8CsvPath = csvPath.replace(".CSV", "_utf8.csv").replace(".csv", "_utf8.csv");
  await execAsync(`iconv -f CP932 -t UTF-8 "${csvPath}" > "${utf8CsvPath}"`);
  
  const content = fs.readFileSync(utf8CsvPath, "utf-8");
  const lines = content.split("\n").filter(line => line.trim());
  
  const records: PostalRecord[] = [];
  
  for (const line of lines) {
    // CSVパース（簡易実装、ダブルクォート考慮）
    const fields = parseCSVLine(line);
    
    if (fields.length < 15) continue;
    
    records.push({
      jisCode: fields[0],
      oldPostalCode: fields[1],
      postalCode: fields[2],
      prefectureKana: fields[3],
      cityKana: fields[4],
      townKana: fields[5],
      prefecture: fields[6],
      city: fields[7],
      town: fields[8],
      hasMultipleZip: fields[9] === "1",
      hasKoazaBanchi: fields[10] === "1",
      hasChome: fields[11] === "1",
      hasMultipleTown: fields[12] === "1",
      updateCode: parseInt(fields[13], 10),
      updateReason: parseInt(fields[14], 10),
    });
  }
  
  // 一時ファイル削除
  fs.unlinkSync(utf8CsvPath);
  
  console.log(`Parsed ${records.length} records`);
  return records;
}

/**
 * CSV行をパース（ダブルクォート対応）
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  return fields;
}

/**
 * JSONファイルに保存
 */
function saveJSON(records: PostalRecord[], jsonPath: string): void {
  console.log(`Saving to ${jsonPath}...`);
  
  // 郵便番号でインデックス化したオブジェクトも作成
  const byPostalCode: Record<string, PostalRecord[]> = {};
  
  for (const record of records) {
    if (!byPostalCode[record.postalCode]) {
      byPostalCode[record.postalCode] = [];
    }
    byPostalCode[record.postalCode].push(record);
  }
  
  const output = {
    version: new Date().toISOString(),
    totalRecords: records.length,
    uniquePostalCodes: Object.keys(byPostalCode).length,
    records: records,
    byPostalCode: byPostalCode,
  };
  
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${records.length} records to ${jsonPath}`);
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log("=== 郵便番号データダウンロード ===\n");
  
  // データディレクトリ作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  try {
    // 1. ZIPファイルをダウンロード
    await downloadFile(POSTAL_DATA_URL, ZIP_FILE);
    
    // 2. 解凍
    const csvPath = await unzipFile(ZIP_FILE, DATA_DIR);
    
    // 3. CSVをパース
    const records = await parseCSV(csvPath);
    
    // 4. JSONに保存
    saveJSON(records, JSON_FILE);
    
    console.log("\n=== 完了 ===");
    console.log(`出力ファイル: ${JSON_FILE}`);
    
  } catch (error) {
    console.error("エラー:", error);
    process.exit(1);
  }
}

main();
