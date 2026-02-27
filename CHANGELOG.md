# Changelog

## [0.1.0] - 2026-02-26

### Added
- 初回リリース
- 郵便番号→住所変換（`postal_to_address`）
- 住所→郵便番号検索（`address_to_postal`）
- 住所正規化（`normalize_address`）
- 住所バリデーション（`validate_address`）
- ヘルスチェック（`health_check`）
- 日本郵便の郵便番号データ取得スクリプト
- 124,820件のレコードに対応
- 31件のテストケース

### Performance
- データロード時間: ~400ms
- メモリ使用量: ~150MB（全データロード時）
