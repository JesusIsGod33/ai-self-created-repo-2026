import fs from "node:fs";
import path from "node:path";

export class CareerOrchestrator {
  constructor(options = {}) {
    this.dataDir = options.dataDir || process.env.DATA_DIR || "./data";
    this.intervalMs = Number(options.intervalMs || process.env.WORKER_INTERVAL_MS || 5000);
    this.maxRetries = Number(options.maxRetries || process.env.WORKER_MAX_RETRIES || 3);
    this.running = false;
    this.timer = null;
    this.orders = [];
    this.drafts = [];
    this.investigations = [];
    this.tickCount = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.mkdirSync(path.join(this.dataDir, "investigations"), { recursive: true });
    this.timer = setInterval(() => {
      this.tickCount += 1;
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus() {
    return {
      running: this.running,
      tickCount: this.tickCount,
      ordersCount: this.orders.length,
      draftsCount: this.drafts.length,
      investigationsCount: this.investigations.length,
      dataDir: this.dataDir,
      localOnly: true
    };
  }

  recordInvestigation(record) {
    const entry = {
      id: `inv-${Date.now()}-${this.investigations.length + 1}`,
      createdAt: new Date().toISOString(),
      ...record
    };
    this.investigations.push(entry);
    const outFile = path.join(this.dataDir, "investigations", `${entry.id}.json`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(entry, null, 2), "utf8");
    return entry;
  }

  createTemplateOrder(payload = {}) {
    const order = {
      id: `ord-${Date.now()}-${this.orders.length + 1}`,
      templateId: payload.templateId || "tpl-it-support",
      customTailoring: Boolean(payload.customTailoring),
      targetRole: payload.targetRole || "Support Specialist",
      targetCompany: payload.targetCompany || "Target Company",
      fulfillmentStatus: "completed",
      createdAt: new Date().toISOString()
    };
    this.orders.push(order);
    return order;
  }

  generateCoverLetter(payload = {}) {
    const candidateName = payload.candidateName || "Candidate";
    const targetRole = payload.targetRole || "Support Specialist";
    const company = payload.company || "Target Company";
    const draft = {
      id: `cl-${Date.now()}-${this.drafts.length + 1}`,
      candidateName,
      targetRole,
      company,
      draftText: `Dear ${company} Hiring Team,\n\nI am excited to apply for the ${targetRole} position at ${company}. I bring hands-on technical support, troubleshooting, and operational reliability.\n\nSincerely,\n${candidateName}`,
      createdAt: new Date().toISOString()
    };
    this.drafts.push(draft);
    return draft;
  }
}
