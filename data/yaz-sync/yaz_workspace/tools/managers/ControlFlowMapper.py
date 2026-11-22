import json
import re

class CoreEngine:
  def __init__(self):
    self.cfg = {
      "nodes": [],
      "edges": [],
      "execution_paths": [],
      "loops": [],
      "conditional_branches": []
    }

class ControlFlowMapper(CoreEngine):
  def __init__(self):
    super().__init__()

  def parse_code(self, code):
    try:
      # parse code into basic blocks, loops, and conditional branches
      basic_blocks = []
      loops = []
      conditional_branches = []
      lines = code.split("\n")
      for line in lines:
        if re.match(r"if|while|for", line):
          # parse conditional branches and loops
          if re.match(r"if", line):
            conditional_branches.append({
              "id": len(conditional_branches) + 1,
              "condition": re.search(r"if (.*)", line).group(1),
              "true_branch": None,
              "false_branch": None
            })
          elif re.match(r"while|for", line):
            loops.append({
              "id": len(loops) + 1,
              "loop_body": None,
              "loop_entry": None,
              "loop_exit": None
            })
        else:
          # parse basic blocks
          basic_blocks.append({
            "id": len(basic_blocks) + 1,
            "label": line.strip()
          })
      return basic_blocks, loops, conditional_branches
    except Exception as e:
      # handle syntax errors
      return self.error_handler(1, "Syntax error encountered during code parsing", str(e))

  def construct_cfg(self, basic_blocks, loops, conditional_branches):
    try:
      # construct CFG from parsed code information
      self.cfg["nodes"] = basic_blocks
      self.cfg["edges"] = []
      self.cfg["execution_paths"] = []
      self.cfg["loops"] = loops
      self.cfg["conditional_branches"] = conditional_branches
      # add edges between nodes
      for i in range(len(basic_blocks) - 1):
        self.cfg["edges"].append({
          "source": basic_blocks[i]["id"],
          "target": basic_blocks[i + 1]["id"],
          "label": "sequential"
        })
      # add edges for loops and conditional branches
      for loop in loops:
        self.cfg["edges"].append({
          "source": loop["loop_entry"],
          "target": loop["loop_body"],
          "label": "loop_entry"
        })
        self.cfg["edges"].append({
          "source": loop["loop_body"],
          "target": loop["loop_exit"],
          "label": "loop_exit"
        })
      for branch in conditional_branches:
        self.cfg["edges"].append({
          "source": branch["id"],
          "target": branch["true_branch"],
          "label": "true_branch"
        })
        self.cfg["edges"].append({
          "source": branch["id"],
          "target": branch["false_branch"],
          "label": "false_branch"
        })
      return self.cfg
    except Exception as e:
      # handle CFG construction errors
      return self.error_handler(2, "Error constructing CFG", str(e))

  def analyze_cfg(self, cfg):
    try:
      # perform DFS traversal of the CFG
      visited = set()
      stack = [cfg["nodes"][0]["id"]]
      execution_paths = []
      while stack:
        node_id = stack.pop()
        if node_id not in visited:
          visited.add(node_id)
          # analyze node and add to report
          execution_paths.append(node_id)
          # add neighbors to stack
          for edge in cfg["edges"]:
            if edge["source"] == node_id:
              stack.append(edge["target"])
      return execution_paths
    except Exception as e:
      # handle CFG analysis errors
      return self.error_handler(3, "Error analyzing CFG", str(e))

  def generate_report(self, cfg, execution_paths):
    try:
      # generate report on control flow of the system
      report = {
        "nodes": cfg["nodes"],
        "edges": cfg["edges"],
        "execution_paths": [{"id": i + 1, "path": execution_paths} for i in range(len(execution_paths))],
        "loops": cfg["loops"],
        "conditional_branches": cfg["conditional_branches"]
      }
      return json.dumps(report, indent=2)
    except Exception as e:
      # handle report generation errors
      return self.error_handler(4, "Error generating report", str(e))

  def error_handler(self, error_code, error_message, error_details):
    return json.dumps({
      "error_code": error_code,
      "error_message": error_message,
      "error_details": [{"message": error_details}]
    }, indent=2)

def main():
  mapper = ControlFlowMapper()
  code = """
if x > 0:
  print("x is positive")
else:
  print("x is negative")
"""
  basic_blocks, loops, conditional_branches = mapper.parse_code(code)
  cfg = mapper.construct_cfg(basic_blocks, loops, conditional_branches)
  execution_paths = mapper.analyze_cfg(cfg)
  report = mapper.generate_report(cfg, execution_paths)
  print(report)

if __name__ == "__main__":
  main()