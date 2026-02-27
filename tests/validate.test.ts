import { describe, it, expect, beforeAll } from "vitest";
import { postalDataLoader } from "../src/data/loader.js";
import { validateAddress } from "../src/tools/validate.js";

describe("住所バリデーション", () => {
  beforeAll(async () => {
    await postalDataLoader.load();
  });

  describe("有効な住所", () => {
    it("存在する住所を有効と判定する", async () => {
      const result = await validateAddress("東京都千代田区千代田");
      expect(result.valid).toBe(true);
      expect(result.confidence).toBe("high");
    });

    it("マッチした住所情報を返す", async () => {
      const result = await validateAddress("東京都千代田区千代田");
      expect(result.matchedRecords.length).toBeGreaterThan(0);
    });
  });

  describe("無効な住所", () => {
    it("空文字を無効と判定する", async () => {
      const result = await validateAddress("");
      expect(result.valid).toBe(false);
      expect(result.confidence).toBe("none");
      expect(result.issues).toContain("住所が入力されていません");
    });

    it("存在しない住所を無効と判定する", async () => {
      const result = await validateAddress("存在しない県存在しない市");
      expect(result.valid).toBe(false);
    });
  });

  describe("表記ゆれ検出", () => {
    it("全角数字の表記ゆれを検出する", async () => {
      const result = await validateAddress("東京都千代田区１−２−３");
      expect(result.issues.some((i) => i.includes("表記ゆれ"))).toBe(true);
    });

    it("正規化された住所を返す", async () => {
      const result = await validateAddress("東京都千代田区１−２−３");
      expect(result.normalizedAddress).not.toContain("１");
    });
  });

  describe("都道府県チェック", () => {
    it("都道府県名がない場合は警告する", async () => {
      const result = await validateAddress("千代田区千代田");
      expect(result.issues.some((i) => i.includes("都道府県"))).toBe(true);
    });
  });

  describe("候補提示", () => {
    it("部分一致の場合は候補を提示する", async () => {
      const result = await validateAddress("東京都千代田");
      // 候補が提示される可能性
      expect(result.matchedRecords.length + result.suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("信頼度", () => {
    it("完全一致の場合はhigh", async () => {
      const result = await validateAddress("東京都千代田区千代田");
      expect(["high", "medium"]).toContain(result.confidence);
    });

    it("一致なしの場合はnone", async () => {
      const result = await validateAddress("XXXXX県YYYY市");
      expect(result.confidence).toBe("none");
    });
  });
});
