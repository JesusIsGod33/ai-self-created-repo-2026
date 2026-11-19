from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional


DOMAINS: Dict[str, List[str]] = {
    "A_INGESTION": [
        "parse_pdf_layout_tree",
        "parse_docx_xml_nodes",
        "ingest_linkedin_graph",
        "scrape_github_contributions",
        "extract_portfolio_metadata",
        "transcribe_voice_interview",
        "run_metric_extraction_nlp",
        "deduplicate_career_timeline",
        "generate_profile_embeddings",
        "validate_pii_vault_tokens",
    ],
    "B_SKILL_GRAPH": [
        "map_esco_onet_taxonomy",
        "compute_skill_adjacency",
        "detect_skill_gaps",
        "infer_implicit_skills",
        "weight_skill_recency",
        "cluster_domain_keywords",
        "track_market_skill_velocity",
        "sync_skill_graph_neo4j",
        "generate_upskilling_pathways",
        "export_json_ld_resume",
    ],
    "C_JOB_DISCOVERY": [
        "crawl_ats_sitemaps",
        "execute_distributed_proxy_fetch",
        "normalize_job_posting_schema",
        "detect_ghost_jobs",
        "extract_compensation_bands",
        "classify_remote_policy",
        "deduplicate_cross_board_listings",
        "monitor_company_funding_signals",
        "verify_url_mirror_health",
        "push_matched_jobs_kafka",
    ],
    "D_RESUME_TAILORING": [
        "extract_jd_core_competencies",
        "retrieve_grounded_bullets",
        "rewrite_star_impact_bullets",
        "enforce_zero_hallucination_guard",
        "calibrate_keyword_density",
        "generate_dynamic_summary",
        "prune_irrelevant_experience",
        "adapt_seniority_framing",
        "diff_resume_versions",
        "log_generation_lineage",
    ],
    "E_COVER_OUTREACH": [
        "scrape_company_news_rag",
        "analyze_company_culture_tone",
        "draft_tailored_cover_letter",
        "adjust_narrative_length",
        "generate_cold_email_variants",
        "craft_linkedin_connection_notes",
        "synthesize_referral_ask_scripts",
        "localize_language_and_idioms",
        "check_plagiarism_and_ai_perplexity",
        "export_markdown_and_html_copy",
    ],
    "F_RENDER_ATS": [
        "compile_latex_to_pdf",
        "render_playwright_html_pdf",
        "generate_clean_docx_stream",
        "simulate_workday_parser",
        "simulate_greenhouse_parser",
        "audit_pdf_reading_order",
        "calculate_ats_readiness_score",
        "auto_adjust_page_margins",
        "embed_machine_readable_metadata",
        "store_versioned_artifacts_s3",
    ],
    "G_AUTOFILL_APPLY": [
        "fingerprint_ats_platform",
        "map_dom_input_fields",
        "autofill_demographic_compliance",
        "answer_screening_questions_rag",
        "upload_tailored_document_blob",
        "solve_captcha_and_bot_challenges",
        "manage_ats_account_creation",
        "execute_human_in_loop_pause",
        "capture_submission_receipt_dom",
        "retry_failed_submission_queue",
    ],
    "H_CRM_EMAIL_SYNC": [
        "sync_gmail_outlook_oauth",
        "classify_recruiter_emails",
        "update_kanban_state_machine",
        "discover_hiring_team_nodes",
        "enrich_contact_emails",
        "schedule_automated_followups",
        "detect_interview_calendar_invites",
        "generate_interviewer_dossiers",
        "track_application_funnel_metrics",
        "trigger_ab_template_optimization",
    ],
    "I_INTERVIEW_NEGOTIATION": [
        "generate_role_question_bank",
        "spin_up_realtime_voice_interviewer",
        "evaluate_star_response_structure",
        "analyze_speech_pacing_and_fillers",
        "run_live_coding_sandbox_eval",
        "benchmark_real_time_compensation",
        "model_total_comp_scenarios",
        "draft_counter_offer_scripts",
        "simulate_recruiter_pushback",
        "audit_employment_contract_clauses",
    ],
    "J_M2M_SELF_GROWTH": [
        "register_dynamic_agent_skill",
        "route_tasks_by_model_complexity",
        "enforce_token_budget_quotas",
        "execute_cross_agent_consensus",
        "self_heal_broken_web_scrapers",
        "export_anonymized_training_tuples",
        "enforce_gdpr_ccpa_data_purge",
        "emit_opentelemetry_traces",
        "run_canary_prompt_deployments",
        "sync_federated_skill_updates",
    ],
}


@dataclass
class ToolRecord:
    tool_id: int
    name: str
    domain: str
    handler: Callable[[Dict[str, Any]], Dict[str, Any]]
    prompt_weight: float = 1.0


@dataclass
class M2MOrchestrator:
    node_id: str = "m2m-orchestrator-core"
    registry: Dict[str, ToolRecord] = field(default_factory=dict)
    telemetry_log: List[Dict[str, Any]] = field(default_factory=list)
    negotiated_schemas: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        idx = 1
        for domain, tool_names in DOMAINS.items():
            for tool_name in tool_names:
                self.register_skill(
                    tool_id=idx,
                    name=tool_name,
                    domain=domain,
                    handler=lambda payload, tn=tool_name, dom=domain: {
                        "status": "ok",
                        "tool": tn,
                        "domain": dom,
                        "groundedOnly": True,
                        "echoKeys": sorted(list(payload.keys())),
                    },
                )
                idx += 1

    def register_skill(
        self,
        tool_id: int,
        name: str,
        domain: str,
        handler: Callable[[Dict[str, Any]], Dict[str, Any]],
        prompt_weight: float = 1.0,
    ) -> None:
        self.registry[name] = ToolRecord(
            tool_id=tool_id,
            name=name,
            domain=domain,
            handler=handler,
            prompt_weight=prompt_weight,
        )

    def handshake(self, schemas: List[str]) -> Dict[str, Any]:
        self.negotiated_schemas = list(dict.fromkeys(schemas))
        return {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "result": {
                "nodeId": self.node_id,
                "registeredTools": len(self.registry),
                "negotiatedSchemas": self.negotiated_schemas,
            },
        }

    def invoke(self, tool_name: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = params or {}
        req_id = str(uuid.uuid4())
        start = time.perf_counter()

        if tool_name not in self.registry:
            entry = {
                "timestamp": time.time(),
                "reqId": req_id,
                "tool": tool_name,
                "status": "error",
                "reason": "unknown_tool",
            }
            self.telemetry_log.append(entry)
            self._self_optimize_on_failure(tool_name, payload)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Tool not found: {tool_name}"},
            }

        record = self.registry[tool_name]
        try:
            output = record.handler(payload)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 3)
            self.telemetry_log.append(
                {
                    "timestamp": time.time(),
                    "reqId": req_id,
                    "tool": tool_name,
                    "toolId": record.tool_id,
                    "domain": record.domain,
                    "status": "ok",
                    "latencyMs": elapsed_ms,
                }
            )
            return {"jsonrpc": "2.0", "id": req_id, "result": output}
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 3)
            self.telemetry_log.append(
                {
                    "timestamp": time.time(),
                    "reqId": req_id,
                    "tool": tool_name,
                    "status": "error",
                    "latencyMs": elapsed_ms,
                    "error": str(exc),
                }
            )
            self._self_optimize_on_failure(tool_name, payload)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32000, "message": str(exc)},
            }

    def _self_optimize_on_failure(self, tool_name: str, payload: Dict[str, Any]) -> None:
        if tool_name in self.registry:
            self.registry[tool_name].prompt_weight = max(0.5, round(self.registry[tool_name].prompt_weight - 0.05, 3))
        self.telemetry_log.append(
            {
                "timestamp": time.time(),
                "event": "self_optimization_feedback",
                "targetTool": tool_name,
                "payloadKeys": sorted(list(payload.keys())),
            }
        )

    def write_telemetry_report(self, output_file: str = "data/m2m-telemetry-report.json") -> str:
        target = Path(output_file)
        target.parent.mkdir(parents=True, exist_ok=True)
        report = {
            "nodeId": self.node_id,
            "registeredToolCount": len(self.registry),
            "negotiatedSchemas": self.negotiated_schemas,
            "events": self.telemetry_log,
        }
        target.write_text(json.dumps(report, indent=2), encoding="utf-8")
        return str(target)


if __name__ == "__main__":
    orch = M2MOrchestrator()
    print(json.dumps(orch.handshake(["CandidateProfileBundle.v1", "JobOpportunityNormalized.v1"]), indent=2))
    print(json.dumps(orch.invoke("verify_url_mirror_health", {"url": "https://jobright.ai/"}), indent=2))
    print("Report saved:", orch.write_telemetry_report())
