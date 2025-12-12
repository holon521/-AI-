
// ZIA GOOGLE DRIVE BRIDGE v2.1 (FILE SYSTEM DRIVER)
// [LOCATION]: 03_NERVES/drive_bridge.ts
// [v2.1] Added 401 Token Expiry Handling & getStatus()

export interface DriveAuthStatus {
    isAuthenticated: boolean;
    accessToken: string | null;
    userEmail: string | null;
}

export class DriveBridge {
    private tokenClient: any = null;
    private accessToken: string | null = null;
    private folderId: string | null = null;

    constructor() {}

    public init(clientId: string, callback: (response: any) => void) {
        if (!clientId) return;
        // @ts-ignore
        if (typeof google !== 'undefined' && google.accounts) {
            // @ts-ignore
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                // Requesting FULL Drive access to act as an OS File System
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
        if (token.startsWith('AIza')) throw new Error("This looks like an API Key. Please use the OAuth Access Token.");

        let cleanToken = token.trim();
        if (cleanToken.toLowerCase().startsWith('bearer ')) {
            cleanToken = cleanToken.slice(7).trim();
        }
        this.accessToken = cleanToken;
        try {
            await this.ensureSystemFolder();
            callback();
        } catch (e: any) {
            this.accessToken = null; // Clear invalid token immediately
            console.error("[DriveBridge] Verification Failed:", e);
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

    // --- FILE SYSTEM OPERATIONS (OS LEVEL) ---

    // [NEW] Global Search (Not restricted to system folder)
    public async globalSearch(query: string, limit: number = 10) {
        if (!this.accessToken) return [];
        // Search in name or fullText, exclude trashed
        const q = `(name contains '${query}' or fullText contains '${query}') and trashed=false`;
        const res = await this.fetchDriveAPI(`files?q=${encodeURIComponent(q)}&pageSize=${limit}&fields=files(id,name,mimeType,modifiedTime,size)`);
        return res.files || [];
    }

    // [NEW] Read Any Text File
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

    // System Folder Operations (Swarm/Memory)
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
            if (res.status === 401) this.accessToken = null;
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
                msg = "Token Expired (401). Please refresh in Settings.";
            }
            if (res.status === 403) msg = "Insufficient Scope (403). Need 'drive' scope.";
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
