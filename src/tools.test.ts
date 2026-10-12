import { describe, expect, it } from "vitest";
import { createTools, type AgentState } from "./tools";

function setup(initial: AgentState = { notes: [] }) {
  let state = initial;
  const tools = createTools(() => state, (next) => { state = next; });
  const options = { toolCallId: "test", messages: [], context: {} };
  return { tools, options, read: () => state };
}

describe("agent tools", () => {
  it("メモを保存し、同じタイトルを更新する", async () => {
    const { tools, options, read } = setup();
    await tools.saveNote.execute!({ title: "買い物", content: "牛乳" }, options);
    await tools.saveNote.execute!({ title: "買い物", content: "牛乳と卵" }, options);
    expect(read().notes).toEqual([{ title: "買い物", content: "牛乳と卵" }]);
  });

  it("タイトル・本文を検索し、空文字なら全件返す", async () => {
    const { tools, options } = setup({ notes: [
      { title: "買い物", content: "牛乳" }, { title: "Work", content: "DEMO" },
    ] });
    expect(await tools.searchNotes.execute!({ query: "牛乳" }, options)).toEqual({ notes: [{ title: "買い物", content: "牛乳" }] });
    expect(await tools.searchNotes.execute!({ query: "demo" }, options)).toEqual({ notes: [{ title: "Work", content: "DEMO" }] });
    expect(await tools.searchNotes.execute!({ query: "なし" }, options)).toEqual({ notes: [] });
    expect(await tools.searchNotes.execute!({ query: "" }, options)).toHaveProperty("notes.length", 2);
  });

  it("100件を超える新規保存を拒否し、既存メモの更新は許可する", async () => {
    const { tools, options, read } = setup({ notes: Array.from({ length: 100 }, (_, i) => ({ title: String(i), content: "test" })) });
    expect(await tools.saveNote.execute!({ title: "new", content: "test" }, options)).toHaveProperty("saved", false);
    expect(await tools.saveNote.execute!({ title: "0", content: "updated" }, options)).toHaveProperty("saved", true);
    expect(read().notes).toHaveLength(100);
  });

  it("現在の日本時間を返す", async () => {
    const { tools, options } = setup();
    expect(await tools.getCurrentTime.execute!({}, options)).toEqual({ time: expect.any(String), timeZone: "Asia/Tokyo" });
  });
});
