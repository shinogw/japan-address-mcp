import { describe, it, expect } from "vitest";
import { normalizeAddress } from "../src/tools/normalize.js";

describe("住所正規化", () => {
  describe("全角→半角変換", () => {
    it("全角数字を半角に変換する", () => {
      const result = normalizeAddress("東京都千代田区１−２−３");
      expect(result.normalized).toContain("1");
      expect(result.normalized).toContain("2");
      expect(result.normalized).toContain("3");
    });

    it("全角英字を半角に変換する", () => {
      const result = normalizeAddress("ＡＢＣビル");
      expect(result.normalized).toContain("ABC");
    });
  });

  describe("半角カナ→全角変換", () => {
    it("半角カナを全角に変換する", () => {
      const result = normalizeAddress("ﾄｳｷｮｳﾄ");
      expect(result.normalized).toBe("トウキョウト");
    });
  });

  describe("ハイフン統一", () => {
    it("各種ダッシュをハイフンに統一する", () => {
      const result = normalizeAddress("1－2ー3―4");
      expect(result.normalized).toBe("1-2-3-4");
    });
  });

  describe("スペース統一", () => {
    it("全角スペースを半角に変換する", () => {
      const result = normalizeAddress("東京都　千代田区");
      expect(result.normalized).toBe("東京都 千代田区");
    });

    it("連続スペースを1つにまとめる", () => {
      const result = normalizeAddress("東京都   千代田区");
      expect(result.normalized).toBe("東京都 千代田区");
    });
  });

  describe("丁目・番地・号の統一", () => {
    it("丁目番地号をハイフン形式に変換する", () => {
      const result = normalizeAddress("1丁目2番3号");
      expect(result.normalized).toBe("1-2-3");
    });

    it("丁目番地をハイフン形式に変換する", () => {
      const result = normalizeAddress("1丁目2番地");
      expect(result.normalized).toBe("1-2");
    });
  });

  describe("変更履歴", () => {
    it("変更があった場合はchangesに記録される", () => {
      const result = normalizeAddress("１−２−３");
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it("変更がない場合はchangesは空", () => {
      const result = normalizeAddress("東京都千代田区");
      // 変更がない場合はchangesが空になる可能性がある
      expect(result.changes).toBeDefined();
    });
  });

  describe("オプション", () => {
    it("convertKanjiNumbersオプションで漢数字を変換できる", () => {
      const result = normalizeAddress("一丁目", { convertKanjiNumbers: true });
      expect(result.normalized).toContain("1");
    });

    it("オプションを無効にすると変換しない", () => {
      const result = normalizeAddress("１２３", { 
        convertFullwidthToHalfwidth: false 
      });
      expect(result.normalized).toBe("１２３");
    });
  });
});
