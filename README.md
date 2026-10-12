# Gemma Agent Demo

Cloudflare Agents SDK + Workers AI **Gemma 4 26B A4B** の最小チャットデモ。
モデル ID: `@cf/google/gemma-4-26b-a4b-it`。

## 起動

Node.js 22.12+（または 24）と Cloudflare アカウントが必要です。

```sh
npm install
npx wrangler login
npm run dev
```

ターミナルに表示されるローカル URL を開きます。API キー・`.env` は不要です。
**ローカル開発でも Workers AI は Cloudflare 上で実行され、利用枠・課金の対象になります。**

## 試すこと

- 「買い物」というメモに「牛乳と卵を買う」と保存して
- 買い物のメモを探して、内容を教えて
- 今の日本時間を調べて、日付をタイトルにしたメモに「デモを試した」と保存して

Gemma が `saveNote` / `searchNotes` / `getCurrentTime` を選んで実行し、結果から返答します。
最大 5 ステップ。ツールの入力・結果はチャット内の折りたたみで確認できます。
履歴とメモは Durable Object に永続化し、ブラウザーのランダムなセッション ID ごとに分離します。
メモは最大 100 件で、同じタイトルなら更新します。「履歴を消去」はメモを消しません。

## 確認・デプロイ

```sh
npm run typecheck
npm test
npm run build
npm run deploy
```

`src/server.ts` がエージェント、`src/tools.ts` がツール、`src/client.tsx` がチャット画面です。

## デモとしての制約

認証・レート制限は未実装です。ランダムなセッション ID は認証の代わりにはなりません。
公開すると第三者も Workers AI を利用できるため、公開運用する場合は Cloudflare Access などのアクセス制限と利用制限を追加してください。
機密情報は入力しないでください。モデルのツール選択や回答の正確さは保証されません。
ローカルとデプロイ先の Durable Object データは別です。

## DO の無料枠を節約する構成

- Workers Free で利用できる SQLite-backed DO を使用。
- SDK 標準の WebSocket ハイバネーションを使用。待機用の `setInterval`・ポーリング・定期ジョブは追加しません。
- チャット履歴は直近 40 メッセージまで保存（古い履歴は自動削除）。メモは最大 100 件。
- セッション ID をブラウザーに保持して同じ DO を再利用します。

Workers Free の DO 枠は、リクエスト 10万/日、実行時間 13,000 GB-s/日、行読み取り 500万/日、行書き込み 10万/日、保存容量 合計 5 GB です。
無料枠はアカウント内の他の利用とも共有します。少人数のデモ向けで、利用量を問わず無料を保証するものではありません。
**Workers Free は上限を超えると処理が失敗し、DO の超過料金は発生しません。Workers Paid の場合は超過課金があります。**
Free/Paid の選択はアカウント側で確認してください。このコードで契約プランを変更することはありません。
モデルの生成待ち・ストリーミング中は DO の実行時間を消費します。Workers AI は別の利用枠です。

料金表: https://developers.cloudflare.com/durable-objects/platform/pricing/

依存 SDK が固定している MCP パッケージは、既知の OAuth 脆弱性を避けるため `overrides` で修正版に指定しています。このデモでは MCP 自体は利用しません。
