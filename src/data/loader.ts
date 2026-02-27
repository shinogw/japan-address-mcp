/**
 * 郵便番号データローダー
 * JSONデータを効率的にメモリにロードし、高速検索を可能にする
 */

import * as fs from "fs";
import * as path from "path";

export interface PostalRecord {
  jisCode: string;
  oldPostalCode: string;
  postalCode: string;
  prefectureKana: string;
  cityKana: string;
  townKana: string;
  prefecture: string;
  city: string;
  town: string;
  hasMultipleZip: boolean;
  hasKoazaBanchi: boolean;
  hasChome: boolean;
  hasMultipleTown: boolean;
  updateCode: number;
  updateReason: number;
}

export interface PostalData {
  version: string;
  totalRecords: number;
  uniquePostalCodes: number;
  records: PostalRecord[];
  byPostalCode: Record<string, PostalRecord[]>;
}

export class PostalDataLoader {
  private data: PostalData | null = null;
  private postalCodeMap: Map<string, PostalRecord[]> = new Map();
  private addressIndex: Map<string, PostalRecord[]> = new Map();
  private loaded: boolean = false;

  /**
   * データファイルのパスを取得
   */
  private getDataPath(): string {
    // 開発時: プロジェクトルートのdata/
    // 本番時: パッケージ内のdata/
    const possiblePaths = [
      path.join(process.cwd(), "data", "ken_all.json"),
      path.join(__dirname, "..", "..", "data", "ken_all.json"),
      path.join(__dirname, "..", "..", "..", "data", "ken_all.json"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    throw new Error(
      "郵便番号データが見つかりません。scripts/download-postal-data.ts を実行してください。"
    );
  }

  /**
   * データをロード
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    const dataPath = this.getDataPath();
    console.error(`Loading postal data from ${dataPath}...`);

    const startTime = Date.now();
    const content = fs.readFileSync(dataPath, "utf-8");
    this.data = JSON.parse(content) as PostalData;

    // 郵便番号でインデックス作成
    for (const [postalCode, records] of Object.entries(this.data.byPostalCode)) {
      // ハイフンなしの7桁で正規化
      const normalized = postalCode.replace(/-/g, "");
      this.postalCodeMap.set(normalized, records);
    }

    // 住所でインデックス作成（都道府県+市区町村+町域）
    for (const record of this.data.records) {
      const addressKey = `${record.prefecture}${record.city}${record.town}`;
      if (!this.addressIndex.has(addressKey)) {
        this.addressIndex.set(addressKey, []);
      }
      this.addressIndex.get(addressKey)!.push(record);
    }

    this.loaded = true;
    const elapsed = Date.now() - startTime;
    console.error(
      `Loaded ${this.data.totalRecords} records in ${elapsed}ms`
    );
  }

  /**
   * 郵便番号から住所を検索
   */
  findByPostalCode(postalCode: string): PostalRecord[] {
    if (!this.loaded) {
      throw new Error("データがロードされていません。load()を先に呼び出してください。");
    }

    // ハイフンを除去して7桁に正規化
    const normalized = postalCode.replace(/-/g, "").replace(/\s/g, "");

    if (!/^\d{7}$/.test(normalized)) {
      return [];
    }

    return this.postalCodeMap.get(normalized) || [];
  }

  /**
   * 住所から郵便番号を検索
   */
  findByAddress(address: string): PostalRecord[] {
    if (!this.loaded) {
      throw new Error("データがロードされていません。load()を先に呼び出してください。");
    }

    const results: PostalRecord[] = [];

    // 完全一致検索
    if (this.addressIndex.has(address)) {
      return this.addressIndex.get(address)!;
    }

    // 部分一致検索
    for (const [key, records] of this.addressIndex) {
      if (key.includes(address) || address.includes(key)) {
        results.push(...records);
      }
    }

    // 重複を除去
    const seen = new Set<string>();
    return results.filter((r) => {
      const key = `${r.postalCode}-${r.prefecture}-${r.city}-${r.town}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 住所が存在するか確認
   */
  validateAddress(address: string): {
    valid: boolean;
    matches: PostalRecord[];
    suggestions: PostalRecord[];
  } {
    if (!this.loaded) {
      throw new Error("データがロードされていません。load()を先に呼び出してください。");
    }

    const matches = this.findByAddress(address);

    if (matches.length > 0) {
      return { valid: true, matches, suggestions: [] };
    }

    // 部分一致で候補を探す
    const suggestions: PostalRecord[] = [];
    const addressParts = address.split(/[都道府県市区町村]/);

    for (const [key, records] of this.addressIndex) {
      for (const part of addressParts) {
        if (part.length >= 2 && key.includes(part)) {
          suggestions.push(...records.slice(0, 3)); // 各キーから最大3件
          break;
        }
      }
      if (suggestions.length >= 10) break; // 最大10件
    }

    return { valid: false, matches: [], suggestions };
  }

  /**
   * ロード済みか確認
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 統計情報を取得
   */
  getStats(): { totalRecords: number; uniquePostalCodes: number; version: string } | null {
    if (!this.data) return null;
    return {
      totalRecords: this.data.totalRecords,
      uniquePostalCodes: this.data.uniquePostalCodes,
      version: this.data.version,
    };
  }
}

// シングルトンインスタンス
export const postalDataLoader = new PostalDataLoader();
