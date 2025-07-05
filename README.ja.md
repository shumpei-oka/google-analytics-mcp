# Google Analytics MCP for Claude

Claude のツールとして Google Analytics のデータを取得・集計できるデスクトップ拡張機能です。

This is a Desktop Extension for Claude that allows you to fetch and aggregate Google Analytics data as a tool.

---

## ✨ 機能 (Features)

- **プロパティ一覧 (List Properties)**: アクセス可能な GA4 プロパティの一覧を取得します。
- **柔軟なレポート作成 (Flexible Reporting)**: 期間、指標(metrics)、分析軸(dimensions)を自由に指定して、カスタムレポートを生成します。
  - 例：「先週の国別セッション数とユーザー数を教えて」
  - 例：「直近 30 日間のページごとの閲覧数を教えて」

## 🛠️ 設定手順 (Setup Instructions)

この拡張機能を使用するには、Google Cloud Platform (GCP)でのサービスアカウント設定と、Google Analytics での権限付与が必要です。

To use this extension, you need to configure a service account in Google Cloud Platform (GCP) and grant permissions in Google Analytics.

### 1. Google Cloud (GCP) でのサービスアカウント設定

(Setup Service Account on Google Cloud)

1. **GCP プロジェクトで API を有効にする (Enable APIs in your GCP project)**

   - [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com) を有効にします。
   - [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com) を有効にします。

2. **サービスアカウントを作成する (Create a Service Account)**

   - GCP コンソールの [サービスアカウント](https://console.cloud.google.com/iam-admin/serviceaccounts) ページに移動します。
   - 「サービスアカウントを作成」をクリックします。
   - アカウント名（例: `claude-ga-mcp`）を入力し、作成して続行します。
   - **ロールの選択は不要です。** ここでは権限を付与せず、「続行」をクリックし、「完了」します。

3. **JSON キーを作成してダウンロードする (Create and download a JSON key)**
   - 作成したサービスアカウントのメールアドレスをクリックします。
   - 「キー」タブに移動し、「鍵を追加」>「新しい鍵を作成」を選択します。
   - キーのタイプとして **JSON** を選択し、「作成」をクリックします。
   - キーファイル（例: `my-project-12345.json`）が自動的にダウンロードされます。**このファイルは安全な場所に保管してください。**

### 2. Google Analytics での権限付与

(Grant Permissions in Google Analytics)

1. 権限を付与したい Google Analytics の管理画面に移動します。
2. 「管理」>「アカウントのアクセス管理」に移動します。
3. 右上の「+」ボタン > 「ユーザーを追加」をクリックします。
4. **メールアドレス** フィールドに、先ほど作成したサービスアカウントのメールアドレス（例: `claude-ga-mcp@my-project-12345.iam.gserviceaccount.com`）を貼り付けます。
5. **役割** として「閲覧者」を選択します。
6. 「追加」をクリックします。

### 3. 拡張機能のインストールと設定

(Install and Configure the Extension)

1. **リポジトリをクローンまたはダウンロードします (Clone or download this repository)**
   ```bash
   git clone <repository_url>
   ```
2. **依存関係をインストールします (Install dependencies)**
   ```bash
   cd google-analytics
   npm install
   ```
3. **拡張機能をパッケージ化します (Package the extension)**

   ```bash
   dxt pack
   ```

   これにより、`GoogleAnalyticsMCP.dxt` というファイルが生成されます。

4. **Claude で拡張機能をインストールします (Install the extension in Claude)**

   - Claude デスクトップアプリの設定 > 「拡張機能」に移動します。
   - 「拡張機能を追加」>「ファイルからインストール」を選択し、先ほど生成された `.dxt` ファイルを指定します。

5. **拡張機能を設定します (Configure the extension)**
   - インストールされた "Google Analytics MCP" の設定（歯車アイコン）を開きます。
   - **サービスアカウントキーファイル**: 「ファイルを選択」ボタンを押し、ステップ 1 でダウンロードした **JSON キーファイル** を指定します。
   - **デフォルト GA4 プロパティ ID**: (任意) よく使う GA4 のプロパティ ID を入力しておくと、ツール使用時にプロパティ ID の指定を省略できます。
   - 「保存」をクリックします。

これで設定は完了です！Claude とのチャットで「GA のプロパティを一覧表示して」などと話しかけてみてください。

## 📜 ライセンス (License)

[MIT](LICENSE)
