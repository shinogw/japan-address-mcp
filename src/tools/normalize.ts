/**
 * 住所正規化ツール
 */

// 全角→半角変換テーブル
const FULLWIDTH_TO_HALFWIDTH: Record<string, string> = {
  "０": "0", "１": "1", "２": "2", "３": "3", "４": "4",
  "５": "5", "６": "6", "７": "7", "８": "8", "９": "9",
  "Ａ": "A", "Ｂ": "B", "Ｃ": "C", "Ｄ": "D", "Ｅ": "E",
  "Ｆ": "F", "Ｇ": "G", "Ｈ": "H", "Ｉ": "I", "Ｊ": "J",
  "Ｋ": "K", "Ｌ": "L", "Ｍ": "M", "Ｎ": "N", "Ｏ": "O",
  "Ｐ": "P", "Ｑ": "Q", "Ｒ": "R", "Ｓ": "S", "Ｔ": "T",
  "Ｕ": "U", "Ｖ": "V", "Ｗ": "W", "Ｘ": "X", "Ｙ": "Y",
  "Ｚ": "Z",
  "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e",
  "ｆ": "f", "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j",
  "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n", "ｏ": "o",
  "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t",
  "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y",
  "ｚ": "z",
  "－": "-", "ー": "-", "―": "-", "‐": "-", "—": "-",
  "　": " ",
};

// 漢数字→算用数字変換テーブル
const KANJI_TO_ARABIC: Record<string, string> = {
  "一": "1", "二": "2", "三": "3", "四": "4", "五": "5",
  "六": "6", "七": "7", "八": "8", "九": "9", "十": "10",
  "〇": "0",
};

// 半角カナ→全角カナ変換テーブル
const HALFWIDTH_KANA_TO_FULLWIDTH: Record<string, string> = {
  "ｱ": "ア", "ｲ": "イ", "ｳ": "ウ", "ｴ": "エ", "ｵ": "オ",
  "ｶ": "カ", "ｷ": "キ", "ｸ": "ク", "ｹ": "ケ", "ｺ": "コ",
  "ｻ": "サ", "ｼ": "シ", "ｽ": "ス", "ｾ": "セ", "ｿ": "ソ",
  "ﾀ": "タ", "ﾁ": "チ", "ﾂ": "ツ", "ﾃ": "テ", "ﾄ": "ト",
  "ﾅ": "ナ", "ﾆ": "ニ", "ﾇ": "ヌ", "ﾈ": "ネ", "ﾉ": "ノ",
  "ﾊ": "ハ", "ﾋ": "ヒ", "ﾌ": "フ", "ﾍ": "ヘ", "ﾎ": "ホ",
  "ﾏ": "マ", "ﾐ": "ミ", "ﾑ": "ム", "ﾒ": "メ", "ﾓ": "モ",
  "ﾔ": "ヤ", "ﾕ": "ユ", "ﾖ": "ヨ",
  "ﾗ": "ラ", "ﾘ": "リ", "ﾙ": "ル", "ﾚ": "レ", "ﾛ": "ロ",
  "ﾜ": "ワ", "ｦ": "ヲ", "ﾝ": "ン",
  "ｧ": "ァ", "ｨ": "ィ", "ｩ": "ゥ", "ｪ": "ェ", "ｫ": "ォ",
  "ｬ": "ャ", "ｭ": "ュ", "ｮ": "ョ", "ｯ": "ッ",
  "ﾞ": "゛", "ﾟ": "゜", "ｰ": "ー",
};

export interface NormalizeOptions {
  convertFullwidthToHalfwidth?: boolean;  // 全角英数字→半角
  convertHalfwidthKanaToFullwidth?: boolean;  // 半角カナ→全角
  convertKanjiNumbers?: boolean;  // 漢数字→算用数字
  normalizeHyphens?: boolean;  // ハイフン統一
  normalizeSpaces?: boolean;  // スペース統一
  normalizeChome?: boolean;  // 丁目・番地・号の統一
}

const DEFAULT_OPTIONS: NormalizeOptions = {
  convertFullwidthToHalfwidth: true,
  convertHalfwidthKanaToFullwidth: true,
  convertKanjiNumbers: false,  // デフォルトでは変換しない（「一丁目」などは残す）
  normalizeHyphens: true,
  normalizeSpaces: true,
  normalizeChome: true,
};

/**
 * 住所を正規化
 */
export function normalizeAddress(
  address: string,
  options: NormalizeOptions = {}
): {
  original: string;
  normalized: string;
  changes: string[];
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const changes: string[] = [];
  let result = address;

  // 全角英数字→半角
  if (opts.convertFullwidthToHalfwidth) {
    const before = result;
    result = result.split("").map((c) => FULLWIDTH_TO_HALFWIDTH[c] || c).join("");
    if (before !== result) {
      changes.push("全角英数字を半角に変換");
    }
  }

  // 半角カナ→全角
  if (opts.convertHalfwidthKanaToFullwidth) {
    const before = result;
    result = result.split("").map((c) => HALFWIDTH_KANA_TO_FULLWIDTH[c] || c).join("");
    if (before !== result) {
      changes.push("半角カナを全角に変換");
    }
  }

  // ハイフン統一
  if (opts.normalizeHyphens) {
    const before = result;
    result = result.replace(/[－ー―‐—]/g, "-");
    if (before !== result) {
      changes.push("ハイフン/ダッシュを統一");
    }
  }

  // スペース統一
  if (opts.normalizeSpaces) {
    const before = result;
    result = result.replace(/　/g, " ").replace(/\s+/g, " ").trim();
    if (before !== result) {
      changes.push("スペースを統一");
    }
  }

  // 丁目・番地・号の統一
  if (opts.normalizeChome) {
    const before = result;
    
    // 「1丁目2番3号」→「1-2-3」のパターンを検出して変換
    result = result
      .replace(/(\d+)\s*丁目\s*(\d+)\s*番地?\s*(\d+)\s*号?/g, "$1-$2-$3")
      .replace(/(\d+)\s*丁目\s*(\d+)\s*番地?/g, "$1-$2")
      .replace(/(\d+)\s*丁目/g, "$1丁目")
      .replace(/(\d+)\s*番地?\s*(\d+)\s*号?/g, "$1-$2")
      .replace(/(\d+)\s*番地?/g, "$1番地");
    
    if (before !== result) {
      changes.push("丁目・番地・号の表記を統一");
    }
  }

  // 漢数字→算用数字（オプション）
  if (opts.convertKanjiNumbers) {
    const before = result;
    // 単純な置換（十の位以上の複雑な変換は行わない）
    result = result.split("").map((c) => KANJI_TO_ARABIC[c] || c).join("");
    if (before !== result) {
      changes.push("漢数字を算用数字に変換");
    }
  }

  return {
    original: address,
    normalized: result,
    changes,
  };
}
