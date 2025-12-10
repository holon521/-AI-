
// ZIA FDE ENGINE (Client-Side Lightweight Proxy) v2.1
// [LOCATION]: 02_CORTEX/fde_logic.ts

export function computeSimHashSignature(text: string): string {
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

export function computeSimilarity(sig1: string, sig2: string): number {
    return sig1 === sig2 ? 1.0 : 0.1; 
}
