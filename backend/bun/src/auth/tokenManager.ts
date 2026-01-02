/**
 * Centralized Kick API token manager
 * Ensures all modules use the same token and updates are shared globally
 */
class TokenManager {
    private token: string
    private clientId: string
    private clientSecret: string

    constructor() {
        this.token = process.env.KICK_API_KEY || ""
        this.clientId = process.env.KICK_CLIENT_ID || ""
        this.clientSecret = process.env.KICK_CLIENT_SECRET || ""
    }

    getToken(): string {
        return this.token
    }

    getClientId(): string {
        return this.clientId
    }

    getClientSecret(): string {
        return this.clientSecret
    }

    updateToken(newToken: string): void {
        if (newToken && newToken !== this.token) {
            console.log("Token updated globally")
            this.token = newToken
        }
    }

    getCredentials() {
        return {
            token: this.token,
            clientId: this.clientId,
            clientSecret: this.clientSecret
        }
    }
}

// Export singleton instance
export const tokenManager = new TokenManager()

