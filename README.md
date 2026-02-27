# japan-address-mcp

日本の住所を正規化・検証するMCPサーバー。

AIエージェント（Claude等）から直接呼び出して、郵便番号検索・住所正規化・バリデーションが可能。

## 機能

| ツール | 説明 |
|--------|------|
| `postal_to_address` | 郵便番号から住所を取得 |
| `address_to_postal` | 住所から郵便番号を検索 |
| `normalize_address` | 住所の表記ゆれを正規化 |
| `validate_address` | 住所の存在を検証 |
| `health_check` | サーバー稼働確認 |

## クイックスタート

### 1. インストール

```bash
git clone https://github.com/shinogw/japan-address-mcp.git
cd japan-address-mcp
npm install
```

### 2. 郵便番号データをダウンロード

```bash
npx ts-node scripts/download-postal-data.ts
```

### 3. ビルド

```bash
npm run build
```

### 4. Claude Desktopに設定

`~/Library/Application Support/Claude/claude_desktop_config.json` を編集:

```json
{
  "mcpServers": {
    "japan-address": {
      "command": "node",
      "args": ["/path/to/japan-address-mcp/dist/index.js"]
    }
  }
}
```

## 使用例

### 郵便番号から住所を取得

```
郵便番号 100-0001 の住所を教えて
```

→ 東京都千代田区千代田

### 住所から郵便番号を検索

```
東京都渋谷区の郵便番号は？
```

→ 150-0001〜150-0047 など

### 住所を正規化

```
「東京都千代田区１−２−３」を正規化して
```

→ 東京都千代田区1-2-3（全角→半角、ハイフン統一）

### 住所を検証

```
「東京都千代田区千代田」は有効な住所？
```

→ 有効（信頼度: high）

## API仕様

### postal_to_address

郵便番号から住所を取得。

**入力:**
```json
{
  "postalCode": "100-0001"
}
```

**出力:**
```json
{
  "success": true,
  "postalCode": "100-0001",
  "addresses": [
    {
      "prefecture": "東京都",
      "city": "千代田区",
      "town": "千代田",
      "fullAddress": "東京都千代田区千代田"
    }
  ]
}
```

### address_to_postal

住所から郵便番号を検索。

**入力:**
```json
{
  "address": "東京都千代田区"
}
```

**出力:**
```json
{
  "success": true,
  "query": "東京都千代田区",
  "results": [
    {
      "postalCode": "100-0001",
      "prefecture": "東京都",
      "city": "千代田区",
      "town": "千代田",
      "fullAddress": "東京都千代田区千代田"
    }
  ]
}
```

### normalize_address

住所を正規化。

**入力:**
```json
{
  "address": "東京都千代田区１−２−３",
  "options": {
    "convertFullwidthToHalfwidth": true,
    "normalizeHyphens": true
  }
}
```

**出力:**
```json
{
  "original": "東京都千代田区１−２−３",
  "normalized": "東京都千代田区1-2-3",
  "changes": [
    "全角英数字を半角に変換",
    "ハイフン/ダッシュを統一"
  ]
}
```

### validate_address

住所を検証。

**入力:**
```json
{
  "address": "東京都千代田区千代田"
}
```

**出力:**
```json
{
  "valid": true,
  "confidence": "high",
  "normalizedAddress": "東京都千代田区千代田",
  "matchedRecords": [...],
  "issues": []
}
```

## 正規化オプション

| オプション | デフォルト | 説明 |
|-----------|----------|------|
| `convertFullwidthToHalfwidth` | true | 全角英数字を半角に変換 |
| `convertHalfwidthKanaToFullwidth` | true | 半角カナを全角に変換 |
| `convertKanjiNumbers` | false | 漢数字を算用数字に変換 |
| `normalizeHyphens` | true | ハイフン/ダッシュを統一 |
| `normalizeSpaces` | true | スペースを統一 |
| `normalizeChome` | true | 丁目・番地・号の表記を統一 |

## データソース

- 日本郵便 郵便番号データ: https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html
- 約12万件の郵便番号レコードを収録

## 開発

```bash
# テスト実行
npm test

# 開発モード（ファイル監視）
npm run dev

# ビルド
npm run build
```

## ライセンス

MIT
