
// ZIA FDE ENGINE (Client-Side Lightweight Proxy) v2.0
// [Refactoring Note]
// 기존의 순수 JS 구현체는 수학적 깊이가 부족하고 성능이 조악함.
// 이 모듈은 이제 'Heavy Math'를 수행하지 않고, Swarm(Colab)으로 데이터를 보내기 전
// 데이터의 무결성을 검증하거나 빠른 해시 키를 생성하는 '체크섬(Checksum)' 용도로만 사용됨.
// 실제 벡터 연산(SVD, Topology, Embedding)은 'zia_worker_script.ts' (Python)에서 수행됨.

function appendToGrayCode(grayCode: number, bit: boolean): number {
    const bitVal = bit ? 1 : 0;
    return (grayCode << 1) + (bitVal ^ (grayCode & 1));
}

// 간단한 SimHash (브라우저용 경량 서명 생성기)
export function computeSimHashSignature(text: string): string {
    // 복잡한 가우시안 행렬 연산은 브라우저 부하를 유발하므로 제거하거나 최소화.
    // 여기서는 텍스트의 고유성을 식별할 수 있는 수준의 해시만 생성.
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < text.length; i++) {
        ch = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).toUpperCase();
}

// [Legacy Metric]
// 브라우저 내에서 빠른 판단이 필요할 때만 사용하는 근사치 논리 밀도 계산
export function calculateLogicDensity(text: string): number {
    const uniqueChars = new Set(text).size;
    const length = text.length;
    if (length === 0) return 0;
    
    const entropy = (uniqueChars / length) * Math.log2(length);
    const keywords = ['따라서', '그러므로', 'because', 'therefore', 'implies', 'axiom'];
    let logicBoost = 0;
    keywords.forEach(kw => { if (text.toLowerCase().includes(kw)) logicBoost += 0.05; });

    return Math.min(1.0, (entropy / 8) + logicBoost);
}

// [DEPRECATED]
// 브라우저에서 해밍 거리를 계산하는 것은 고차원 공간의 위상을 반영하지 못함.
// Colab의 ChromaDB/Faiss에서 Cosine Distance나 L2 Distance를 사용해야 함.
export function computeSimilarity(sig1: string, sig2: string): number {
    // Placeholder logic for UI compatibility
    return sig1 === sig2 ? 1.0 : 0.1; 
}
