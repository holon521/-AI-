
// ZIA FDE ENGINE & MATH UTILS v3.2 (ZERO-ALLOCATION OPTIMIZED)
// [LOCATION]: 02_CORTEX/fde_logic.ts
// [v3.2] Applied '1 Billion Row Challenge' optimization: No intermediate string creation (GC-free).

// 1. PSEUDO-RANDOM GENERATOR (Deterministic, Inlined for speed)
class Mulberry32 {
    private state: number;
    constructor(seed: number) { this.state = seed; }
    // Inline-friendly next()
    next(): number {
        var t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// 2. MATRIX PROJECTION (MuVERA-Style with Zero-Allocation)
// Optimization: Iterate through string directly without .match() or .split() to avoid creating garbage objects.
export function computeSimHashSignature(text: string): string {
    const dimension = 64; 
    const projection = new Float32Array(dimension).fill(0); // The only allocation (reused ideally)
    const len = text.length;
    
    let i = 0;
    while (i < len) {
        let code = text.charCodeAt(i);
        
        // Skip non-word characters (Simple whitespace/symbol check)
        // A-Z (65-90), a-z (97-122), 0-9 (48-57), Hangul (44032-55203)
        if (
            (code >= 65 && code <= 90) || 
            (code >= 97 && code <= 122) || 
            (code >= 48 && code <= 57) || 
            (code >= 44032 && code <= 55203)
        ) {
            // Found start of word
            let h = 0x811c9dc5; // FNV-1a Offset Basis
            
            // Inner loop: Hash the word on the fly (No substring creation)
            while (i < len) {
                code = text.charCodeAt(i);
                // Check if still a word char
                if (
                    !((code >= 65 && code <= 90) || 
                    (code >= 97 && code <= 122) || 
                    (code >= 48 && code <= 57) || 
                    (code >= 44032 && code <= 55203))
                ) {
                    break; // Word ended
                }
                
                // FNV-1a Hash Step
                h ^= code;
                h = Math.imul(h, 0x01000193);
                i++;
            }
            
            // Apply projection using the computed hash
            // (We re-seed RNG with the token hash to simulate fixed vector for that token)
            let t = h >>> 0; // Seed
            for (let j = 0; j < dimension; j++) {
                 // Inline Mulberry32 logic for raw speed inside hot loop
                 t += 0x6D2B79F5;
                 let z = Math.imul(t ^ (t >>> 15), t | 1);
                 z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
                 const rand = ((z ^ (z >>> 14)) >>> 0) / 4294967296;
                 
                 projection[j] += rand > 0.5 ? 1 : -1;
            }
        } else {
            i++;
        }
    }

    // Convert to Hex Signature
    let signature = "";
    let chunk = 0;
    for (let j = 0; j < dimension; j++) {
        const bit = projection[j] >= 0 ? 1 : 0;
        chunk = (chunk << 1) | bit;
        if ((j + 1) % 4 === 0) {
            signature += chunk.toString(16);
            chunk = 0;
        }
    }
    return signature.toUpperCase();
}

// 3. LOGICAL DENSITY (Zero-Allocation Logic)
export function calculateLogicDensity(text: string): number {
    const len = text.length;
    if (len === 0) return 0;
    
    // 1. Calculate Entropy (Approx) via unique char codes
    // Using a fixed size boolean array for ASCII/Hangul mapping is too big,
    // so we use a Set but optimize usage.
    const uniqueChars = new Set();
    for(let i=0; i<len; i++) {
        uniqueChars.add(text.charCodeAt(i));
    }
    
    const entropy = (uniqueChars.size / len) * Math.log2(len);
    
    // 2. Keyword Check (Fast Scan)
    // We assume keywords are short. Standard .includes is highly optimized in V8.
    const keywords = [
        '따라서', '그러므로', '왜냐하면', '결론적으로', '가정하면', 
        'because', 'therefore', 'implies', 'axiom', 'if', 'then', 'else',
        'define', 'assume', 'proof'
    ];
    
    let logicBoost = 0;
    const lowerText = text.toLowerCase(); 
    // Note: .toLowerCase() creates a new string, but it's unavoidable for case-insensitive match 
    // unless we implement a custom byte-level scanner, which is overkill here.
    
    for (const kw of keywords) {
        if (lowerText.includes(kw)) logicBoost += 0.1;
    }

    return Math.min(1.0, (entropy / 8) + logicBoost);
}

// 4. STANDARD VECTOR MATH
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    // Loop unrolling or simple iteration is fine for V8
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    return (magA === 0 || magB === 0) ? 0 : dot / (magA * magB);
}

export function jaccardSimilarity(arrA: string[], arrB: string[]): number {
    if (arrA.length === 0 || arrB.length === 0) return 0;
    const setA = new Set(arrA);
    let intersection = 0;
    const setBSize = arrB.length; 
    // Optimization: iterate smaller array? Set lookup is O(1).
    for(const item of arrB) {
        if (setA.has(item)) intersection++;
    }
    const union = setA.size + setBSize - intersection;
    return intersection / union;
}
