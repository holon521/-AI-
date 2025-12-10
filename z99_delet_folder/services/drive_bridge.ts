
// ZIA GOOGLE DRIVE BRIDGE v1.5 (STABLE AUTH)
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
                // [CRITICAL] Request Full Drive Scope AND Cloud Platform for future expansion
                scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/cloud-platform', 
                callback: (tokenResponse: any) => {
                    this.accessToken = tokenResponse.access_token;
                    callback(tokenResponse);
                    this.ensureSystemFolder(); // Create workspace folder on login
                },
            });
        }
    }

    public login() {
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken();
        } else {
            alert("Please set Google Client ID in Settings first.");
        }
    }

    // Developer Bypass: Manually set token (Async & Safe)
    public async setManualToken(token: string, callback: () => void) {
        if (!token) throw new Error("Token is empty.");

        // [FIX] Simple Sanitization: Just trim whitespace.
        // Regex removal was causing issues with valid token characters.
        let cleanToken = token.trim();
        
        // Remove 'Bearer ' prefix if user copied it (Case Insensitive)
        if (cleanToken.toLowerCase().startsWith('bearer ')) {
            cleanToken = cleanToken.slice(7).trim();
        }
        
        this.accessToken = cleanToken;
        
        console.log(`[DriveBridge] Verifying Token (Prefix: ${cleanToken.substring(0,4)}...)`);
        
        try {
            await this.ensureSystemFolder();
            callback(); // Only call callback if connection is verified
            console.log("[DriveBridge] Connection Verified.");
        } catch (e: any) {
            console.error("[DriveBridge] Verification Failed:", e);
            throw e; // Pass detailed error to UI
        }
    }

    public getStatus(): DriveAuthStatus {
        return {
            isAuthenticated: !!this.accessToken,
            accessToken: this.accessToken,
            userEmail: null 
        };
    }

    // 2. File System Operations (The Bridge)
    
    // Ensure the root folder exists
    private async ensureSystemFolder() {
        if (!this.accessToken) throw new Error("No Access Token");
        
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
        } catch (e: any) {
            console.error("[Drive] Failed to ensure system folder.", e);
            throw e; 
        }
    }

    // Write a JSON file (Memory or Command)
    public async saveFile(fileName: string, content: object) {
        if (!this.accessToken) throw new Error("Not Connected");
        
        // Auto-recovery: If folderId is missing, try to find it once
        if (!this.folderId) {
            console.warn("[Drive] Folder ID missing, attempting recovery...");
            await this.ensureSystemFolder();
        }

        if (!this.folderId) throw new Error("System Folder '_ZIA_HOLON_WORLD' not found.");

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
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` }), // Use standard Headers
            body: form
        });
        
        if (!res.ok) {
             const errText = await res.text();
             throw new Error(`Save Failed (${res.status}): ${errText}`);
        }
        
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
        
        // For downloading media, we use a simple fetch because 'alt=media' behaves differently
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    }

    // New: Delete a file
    public async deleteFile(fileId: string) {
        if (!this.accessToken) return;
        
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        if (!res.ok) throw new Error(res.statusText);
    }

    // Helper: GET
    private async fetchDriveAPI(endpoint: string) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            headers: new Headers({ 'Authorization': `Bearer ${this.accessToken}` })
        });
        
        if (!res.ok) {
            let errorMessage = `Google API Error (${res.status})`;
            try {
                const errJson = await res.json();
                
                // Specific Error Handling
                if (res.status === 401) {
                    errorMessage = "Invalid Token (401). Check whitespace or expiry.";
                } else if (res.status === 403) {
                    errorMessage = "Insufficient Permission (403). Ensure 'Full Drive Access' scope.";
                } else if (errJson.error && errJson.error.message) {
                    errorMessage += `: ${errJson.error.message}`;
                }
            } catch (e) {
                const errText = await res.text();
                errorMessage += `: ${errText}`;
            }
            throw new Error(errorMessage);
        }
        return await res.json();
    }

    // Helper: POST (Metadata only)
    private async postDriveAPI(endpoint: string, body: object) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            method: 'POST',
            headers: new Headers({ 
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(body)
        });
        
        if (!res.ok) {
            let errorMessage = `Google API Error (${res.status})`;
            try {
                const errJson = await res.json();
                if (errJson.error && errJson.error.message) {
                    errorMessage += `: ${errJson.error.message}`;
                }
            } catch (e) {
                const errText = await res.text();
                errorMessage += `: ${errText}`;
            }
            throw new Error(errorMessage);
        }
        return await res.json();
    }
}

export const driveBridge = new DriveBridge();
