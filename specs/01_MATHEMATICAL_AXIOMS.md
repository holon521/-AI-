
# 01. MATHEMATICAL AXIOMS & IMPLEMENTATION LOGIC

> **Principle:** "Code is just the execution of Math. The Math must be correct first."

## 1. MuVERA-INSPIRED FDE (The Memory Compression)
We reject simple Mean Pooling. We implement a variant of **MuVERA (Multi-Vector Retrieval via Fixed Dimensional Encodings)**.

### A. The Algorithm (Python/Numpy Implementation)
Let $D$ be a document consisting of token vectors $V = \{v_1, v_2, ..., v_N\}$ where $v_i \in \mathbb{R}^{768}$.
We define a **Random Projection Matrix** $R \in \mathbb{R}^{768 \times K}$ (where $K=1024$, Seed=42).

1.  **Projection:** For each $v_i$, compute binary hash $h_i = \text{sign}(v_i \cdot R)$.
2.  **Aggregation:** Instead of storing $N$ hashes, we compute the **element-wise sum**:
    $$ S_{doc} = \sum_{i=1}^{N} h_i $$
    (Result is a generic integer vector of size $K$).
3.  **Similarity:** The score between Query ($S_q$) and Document ($S_d$) is approximated by:
    $$ \text{Sim}(Q, D) \approx \text{dot}(S_q, S_d) $$

### B. Why this matters?
- Preserves **Polysemy** (Multiple meanings in one doc).
- Allows $O(1)$ retrieval complexity via matrix multiplication in Colab.

## 2. TOPOLOGICAL TRUTH (Persistent Homology)
Truth is defined by the **Stability of the Logical Manifold**.

### A. The Betti Number Check
We treat "Accepted Facts" as a Point Cloud $P$ in embedding space.
1.  Construct **Vietoris-Rips Complex** at scale $\epsilon$.
2.  Compute $\beta_1$ (1st Betti Number, number of loops/contradictions).
3.  **Injection Test:** When adding new fact $f_{new}$:
    - Calculate $\beta_1(P \cup \{f_{new}\})$.
    - If $\Delta \beta_1 > \text{Threshold}$, the new fact creates a logical "hole" (Contradiction).
    - **Action:** Trigger `SkepticismProtocol`.

## 3. SYSTEM ATTENTION (The OS Kernel)
The `MemoryOrchestrator` is a specialized **Attention Head**.
- **Softmax Temperature ($\tau$):**
  $$ \text{Attn}(q, k) = \frac{\exp(q \cdot k / \tau)}{\sum \exp(q \cdot k_i / \tau)} $$
- **Dynamic Temperature:**
  - Standard Mode: $\tau = 1.0$
  - `FOCUS` Mode: $\tau = 0.1$ (Extreme focus, ignores peripheral memories).
  - `CREATIVE` Mode: $\tau = 5.0$ (High hallucinations allowed, connects distant dots).
