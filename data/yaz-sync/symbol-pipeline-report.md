# Yaz Symbol Pipeline Report

- Updated At: 2026-11-21T05:14:50.005Z
- Mirror Dir: /home/Woken/career-orchestrator-stack/data/yaz-sync
- Audited Modules: 400
- Valid Syntax: 400
- Syntax Errors: 0
- Total Symbols: 3228 (class: 389, def: 2781, async_def: 58)
- Total Hits: 389 (showing 25)
- Total Snippets: 389 (showing 25)

## Symbol Hits

- `class` **FibonacciEngine** in `yaz_workspace/FibonacciEngine.py` (line 1)
- `class` **BootstrapContext** in `yaz_workspace/tools/ingested/Helix-AGI/bootstrap/seed_builder.py` (line 128)
- `class` **FrictionDamper** in `yaz_workspace/tools/ingested/Helix-AGI/brain/friction_damper.py` (line 17)
- `class` **SensoryCortex** in `yaz_workspace/tools/ingested/Helix-AGI/brain/sensory_cortex.py` (line 47)
- `class` **StabilitySentinel** in `yaz_workspace/tools/ingested/Helix-AGI/brain/stability_sentinel.py` (line 34)
- `class` **VisionCortex** in `yaz_workspace/tools/ingested/Helix-AGI/brain/vision_cortex.py` (line 46)
- `class` **HelixDiscordBot** in `yaz_workspace/tools/ingested/Helix-AGI/comms/discord_bot.py` (line 27)
- `class` **HelixTelegramBot** in `yaz_workspace/tools/ingested/Helix-AGI/comms/telegram_bot.py` (line 22)
- `class` **WavePacket** in `yaz_workspace/tools/ingested/Helix-AGI/core/affect_field.py` (line 101)
- `class` **InterferenceResult** in `yaz_workspace/tools/ingested/Helix-AGI/core/affect_field.py` (line 233)
- `class` **AffectField** in `yaz_workspace/tools/ingested/Helix-AGI/core/affect_field.py` (line 258)
- `class` **AuxiliaryLLM** in `yaz_workspace/tools/ingested/Helix-AGI/core/auxiliary_llm.py` (line 74)
- `class` **GalaxyCenter** in `yaz_workspace/tools/ingested/Helix-AGI/core/belief_cosmology.py` (line 156)
- `class` **GalaxyMap** in `yaz_workspace/tools/ingested/Helix-AGI/core/belief_cosmology.py` (line 192)
- `class` **CoOccurrenceTracker** in `yaz_workspace/tools/ingested/Helix-AGI/core/co_occurrence_hook.py` (line 53)
- `class` **CognitiveProjection** in `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py` (line 75)
- `class` **GravityField** in `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py` (line 180)
- `class` **CognitiveSpace** in `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py` (line 300)
- `class` **InteractionEngine** in `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py` (line 1683)
- `class` **ConceptExtractor** in `yaz_workspace/tools/ingested/Helix-AGI/core/concept_extractor.py` (line 29)
- `class` **ConceptReranker** in `yaz_workspace/tools/ingested/Helix-AGI/core/concept_reranker.py` (line 46)
- `class` **ContextCompressor** in `yaz_workspace/tools/ingested/Helix-AGI/core/context_compressor.py` (line 90)
- `class` **Curator** in `yaz_workspace/tools/ingested/Helix-AGI/core/curator.py` (line 37)
- `class` **DualPulseLoop** in `yaz_workspace/tools/ingested/Helix-AGI/core/dual_pulse_loop.py` (line 54)
- `class` **GGUFManager** in `yaz_workspace/tools/ingested/Helix-AGI/core/gguf_manager.py` (line 30)

## Code Snippets

### FibonacciEngine (`class` at line 1)
File: `yaz_workspace/FibonacciEngine.py`
```python
1: class FibonacciEngine:
2:     def calculate_fibonacci(self, n):
3:         if n <= 0:
4:             return "Input should be a positive integer"
```

### BootstrapContext (`class` at line 128)
File: `yaz_workspace/tools/ingested/Helix-AGI/bootstrap/seed_builder.py`
```python
125: 
126: 
127: @dataclass(frozen=True)
128: class BootstrapContext:
129:     agent_name: str
130:     creator_name: str
131:     profile: str
```

### FrictionDamper (`class` at line 17)
File: `yaz_workspace/tools/ingested/Helix-AGI/brain/friction_damper.py`
```python
14: logger = logging.getLogger("helix.brain.friction_damper")
15: 
16: 
17: class FrictionDamper:
18:     """Models a friction damper for moderating system operational friction.
19: 
20:     Parameters:
```

### SensoryCortex (`class` at line 47)
File: `yaz_workspace/tools/ingested/Helix-AGI/brain/sensory_cortex.py`
```python
44: _VISUAL_MEMORY_SIZE = 10
45: 
46: 
47: class SensoryCortex:
48:     """Subconscious visual perception — processes camera input through
49:     a local VL model (Gemma3 4B via Ollama) before it reaches consciousness.
50: 
```

### StabilitySentinel (`class` at line 34)
File: `yaz_workspace/tools/ingested/Helix-AGI/brain/stability_sentinel.py`
```python
31: logger = logging.getLogger("helix.brain.sentinel")
32: 
33: 
34: class StabilitySentinel:
35:     """Deep subconscious stability monitor.
36: 
37:     Runs as a daemon thread, periodically probing system health and
```

### VisionCortex (`class` at line 46)
File: `yaz_workspace/tools/ingested/Helix-AGI/brain/vision_cortex.py`
```python
43: _VISUAL_MEMORY_SIZE = 10
44: 
45: 
46: class VisionCortex:
47:     """Subconscious visual perception — processes camera input through
48:     a local VL model (Gemma3 4B via Ollama) before it reaches consciousness.
49: 
```

### HelixDiscordBot (`class` at line 27)
File: `yaz_workspace/tools/ingested/Helix-AGI/comms/discord_bot.py`
```python
24: logger = logging.getLogger("helix.comms.discord")
25: 
26: 
27: class HelixDiscordBot:
28:     """Discord bot — runs in a background thread.
29: 
30:     Architecture mirrors HelixTelegramBot:
```

### HelixTelegramBot (`class` at line 22)
File: `yaz_workspace/tools/ingested/Helix-AGI/comms/telegram_bot.py`
```python
19: logger = logging.getLogger("helix.comms.telegram")
20: 
21: 
22: class HelixTelegramBot:
23:     """Telegram bot — runs in a background thread.
24: 
25:     Anyone can message the agent. No user restrictions.
```

### WavePacket (`class` at line 101)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/affect_field.py`
```python
98: # ═════════════════════════════════════════════════════════════════════
99: 
100: @dataclass
101: class WavePacket:
102:     """A single emotional trace in 8D Plutchik affect-space.
103: 
104:     Represents an emotional moment that diffuses and decays over time,
```

### InterferenceResult (`class` at line 233)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/affect_field.py`
```python
230: # ═════════════════════════════════════════════════════════════════════
231: 
232: @dataclass
233: class InterferenceResult:
234:     """Result of sampling the emotional field.
235: 
236:     Attributes:
```

### AffectField (`class` at line 258)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/affect_field.py`
```python
255: # Affect Field
256: # ═════════════════════════════════════════════════════════════════════
257: 
258: class AffectField:
259:     """Manages wave packets in 8D Plutchik affect-space.
260: 
261:     The field maintains a collection of emotional traces that diffuse,
```

### AuxiliaryLLM (`class` at line 74)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/auxiliary_llm.py`
```python
71: _client_lock = threading.RLock()
72: 
73: 
74: class AuxiliaryLLM:
75:     """Lightweight LLM client for subconscious tasks.
76: 
77:     Keeps a separate session from the main consciousness so the primary
```

### GalaxyCenter (`class` at line 156)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/belief_cosmology.py`
```python
153: # score each cluster → pull from the highest-scoring one(s).
154: # ═══════════════════════════════════════════════════════════════════════
155: 
156: class GalaxyCenter:
157:     """A cluster centroid in the 8D belief space ("galaxy" in code).
158: 
159:     Built from a Layer 2 belief (people, concepts, skills, desires)
```

### GalaxyMap (`class` at line 192)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/belief_cosmology.py`
```python
189:         )
190: 
191: 
192: class GalaxyMap:
193:     """Map of cluster centroids in the 8D belief space ("galaxy map" in code).
194: 
195:     Built from Layer 2 beliefs and the full belief store. Each Layer 2
```

### CoOccurrenceTracker (`class` at line 53)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/co_occurrence_hook.py`
```python
50: PERSIST_INTERVAL = 50
51: 
52: 
53: class CoOccurrenceTracker:
54:     """Passively tracks belief co-injection patterns.
55: 
56:     Accumulates pairwise co-occurrence counts every pulse. The nightly
```

### CognitiveProjection (`class` at line 75)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py`
```python
72: # Cognitive Projection — embedding_dim → 8D
73: # ═══════════════════════════════════════════════════════════════════════
74: 
75: class CognitiveProjection:
76:     """Project high-dimensional embeddings to 8D cognitive space.
77: 
78:     Uses a random orthogonal projection matrix (Johnson-Lindenstrauss):
```

### GravityField (`class` at line 180)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py`
```python
177: # Gravity Field — 512-anchor grid for field computation
178: # ═══════════════════════════════════════════════════════════════════════
179: 
180: class GravityField:
181:     """Density estimator over 8D cognitive space ("gravity field" in code).
182: 
183:     Uses N_ANCHORS fixed anchor points distributed across the space.
```

### CognitiveSpace (`class` at line 300)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py`
```python
297: # Cognitive Space — the unified manifold
298: # ═══════════════════════════════════════════════════════════════════════
299: 
300: class CognitiveSpace:
301:     """8D spatial manifold for beliefs and memories.
302: 
303:     Every belief and memory gets a permanent position in 8D space.
```

### InteractionEngine (`class` at line 1683)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/cognitive_space.py`
```python
1680: TOOL_COOLDOWN_PULSES = 5
1681: 
1682: 
1683: class InteractionEngine:
1684:     """Converts manifold interaction potentials into actionable tool affordances.
1685: 
1686:     Sits between the CognitiveSpace (physics) and the ActionAgent (execution).
```

### ConceptExtractor (`class` at line 29)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/concept_extractor.py`
```python
26: logger = logging.getLogger("helix.core.concept_extractor")
27: 
28: 
29: class ConceptExtractor:
30:     """Extracts key concepts from natural language text.
31: 
32:     Uses RAKE-style scoring (Rapid Automatic Keyword Extraction):
```

### ConceptReranker (`class` at line 46)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/concept_reranker.py`
```python
43: DEFAULT_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
44: 
45: 
46: class ConceptReranker:
47:     """Cross-encoder reranker with lazy load and graceful fallback."""
48: 
49:     def __init__(
```

### ContextCompressor (`class` at line 90)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/context_compressor.py`
```python
87:     return str(content)
88: 
89: 
90: class ContextCompressor:
91:     """Rolling context compressor for Helix's Gemini chat sessions.
92: 
93:     Monitors token count and focus drift, triggering compression when
```

### Curator (`class` at line 37)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/curator.py`
```python
34: import warnings
35: warnings.filterwarnings("ignore", category=UserWarning)
36: 
37: class Curator:
38:     """The background belief crystallization and memory consolidation system.
39:     
40:     Triggered by the pulse_loop during dormancy, it spawns a background thread
```

### DualPulseLoop (`class` at line 54)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/dual_pulse_loop.py`
```python
51:     return datetime.now().astimezone().isoformat(timespec="seconds")
52: 
53: 
54: class DualPulseLoop:
55:     """Split-consciousness loop: local reasoner + API actuator.
56: 
57:     The local model thinks in pure monologue.
```

### GGUFManager (`class` at line 30)
File: `yaz_workspace/tools/ingested/Helix-AGI/core/gguf_manager.py`
```python
27: 
28: logger = logging.getLogger(__name__)
29: 
30: class GGUFManager:
31:     def __init__(self, models_dir: str):
32:         self.models_dir = models_dir
33:         self.models: Dict[str, Any] = {}
```
