
// ZIA GOOGLE DRIVE BRIDGE v1.0
// [Specs: 07_AUTH_SECURITY.md]
// Implements "Drive-as-a-Bridge" pattern for persistent memory and Colab communication.

export interface DriveAuthStatus {
    isAuthenticated: boolean;
    accessToken: string | null;
    userEmail: string | null;
}

export class DriveBridge {
    private tokenClient: any = null;
    private accessToken: string | null = null;
    private folderId: string | null = null; // ID of '_ZIA_HOLON_WORLD' folder

    constructor() {}

    // 1. Initialize OAuth Client (GIS)
    public init(clientId: string, callback: (response: any) => void) {
        if (!clientId) return;
        
        // @ts-ignore
        if (typeof google !== 'undefined' && google.accounts) {
            // @ts-ignore
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file', // Minimal Scope
                callback: (tokenResponse: any) => {
                    this.accessToken = tokenResponse.access_token;
                    callback(tokenResponse);
                    this.ensureSystemFolder(); // Create workspace folder on login
                },
            });
        } else {
            console.error("Google GSI script not loaded.");
        }
    }

    public login() {
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken();
        } else {
            alert("Please set Google Client ID in Settings first.");
        }
    }

    // Developer Bypass: Manually set token
    public setManualToken(token: string, callback: () => void) {
        this.accessToken = token;
        console.log("[DriveBridge] Manual Token Set. Bypassing OAuth flow.");
        this.ensureSystemFolder();
        callback();
    }

    public getStatus(): DriveAuthStatus {
        return {
            isAuthenticated: !!this.accessToken,
            accessToken: this.accessToken,
            userEmail: null // Email requires different scope, keeping it minimal for now
        };
    }

    // 2. File System Operations (The Bridge)
    
    // Ensure the root folder exists
    private async ensureSystemFolder() {
        if (!this.accessToken) return;
        
        try {
            // Check if exists
            const q = "mimeType='application/vnd.google-apps.folder' and name='_ZIA_HOLON_WORLD' and trashed=false";
            const res = await this.fetchDriveAPI(`files?q=${encodeURIComponent(q)}`);
            
            if (res.files && res.files.length > 0) {
                this.folderId = res.files[0].id;
                console.log("[Drive] Found System Folder:", this.folderId);
            } else {
                // Create
                const meta = {
                    name: '_ZIA_HOLON_WORLD',
                    mimeType: 'application/vnd.google-apps.folder'
                };
                const createRes = await this.postDriveAPI('files', meta);
                this.folderId = createRes.id;
                console.log("[Drive] Created System Folder:", this.folderId);
            }
        } catch (e) {
            console.error("[Drive] Failed to ensure system folder. Token might be invalid.", e);
            alert("Failed to connect to Drive. Check if your Access Token is valid and has 'drive.file' scope.");
        }
    }

    // Write a JSON file (Memory or Command)
    public async saveFile(fileName: string, content: object) {
        if (!this.accessToken || !this.folderId) return;

        const fileMetadata = {
            name: fileName,
            parents: [this.folderId],
            mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
            body: form
        });
        
        return await res.json();
    }

    // New: Search files in the system folder
    public async searchFiles(queryFragment: string) {
        if (!this.accessToken) return [];

        let q = queryFragment;
        if (this.folderId) {
            q = `(${q}) and '${this.folderId}' in parents`;
        }

        const res = await this.fetchDriveAPI(`files?q=${encodeURIComponent(q)}`);
        return res.files || [];
    }

    // New: Get file content (download and parse JSON)
    public async getFileContent(fileId: string) {
        if (!this.accessToken) return null;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    }

    // New: Delete a file
    public async deleteFile(fileId: string) {
        if (!this.accessToken) return;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        if (!res.ok) throw new Error(res.statusText);
    }

    // Helper: GET
    private async fetchDriveAPI(endpoint: string) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    }

    // Helper: POST (Metadata only)
    private async postDriveAPI(endpoint: string, body: object) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    }
}

export const driveBridge = new DriveBridge();
