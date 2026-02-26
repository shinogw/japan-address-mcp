# japan-address-mcp 開発ブリーフ

## プロダクト概要

日本の住所を正規化するMCPサーバー。AIエージェント（Claude等）から直接呼び出せる。

## 機能要件（MVP）

### 必須機能
1. **郵便番号→住所変換**
   - 入力: 郵便番号（ハイフンあり/なし対応）
   - 出力: 都道府県、市区町村、町域

2. **住所→郵便番号変換**
   - 入力: 住所文字列
   - 出力: 郵便番号

3. **表記ゆれ正規化**
   - 全角/半角統一
   - 数字表記統一（「1-2-3」「一丁目二番地三号」→統一形式）
   - ハイフン・ダッシュ統一

4. **住所バリデーション**
   - 存在する住所かチェック
   - 補完候補の提示

## 技術仕様

### MCP実装
- **プロトコル**: MCP (Model Context Protocol)
- **言語**: TypeScript（Node.js）
- **SDK**: @modelcontextprotocol/sdk

### データソース
- 日本郵便の郵便番号データ（ken_all.csv）
- 自動更新機能（月次）

### MCP Tools（公開するツール）

```typescript
// Tool 1: 郵便番号から住所を取得
{
  name: "postal_to_address",
  description: "郵便番号から住所を取得します",
  inputSchema: {
    type: "object",
    properties: {
      postalCode: { type: "string", description: "郵便番号（例: 100-0001 または 1000001）" }
    },
    required: ["postalCode"]
  }
}

// Tool 2: 住所を正規化
{
  name: "normalize_address",
  description: "日本の住所を正規化します（表記ゆれを統一）",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "正規化したい住所" },
      format: { type: "string", enum: ["standard", "compact"], default: "standard" }
    },
    required: ["address"]
  }
}

// Tool 3: 住所から郵便番号を検索
{
  name: "address_to_postal",
  description: "住所から郵便番号を検索します",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "検索したい住所" }
    },
    required: ["address"]
  }
}

// Tool 4: 住所を検証
{
  name: "validate_address",
  description: "住所が有効かどうか検証します",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "検証したい住所" }
    },
    required: ["address"]
  }
}
```

## プロジェクト構造

```
japan-address-mcp/
├── src/
│   ├── index.ts          # エントリーポイント
│   ├── server.ts         # MCPサーバー実装
│   ├── tools/
│   │   ├── postal.ts     # 郵便番号関連
│   │   ├── normalize.ts  # 正規化
│   │   └── validate.ts   # バリデーション
│   ├── data/
│   │   └── loader.ts     # 郵便番号データ読み込み
│   └── utils/
│       └── converter.ts  # 文字変換ユーティリティ
├── data/
│   └── ken_all.csv       # 郵便番号データ（gitignore）
├── tests/
│   └── *.test.ts
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## 開発手順

1. **プロジェクト初期化**
   - package.json作成
   - TypeScript設定
   - MCP SDK導入

2. **データ準備**
   - 日本郵便の郵便番号データダウンロード
   - データローダー実装

3. **ツール実装**
   - postal_to_address
   - normalize_address
   - address_to_postal
   - validate_address

4. **MCPサーバー実装**
   - サーバー起動処理
   - ツール登録

5. **テスト**
   - ユニットテスト
   - Claude Desktopでの動作確認

6. **ドキュメント**
   - README.md
   - 使い方ガイド

## 品質基準

- TypeScript strict mode
- ESLint + Prettier
- テストカバレッジ 80%以上
- エラーハンドリング完備

## 参考リンク

- MCP公式ドキュメント: https://modelcontextprotocol.io/
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- 日本郵便データ: https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html
