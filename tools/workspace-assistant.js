import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = "/home/Woken/career-orchestrator-stack";

function resolveSafePath(inputPath = ".") {
  const candidate = path.resolve(WORKSPACE_ROOT, inputPath || ".");
  if (!candidate.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Path must remain inside /home/Woken/career-orchestrator-stack");
  }
  return candidate;
}

export const customTools = [
  {
    name: "sol_workspace_list",
    description: "List files and directories inside the local workspace for Sol assistant tasks.",
    inputSchema: {
      type: "object",
      properties: {
        subpath: { type: "string" }
      }
    },
    async run(args = {}) {
      const target = resolveSafePath(args.subpath || ".");
      const entries = fs.readdirSync(target, { withFileTypes: true }).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file"
      }));
      return { path: target, entries };
    }
  },
  {
    name: "sol_workspace_read",
    description: "Read a text file inside the local workspace for Sol assistant analysis.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string" },
        maxChars: { type: "number" }
      },
      required: ["filePath"]
    },
    async run(args = {}) {
      const target = resolveSafePath(args.filePath);
      const maxChars = Number(args.maxChars || 8000);
      const content = fs.readFileSync(target, "utf8");
      return {
        path: target,
        truncated: content.length > maxChars,
        content: content.slice(0, maxChars)
      };
    }
  },
  {
    name: "sol_workspace_note",
    description: "Append a structured note or task entry to data/sol-assistant-notes.md for workspace tracking.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" }
      },
      required: ["body"]
    },
    async run(args = {}) {
      const notesFile = path.join(WORKSPACE_ROOT, "data/sol-assistant-notes.md");
      fs.mkdirSync(path.dirname(notesFile), { recursive: true });
      const entry = [
        `## ${args.title || "Sol Workspace Note"} (${new Date().toISOString()})`,
        String(args.body || "").trim(),
        ""
      ].join("\n");
      fs.appendFileSync(notesFile, entry, "utf8");
      return { saved: true, notesFile };
    }
  }
];
