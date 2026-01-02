// API URL configuration
// Uses environment variable for development/production switching
export const API_URL = process.env.PLASMO_PUBLIC_API_URL || "https://kitch.pl"

// WebSocket URL - separate from API_URL because backend runs on different port
export const WS_URL =
    process.env.PLASMO_PUBLIC_WS_URL || "wss://kitch.pl/"