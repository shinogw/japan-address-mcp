/**
 * 郵便番号関連ツール
 */

import { postalDataLoader, PostalRecord } from "../data/loader.js";

/**
 * 郵便番号から住所を取得
 */
export async function postalToAddress(postalCode: string): Promise<{
  success: boolean;
  postalCode: string;
  addresses: Array<{
    prefecture: string;
    city: string;
    town: string;
    prefectureKana: string;
    cityKana: string;
    townKana: string;
    fullAddress: string;
  }>;
  error?: string;
}> {
  // データロード確認
  if (!postalDataLoader.isLoaded()) {
    await postalDataLoader.load();
  }

  // 郵便番号を正規化
  const normalized = postalCode.replace(/-/g, "").replace(/\s/g, "");

  if (!/^\d{7}$/.test(normalized)) {
    return {
      success: false,
      postalCode: postalCode,
      addresses: [],
      error: "無効な郵便番号形式です。7桁の数字を入力してください。",
    };
  }

  const records = postalDataLoader.findByPostalCode(normalized);

  if (records.length === 0) {
    return {
      success: false,
      postalCode: postalCode,
      addresses: [],
      error: `郵便番号 ${postalCode} に対応する住所が見つかりません。`,
    };
  }

  return {
    success: true,
    postalCode: `${normalized.slice(0, 3)}-${normalized.slice(3)}`,
    addresses: records.map((r) => ({
      prefecture: r.prefecture,
      city: r.city,
      town: r.town,
      prefectureKana: r.prefectureKana,
      cityKana: r.cityKana,
      townKana: r.townKana,
      fullAddress: `${r.prefecture}${r.city}${r.town}`,
    })),
  };
}

/**
 * 住所から郵便番号を検索
 */
export async function addressToPostal(address: string): Promise<{
  success: boolean;
  query: string;
  results: Array<{
    postalCode: string;
    prefecture: string;
    city: string;
    town: string;
    fullAddress: string;
  }>;
  error?: string;
}> {
  // データロード確認
  if (!postalDataLoader.isLoaded()) {
    await postalDataLoader.load();
  }

  if (!address || address.trim().length < 2) {
    return {
      success: false,
      query: address,
      results: [],
      error: "住所は2文字以上入力してください。",
    };
  }

  const records = postalDataLoader.findByAddress(address.trim());

  if (records.length === 0) {
    return {
      success: false,
      query: address,
      results: [],
      error: `「${address}」に一致する住所が見つかりません。`,
    };
  }

  return {
    success: true,
    query: address,
    results: records.slice(0, 20).map((r) => ({
      postalCode: `${r.postalCode.slice(0, 3)}-${r.postalCode.slice(3)}`,
      prefecture: r.prefecture,
      city: r.city,
      town: r.town,
      fullAddress: `${r.prefecture}${r.city}${r.town}`,
    })),
  };
}
