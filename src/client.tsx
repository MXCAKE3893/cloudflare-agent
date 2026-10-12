import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import "./style.css";

const sessionKey = "gemma-agent-session";
function getSession() {
  const existing = localStorage.getItem(sessionKey);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(sessionKey, id);
  return id;
}

const examples = [
  "「買い物」というメモに、牛乳と卵を買う、と保存して",
  "買い物のメモを探して、内容を教えて",
  "今の日本時間を調べて、日付をタイトルにしたメモに「デモを試した」と保存して",
];

function App() {
  const [session] = useState(getSession);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const agent = useAgent({
    agent: "ChatAgent",
    name: session,
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
  });
  const { messages, sendMessage, status, error, clearHistory } = useAgentChat({ agent });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || busy || !connected) return;
    const text = input.trim();
    setInput("");
    try { await sendMessage({ text }); } catch { setInput(text); }
  }

  return (
    <main>
      <header>
        <div><span className="eyebrow">CLOUDFLARE AGENTS × WORKERS AI</span><h1>Gemma Agent Demo</h1></div>
        <span className={`connection ${connected ? "online" : ""}`}>{connected ? "接続中" : "接続待ち"}</span>
      </header>
      <p className="subtitle">Gemma 4 · 26B A4B — メモを覚えて、ツールを使って答える小さなエージェント。</p>
      <section className="chat" aria-label="チャット履歴" aria-live="polite">
        {messages.length === 0 && <div className="welcome"><h2>何をお手伝いしましょう？</h2><p>例えば、こんな依頼ができます。</p><div className="examples">{examples.map((example) => <button key={example} onClick={() => setInput(example)}>{example}</button>)}</div></div>}
        {messages.map((message) => (
          <article key={message.id} className={`message ${message.role}`}>
            <span className="role">{message.role === "user" ? "あなた" : "Gemma"}</span>
            {message.parts.map((part, index) => {
              if (part.type === "text") return <div className="text" key={index}>{part.text}</div>;
              if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                return <details className="tool" key={index}><summary>🛠 {part.type === "dynamic-tool" ? "ツール" : part.type.slice(5)}</summary><pre>{JSON.stringify(part, null, 2)}</pre></details>;
              }
              return null;
            })}
          </article>
        ))}
        {busy && <p className="pending">考えています…</p>}
        <div ref={bottom} />
      </section>
      {error && <p className="error" role="alert">エラー: {error.message}（Cloudflare のログイン・Workers AI の利用状況も確認してください）</p>}
      <form onSubmit={submit}>
        <input aria-label="メッセージ" placeholder="メモを保存して、あとで探して…" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} />
        <button className="send" disabled={busy || !connected || !input.trim()}>送信</button>
      </form>
      <footer><span>履歴・メモはこのブラウザーのセッション単位で保存されます。</span><button disabled={busy || !connected} onClick={() => { if (confirm("チャット履歴を消去しますか？ メモは残ります。")) void clearHistory(); }}>履歴を消去</button></footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
