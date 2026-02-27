/**
 * 住所バリデーションツール
 */

import { postalDataLoader, PostalRecord } from "../data/loader.js";
import { normalizeAddress } from "./normalize.js";

export interface ValidationResult {
  valid: boolean;
  confidence: "high" | "medium" | "low" | "none";
  originalAddress: string;
  normalizedAddress: string;
  matchedRecords: Array<{
    postalCode: string;
    prefecture: string;
    city: string;
    town: string;
    fullAddress: string;
  }>;
  suggestions: Array<{
    postalCode: string;
    prefecture: string;
    city: string;
    town: string;
    fullAddress: string;
  }>;
  issues: string[];
}

/**
 * 住所を検証
 */
export async function validateAddress(address: string): Promise<ValidationResult> {
  // データロード確認
  if (!postalDataLoader.isLoaded()) {
    await postalDataLoader.load();
  }

  const issues: string[] = [];

  // 空チェック
  if (!address || address.trim().length === 0) {
    return {
      valid: false,
      confidence: "none",
      originalAddress: address,
      normalizedAddress: "",
      matchedRecords: [],
      suggestions: [],
      issues: ["住所が入力されていません"],
    };
  }

  // 正規化
  const { normalized, changes } = normalizeAddress(address);
  
  if (changes.length > 0) {
    issues.push(`表記ゆれを検出: ${changes.join(", ")}`);
  }

  // 都道府県チェック
  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
  ];

  const hasPrefecture = prefectures.some((p) => normalized.includes(p));
  if (!hasPrefecture) {
    issues.push("都道府県名が含まれていません");
  }

  // 郵便番号データベースで検索
  const validation = postalDataLoader.validateAddress(normalized);

  const formatRecord = (r: PostalRecord) => ({
    postalCode: `${r.postalCode.slice(0, 3)}-${r.postalCode.slice(3)}`,
    prefecture: r.prefecture,
    city: r.city,
    town: r.town,
    fullAddress: `${r.prefecture}${r.city}${r.town}`,
  });

  // 信頼度を判定
  let confidence: "high" | "medium" | "low" | "none";
  if (validation.valid && validation.matches.length > 0) {
    // 完全一致がある場合
    confidence = validation.matches.length === 1 ? "high" : "medium";
  } else if (validation.suggestions.length > 0) {
    // 部分一致のみ
    confidence = "low";
    issues.push("完全一致する住所が見つかりませんでした");
  } else {
    confidence = "none";
    issues.push("住所データベースに一致する住所が見つかりません");
  }

  return {
    valid: validation.valid,
    confidence,
    originalAddress: address,
    normalizedAddress: normalized,
    matchedRecords: validation.matches.slice(0, 10).map(formatRecord),
    suggestions: validation.suggestions.slice(0, 5).map(formatRecord),
    issues,
  };
}
