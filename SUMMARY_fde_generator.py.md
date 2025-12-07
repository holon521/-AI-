# Summary for `fde_generator.py`

- bytes: 20514
- sha: 2a5cff3ed3ef
- generated: 2025-11-12T11:12:55.716201Z

## Structure
```json
{
  "imports": [
    "logging",
    "time",
    "numpy",
    "dataclasses.dataclass",
    "dataclasses.replace",
    "enum.Enum",
    "typing.Optional",
    "typing.List"
  ],
  "classes": [
    {
      "name": "EncodingType",
      "methods": []
    },
    {
      "name": "ProjectionType",
      "methods": []
    },
    {
      "name": "FixedDimensionalEncodingConfig",
      "methods": []
    }
  ],
  "functions": [
    "_append_to_gray_code",
    "_gray_code_to_binary",
    "_simhash_matrix_from_seed",
    "_ams_projection_matrix_from_seed",
    "_apply_count_sketch_to_vector",
    "_simhash_partition_index_gray",
    "_distance_to_simhash_partition",
    "_generate_fde_internal",
    "generate_query_fde",
    "generate_document_fde",
    "generate_fde",
    "generate_document_fde_batch"
  ],
  "docstring": null
}
```
## Chunk map
```json
[
  {
    "chunk": 1,
    "brief": "- functions: _append_to_gray_code, _gray_code_to_binary, _simhash_matrix_from_seed, _ams_projection_matrix_from_seed, _apply_count_sketch_to_vector, _simhash_partition_index_gray, _distance_to_simhash_partition, _generate_fde_internal, generate_query_fde, generate_document_fde, generate_fde\n- classes: EncodingType, ProjectionType\n- chars: 7000"
  },
  {
    "chunk": 2,
    "brief": "- functions: generate_document_fde_batch\n- classes: n/a\n- chars: 7000"
  },
  {
    "chunk": 3,
    "brief": "- functions: n/a\n- classes: n/a\n- chars: 6514"
  }
]
```