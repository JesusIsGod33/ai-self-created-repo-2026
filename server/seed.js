export const SEED_TEMPLATES = [
  {
    id: "tpl-exec-systems",
    title: "Enterprise Systems & Reliability Resume Architecture",
    roleCategory: "Engineering & Systems",
    experienceLevel: "Mid-Senior",
    basePriceCents: 2900,
    addonTailoringCents: 1900,
    rating: "4.9",
    summary: "Structured technical blueprint engineered for SRE, infrastructure, and systems engineering roles with quantifiable uptime, latency, and automation blocks.",
    previewSections: [
      "Executive Reliability Summary & Core Stack Matrix",
      "Production Incident Mitigation & Automation Case Blocks",
      "Architecture Ownership, SLAs & Cross-Functional Delivery",
      "Certifications, Tooling & Verified Technical Impact"
    ],
    sampleBody: "SYSTEMS & RELIABILITY PROFILE\nTarget Track: Infrastructure / Site Reliability / Platform Engineering\n\nCORE COMPETENCIES\n- High-availability service operations, incident triage, root-cause diagnostics, and automated recovery workflows.\n- Infrastructure-as-code, observability pipelines, CI/CD release gates, and cross-team runbook standardization."
  },
  {
    id: "tpl-it-support-ops",
    title: "Tier-2/3 IT Support & Identity Operations Dossier",
    roleCategory: "IT & Support Operations",
    experienceLevel: "Entry-Mid",
    basePriceCents: 2400,
    addonTailoringCents: 1500,
    rating: "4.9",
    summary: "High-clarity operational resume template tailored for desktop support, identity/access administration, endpoint security, and knowledge-base specialists.",
    previewSections: [
      "Service Desk & Identity Administration Summary",
      "Endpoint Diagnostics, IAM & Patch Management Highlights",
      "Ticketing Lifecycle, Escalation & KB Documentation",
      "Technical Credentials & Customer Resolution Standards"
    ],
    sampleBody: "IT SUPPORT & IDENTITY OPERATIONS DOSSIER\nTarget Track: Technical Support / IAM Administration / Endpoint Operations\n\nOPERATIONAL STRENGTHS\n- Rapid hardware, OS, network, and cloud identity troubleshooting across distributed end-user environments.\n- Clear ticket documentation, structured escalation handoffs, and self-service knowledge base authoring."
  },
  {
    id: "tpl-clinical-ops",
    title: "Healthcare Operations & Care Coordination Blueprint",
    roleCategory: "Healthcare & Care Tech",
    experienceLevel: "All Levels",
    basePriceCents: 2700,
    addonTailoringCents: 1700,
    rating: "4.8",
    summary: "Structured template designed for care coordinators, health-tech operations specialists, and clinical support professionals.",
    previewSections: [
      "Care Coordination & Operational Readiness Summary",
      "Care Plan Execution, Documentation & Quality Assurance",
      "Multidisciplinary Communication & Workflow Reliability",
      "Credentials, Safety Standards & Community Impact"
    ],
    sampleBody: "HEALTHCARE OPERATIONS & CARE COORDINATION BLUEPRINT\nTarget Track: Care Coordination / Health Operations / Client Support\n\nCORE CAPABILITIES\n- Accurate care documentation, structured follow-ups, safety protocols, and empathetic stakeholder communication.\n- Workflow coordination across care teams, scheduling systems, and operational quality checklists."
  },
  {
    id: "tpl-data-ops-analyst",
    title: "Data Operations, Reporting & Workflow Analyst Kit",
    roleCategory: "Data & Operations",
    experienceLevel: "Entry-Mid",
    basePriceCents: 2500,
    addonTailoringCents: 1600,
    rating: "4.9",
    summary: "Analytical template built for operations analysts, data specialists, and workflow coordinators who turn raw records into reliable decisions.",
    previewSections: [
      "Analytical & Operational Precision Summary",
      "Data Hygiene, Validation & Reporting Deliverables",
      "Cross-Team Process Improvements & Turnaround Gains",
      "Tools, Automation & Analytical Methodologies"
    ],
    sampleBody: "DATA OPERATIONS & WORKFLOW ANALYST KIT\nTarget Track: Operations Analysis / Data Quality / Reporting Specialist\n\nKEY STRENGTHS\n- Structured data validation, auditability, metric tracking, and concise executive reporting.\n- Bottleneck identification and repeatable workflows that protect accuracy at scale."
  }
];

export const SEED_JOBS = [
  {
    id: "job-101",
    title: "Remote Technical Support & Identity Specialist",
    company: "Northstar Cloud Health",
    category: "IT & Support Operations",
    remoteMode: "Remote",
    location: "United States (Remote)",
    experienceLevel: "Mid-Senior",
    compensationMax: 84000,
    compensationLabel: "$68k - $84k / yr",
    postedAgo: "2h ago",
    recommendedTemplateId: "tpl-it-support-ops",
    requirements: [
      "Troubleshoot Windows/macOS endpoints, SSO/IAM access, and network connectivity",
      "Document structured resolution notes in ticketing systems and maintain KB articles",
      "Collaborate calmly with engineering and operations teams on escalations"
    ],
    summary: "Own end-to-end technical support and identity access workflows for a distributed healthcare technology team."
  },
  {
    id: "job-102",
    title: "Systems & Reliability Automation Engineer",
    company: "Aegis Grid Systems",
    category: "Engineering & Systems",
    remoteMode: "Hybrid",
    location: "Hybrid / Remote-Flexible",
    experienceLevel: "Mid-Senior",
    compensationMax: 138000,
    compensationLabel: "$112k - $138k / yr",
    postedAgo: "5h ago",
    recommendedTemplateId: "tpl-exec-systems",
    requirements: [
      "Build reliable background task pipelines, health checks, and automated recovery scripts",
      "Monitor service latency, error budgets, and deployment health across environments",
      "Write clear runbooks and verify changes with automated test suites"
    ],
    summary: "Architect resilient automation, monitoring, and self-healing operational tooling supporting distributed services."
  },
  {
    id: "job-103",
    title: "Care Operations & Intake Coordinator (Remote)",
    company: "Beacon Wellness Network",
    category: "Healthcare & Care Tech",
    remoteMode: "Remote",
    location: "Remote (US)",
    experienceLevel: "Entry-Mid",
    compensationMax: 66000,
    compensationLabel: "$54k - $66k / yr",
    postedAgo: "1d ago",
    recommendedTemplateId: "tpl-clinical-ops",
    requirements: [
      "Coordinate care intake, follow-up schedules, and accurate client/patient records",
      "Communicate clearly and empathetically across care teams and families",
      "Track daily milestones and escalate urgent blockers promptly"
    ],
    summary: "Deliver organized care coordination and intake operations that keep clients supported and workflows on schedule."
  },
  {
    id: "job-104",
    title: "Operations & Data Quality Analyst",
    company: "Meridian Supply & Fulfillment",
    category: "Data & Operations",
    remoteMode: "Remote",
    location: "Remote (US)",
    experienceLevel: "Entry-Mid",
    compensationMax: 76000,
    compensationLabel: "$62k - $76k / yr",
    postedAgo: "1d ago",
    recommendedTemplateId: "tpl-data-ops-analyst",
    requirements: [
      "Reconcile operational records, audit queue metrics, and build weekly KPI summaries",
      "Identify workflow bottlenecks and propose practical process improvements",
      "Partner with fulfillment and support leads to keep reporting accurate"
    ],
    summary: "Turn daily operational logs and fulfillment metrics into clean reporting, reliable forecasts, and process upgrades."
  }
];
