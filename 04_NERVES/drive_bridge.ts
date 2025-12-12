
// ZIA GOOGLE DRIVE BRIDGE v3.0 (ACTIVE NERVOUS SYSTEM)
// [LOCATION]: 03_NERVES/drive_bridge.ts
// [v3.0] Implements Active Polling Pulse & Event Emitters. Replaces passive API usage.

export interface DriveAuthStatus {
    isAuthenticated: boolean;
    accessToken: string | null;
    userEmail: string | null;
}

export type BridgeEventType = 'STATUS' | 'RESULT' | 'ERROR';
export interface BridgeEvent {
    type: BridgeEventType;
    payload: any;
}
type BridgeListener = (event: BridgeEvent) => void;

export class DriveBridge {
    private tokenClient: any = null;
    private accessToken: string | null = null;
    private folderId: string | null = null;
    
    // [ACTIVE PULSE]
    private listeners: BridgeListener[] = [];
    private pulseInterval: any = null;
    private isPulsing = false;
    private lastHeartbeat = 0;

    constructor() {}

    // --- NERVOUS SYSTEM (EVENTS) ---
    public subscribe(listener: BridgeListener): () => void {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    private emit(type: BridgeEventType, payload: any) {
        this.listeners.forEach(l => l({ type, payload }));
    }

    // --- PULSE LOOP (THE HEART) ---
    public startPulse(intervalMs = 2000) {
        if (this.isPulsing) return;
        this.isPulsing = true;
        console.log("[DriveBridge] 💓 Pulse Started");
        
        this.pulseInterval = setInterval(async () => {
            if (!this.accessToken) return;
            try {
                // 1. Check System Health
                await this.checkSwarmStatus();
                // 2. Collect Reflexes (Results)
                await this.collectResults();
            } catch (e: any) {
                // Silent catch to prevent loop crash, but maybe emit critical errors
                if (e.message.includes('401')) {
                    this.emit('ERROR', { code: 401, message: "Token Expired" });
                    this.stopPulse();
                }
            }
        }, intervalMs);
    }

    public stopPulse() {
        this.isPulsing = false;
        if (this.pulseInterval) clearInterval(this.pulseInterval);
        console.log("[DriveBridge] 🛑 Pulse Stopped");
    }

    private async checkSwarmStatus() {
        if (!this.folderId) return; // Wait for initialization
        const files = await this.searchFiles("name = 'swarm_status.json' and trashed=false");
        
        if (files.length > 0) {
            const statusData = await this.getFileContent(files[0].id);
            this.emit('STATUS', {
                active: true,
                vectorCount: statusData.memory_count || 0,
                lastBeat: Date.now(),
                version: statusData.version
            });
            this.lastHeartbeat = Date.now();
        } else {
            // Check timeout locally
            if (Date.now() - this.lastHeartbeat > 8000) {
                this.emit('STATUS', { active: false, message: "Offline" });
            }
        }
    }

    private async collectResults() {
        // Find all result files
        const files = await this.searchFiles("name contains 'res_' and trashed=false");
        
        for (const file of files) {
            try {
                // Read Content
                const content = await this.getFileContent(file.id);
                // Consume (Delete) immediately to prevent re-processing
                await this.deleteFile(file.id);
                // Fire Synapse
                this.emit('RESULT', {
                    filename: file.name,
                    content: content
                });
            } catch (e) {
                console.warn(`[DriveBridge] Failed to process synapse: ${file.name}`, e);
            }
        }
    }

    // --- CORE API METHODS ---

    public init(clientId: string, callback: (response: any) => void) {
        if (!clientId) return;
        // @ts-ignore
        if (typeof google !== 'undefined' && google.accounts) {
            // @ts-ignore
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/cloud-platform', 
                callback: (tokenResponse: any) => {
                    this.accessToken = tokenResponse.access_token;
                    callback(tokenResponse);
                    this.ensureSystemFolder();
                },
            });
        }
    }

    public login() {
        if (this.tokenClient) { this.tokenClient.requestAccessToken(); } 
        else { alert("Please set Google Client ID in Settings first."); }
    }

    public getStatus(): DriveAuthStatus {
        return {
            isAuthenticated: !!this.accessToken,
            accessToken: this.accessToken,
            userEmail: null 
        };
    }

    public async setManualToken(token: string, callback: () => void) {
        if (!token) throw new Error("Token is empty.");
        let cleanToken = token.trim();
        if (cleanToken.toLowerCase().startsWith('bearer ')) {
            cleanToken = cleanToken.slice(7).trim();
        }
        this.accessToken = cleanToken;
        try {
            await this.ensureSystemFolder();
            callback();
        } catch (e: any) {
            this.accessToken = null;
            throw e;
        }
    }

    private async ensureSystemFolder() {
        if (!this.accessToken) throw new Error("No Access Token");
        try {
            const q = "mimeType='application/vnd.google-apps.folder' and name='_ZIA_HOLON_WORLD' and trashed=false";
            const res = await this.fetchDriveAPI(`files?q=${encodeURIComponent(q)}`);
            if (res.files && res.files.length > 0) {
                this.folderId = res.files[0].id;
            } else {
                const meta = { name: '_ZIA_HOLON_WORLD', mimeType: 'application/vnd.google-apps.folder' };
                const createRes = await this.postDriveAPI('files', meta);
                this.folderId = createRes.id;
            }
        } catch (e: any) { throw e; }
    }

    public async globalSearch(query: string, limit: number = 10) {
        if (!this.accessToken) return [];
        const q = `(name contains '${query}' or fullText contains '${query}') and trashed=false`;
        const res = await this.fetchDriveAPI(`files?q=${encodeURIComponent(q)}&pageSize=${limit}&fields=files(id,name,mimeType,modifiedTime,size)`);
        return res.files || [];
    }

    public async readTextFile(fileId: string): Promise<string> {
        if (!this.accessToken) throw new Error("Not Connected");
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        if (!res.ok) {
            if (res.status === 401) this.accessToken = null;
            throw new Error(`Read Failed: ${res.statusText}`);
        }
        return await res.text();
    }

    public async saveFile(fileName: string, content: object) {
        if (!this.accessToken) throw new Error("Not Connected");
        if (!this.folderId) await this.ensureSystemFolder();

        const fileMetadata = { name: fileName, parents: [this.folderId], mimeType: 'application/json' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` }),
            body: form
        });
        if (!res.ok) {
            if (res.status === 401) {
                this.accessToken = null;
                this.emit('ERROR', { code: 401 });
            }
            throw new Error(`Save Failed (${res.status})`);
        }
        return await res.json();
    }

    public async searchFiles(queryFragment: string) {
        if (!this.accessToken) return [];
        let q = queryFragment;
        if (this.folderId) q = `(${q}) and '${this.folderId}' in parents`;
        const res = await this.fetchDriveAPI(`files?q=${encodeURIComponent(q)}`);
        return res.files || [];
    }

    public async getFileContent(fileId: string) {
        if (!this.accessToken) return null;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        if (!res.ok) {
            if (res.status === 401) this.accessToken = null;
            throw new Error(res.statusText);
        }
        return await res.json();
    }

    public async deleteFile(fileId: string) {
        if (!this.accessToken) return;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        if (!res.ok) {
            if (res.status === 401) this.accessToken = null;
            throw new Error(res.statusText);
        }
    }

    private async fetchDriveAPI(endpoint: string) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        if (!res.ok) {
            let msg = `Error ${res.status}`;
            if (res.status === 401) {
                this.accessToken = null;
                this.emit('ERROR', { code: 401 });
                msg = "Token Expired";
            }
            if (res.status === 403) msg = "Insufficient Scope";
            throw new Error(msg);
        }
        return await res.json();
    }

    private async postDriveAPI(endpoint: string, body: object) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            method: 'POST',
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }),
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            if (res.status === 401) this.accessToken = null;
            throw new Error(`Error ${res.status}`);
        }
        return await res.json();
    }
}
export const driveBridge = new DriveBridge();
