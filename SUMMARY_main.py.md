# Summary for `main.py`

- bytes: 7740
- sha: 39b4ac605fff
- generated: 2025-11-12T11:12:55.722701Z

## Structure
```json
{
  "imports": [
    "time",
    "dataclasses.replace",
    "nltk",
    "numpy",
    "torch",
    "neural_cherche.models",
    "neural_cherche.rank",
    "datasets.load_dataset",
    "logging",
    "fde_generator.FixedDimensionalEncodingConfig",
    "fde_generator.generate_query_fde",
    "fde_generator.generate_document_fde_batch"
  ],
  "classes": [
    {
      "name": "ColbertNativeRetriever",
      "methods": [
        "__init__",
        "index",
        "search"
      ]
    },
    {
      "name": "ColbertFdeRetriever",
      "methods": [
        "__init__",
        "index",
        "search"
      ]
    }
  ],
  "functions": [
    "load_nanobeir_dataset",
    "evaluate_recall",
    "to_numpy"
  ],
  "docstring": null
}
```
## Chunk map
```json
[
  {
    "chunk": 1,
    "brief": "- functions: load_nanobeir_dataset, evaluate_recall, to_numpy, __init__, index, search, __init__, index, search\n- classes: n/a\n- chars: 7000"
  },
  {
    "chunk": 2,
    "brief": "- functions: n/a\n- classes: n/a\n- chars: 740"
  }
]
```