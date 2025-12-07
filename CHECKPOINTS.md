# Checkpoints & Orchestration Plan
- generated: 2025-11-12T11:12:55.727916Z

## Checkpoints
```json
[
  {
    "file": "fde_generator.py",
    "sha": "2a5cff3ed3ef",
    "summary_path": "/mnt/data/muvera-analysis/SUMMARY_fde_generator.py.md",
    "bytes": 20514
  },
  {
    "file": "main.py",
    "sha": "39b4ac605fff",
    "summary_path": "/mnt/data/muvera-analysis/SUMMARY_main.py.md",
    "bytes": 7740
  },
  {
    "file": "README.md",
    "sha": "6068dd1167e1",
    "summary_path": "/mnt/data/muvera-analysis/SUMMARY_README.md.md",
    "bytes": 14022
  }
]
```

## Orchestration
1. Read → Summarize per-file (this step).
2. Build call graph (next step).
3. Compose whitepaper from summaries.
4. Verify with code snippets and minimal tests.
5. Iterate.