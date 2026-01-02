import type { KickChannel } from "../types/twitchTypes"

interface WebSocketMessage {
    type: "stream_live" | "stream_offline"
    data: KickChannel | { slug: string }
}

type MessageCallback = (message: WebSocketMessage) => void
type ReconnectCallback = () => void
type ErrorCallback = (error: Event) => void

export class KickWebSocketManager {
    private ws: WebSocket | null = null
    private reconnectTimer: NodeJS.Timeout | null = null
    private messageCallbacks: MessageCallback[] = []
    private reconnectCallbacks: ReconnectCallback[] = []
    private errorCallbacks: ErrorCallback[] = []
    private streamers: string[] = []
    private wsUrl: string
    private isManualDisconnect: boolean = false
    private reconnectAttempts: number = 0
    private maxReconnectAttempts: number = 10

    constructor(wsUrl: string) {
        console.log(wsUrl)
        this.wsUrl = wsUrl
    }

    /**
     * Łączy się z WebSocket serverem
     * @param streamers - lista nazw streamerów do śledzenia
     */
    connect(streamers: string[]): void {
        if (streamers.length === 0) {
            console.log("No streamers to track, skipping WebSocket connection")
            return
        }

        this.streamers = streamers
        this.isManualDisconnect = false

        // Jeśli już jest połączenie, zamknij je
        if (this.ws) {
            this.ws.close()
        }

        try {
            // Buduj URL z query params w formacie ?streamers=name1,name2,name3
            const streamersParam = streamers
                .map((s) => encodeURIComponent(s.toLowerCase()))
                .join(",")
            const url = `${this.wsUrl}/ws?streamers=${streamersParam}`

            console.log(`Connecting to WebSocket: ${url}`)
            this.ws = new WebSocket(url)

            this.ws.onopen = () => {
                console.log("WebSocket connected")
                this.reconnectAttempts = 0
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage
                    console.log("WebSocket message received:", message.type)

                    // Wywołaj wszystkie zarejestrowane callbacki
                    this.messageCallbacks.forEach((callback) => {
                        try {
                            callback(message)
                        } catch (error) {
                            console.error("Error in message callback:", error)
                        }
                    })
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error)
                }
            }

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error)
                this.errorCallbacks.forEach((callback) => {
                    try {
                        callback(error)
                    } catch (err) {
                        console.error("Error in error callback:", err)
                    }
                })
            }

            this.ws.onclose = (event) => {
                console.log("WebSocket closed:", event.code, event.reason)
                this.ws = null

                // Jeśli to nie było manualne zamknięcie i nie przekroczono limitu prób
                if (
                    !this.isManualDisconnect &&
                    this.reconnectAttempts < this.maxReconnectAttempts
                ) {
                    this.scheduleReconnect()
                } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error(
                        `Max reconnect attempts (${this.maxReconnectAttempts}) reached`
                    )
                }
            }
        } catch (error) {
            console.error("Error creating WebSocket:", error)
            if (!this.isManualDisconnect) {
                this.scheduleReconnect()
            }
        }
    }

    /**
     * Planuje ponowne połączenie po 5 sekundach
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
        }

        this.reconnectAttempts++
        const delay = 5000 // 5 sekund

        console.log(
            `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        )

        this.reconnectTimer = setTimeout(() => {
            console.log("Attempting to reconnect...")
            this.connect(this.streamers)

            // Wywołaj callbacki reconnect
            this.reconnectCallbacks.forEach((callback) => {
                try {
                    callback()
                } catch (error) {
                    console.error("Error in reconnect callback:", error)
                }
            })
        }, delay)
    }

    /**
     * Zamyka połączenie WebSocket
     */
    disconnect(): void {
        this.isManualDisconnect = true

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        if (this.ws) {
            this.ws.close()
            this.ws = null
        }

        console.log("WebSocket manually disconnected")
    }

    /**
     * Rejestruje callback dla wiadomości
     */
    onMessage(callback: MessageCallback): void {
        this.messageCallbacks.push(callback)
    }

    /**
     * Rejestruje callback dla reconnect
     */
    onReconnect(callback: ReconnectCallback): void {
        this.reconnectCallbacks.push(callback)
    }

    /**
     * Rejestruje callback dla błędów
     */
    onError(callback: ErrorCallback): void {
        this.errorCallbacks.push(callback)
    }

    /**
     * Sprawdza czy WebSocket jest połączony
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }

    /**
     * Czyści wszystkie callbacki
     */
    clearCallbacks(): void {
        this.messageCallbacks = []
        this.reconnectCallbacks = []
        this.errorCallbacks = []
    }
}

