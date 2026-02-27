import { describe, it, expect, beforeAll } from "vitest";
import { postalDataLoader } from "../src/data/loader.js";
import { postalToAddress, addressToPostal } from "../src/tools/postal.js";

describe("郵便番号ツール", () => {
  beforeAll(async () => {
    await postalDataLoader.load();
  });

  describe("postalToAddress", () => {
    it("正常な郵便番号で住所を取得できる", async () => {
      const result = await postalToAddress("1000001");
      expect(result.success).toBe(true);
      expect(result.addresses.length).toBeGreaterThan(0);
      expect(result.addresses[0].prefecture).toBe("東京都");
      expect(result.addresses[0].city).toBe("千代田区");
    });

    it("ハイフン付きの郵便番号でも動作する", async () => {
      const result = await postalToAddress("100-0001");
      expect(result.success).toBe(true);
      expect(result.addresses[0].prefecture).toBe("東京都");
    });

    it("存在しない郵便番号でエラーを返す", async () => {
      const result = await postalToAddress("0000000");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("無効な形式でエラーを返す", async () => {
      const result = await postalToAddress("abc");
      expect(result.success).toBe(false);
      expect(result.error).toContain("無効な郵便番号形式");
    });

    it("空文字でエラーを返す", async () => {
      const result = await postalToAddress("");
      expect(result.success).toBe(false);
    });
  });

  describe("addressToPostal", () => {
    it("住所から郵便番号を検索できる", async () => {
      const result = await addressToPostal("東京都千代田区");
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it("部分一致で検索できる", async () => {
      const result = await addressToPostal("千代田区");
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it("存在しない住所でエラーを返す", async () => {
      const result = await addressToPostal("存在しない住所123");
      expect(result.success).toBe(false);
    });

    it("短すぎる入力でエラーを返す", async () => {
      const result = await addressToPostal("東");
      expect(result.success).toBe(false);
      expect(result.error).toContain("2文字以上");
    });
  });
});
