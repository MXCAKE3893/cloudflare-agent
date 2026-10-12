import { tool } from "ai";
import { z } from "zod";

export type Note = { title: string; content: string };
export type AgentState = { notes: Note[] };

export function createTools(read: () => AgentState, write: (state: AgentState) => void) {
  return {
    saveNote: tool({
      description: "ユーザーから依頼されたメモを保存する。同じタイトルは上書きする。",
      inputSchema: z.object({
        title: z.string().trim().min(1).max(80),
        content: z.string().trim().min(1).max(2000),
      }),
      execute: async ({ title, content }) => {
        const notes = read().notes;
        if (notes.length >= 100 && !notes.some((note) => note.title === title)) {
          return { saved: false, error: "保存上限（100件）です。既存タイトルを更新してください。" };
        }
        write({ notes: [...notes.filter((note) => note.title !== title), { title, content }] });
        return { saved: true, title };
      },
    }),
    searchNotes: tool({
      description: "保存済みメモをタイトル・本文の部分一致で検索する。空文字なら全件取得する。",
      inputSchema: z.object({ query: z.string().max(100) }),
      execute: async ({ query }) => {
        const needle = query.trim().toLocaleLowerCase();
        return {
          notes: read().notes.filter((note) =>
            `${note.title}\n${note.content}`.toLocaleLowerCase().includes(needle),
          ),
        };
      },
    }),
    getCurrentTime: tool({
      description: "現在の日本時間を取得する。日時に関する質問に使う。",
      inputSchema: z.object({}),
      execute: async () => ({
        time: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
        timeZone: "Asia/Tokyo",
      }),
    }),
  };
}
