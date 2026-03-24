import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
    const clientRef = useRef(null);
    const listenersRef = useRef(new Set());
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const client = new Client({
            brokerURL: `ws://localhost:8080/ws?token=${token}`,
            reconnectDelay: 3000,
            onConnect: () => {
                console.log("✅ WebSocket connected");
                setConnected(true);
                client.subscribe("/user/queue/battle", (msg) => {
                    const data = JSON.parse(msg.body);
                    console.log("📨 Raw WS received:", data);
                    // ✅ call all listeners with latest data
                    listenersRef.current.forEach((fn) => fn(data));
                });
            },
            onDisconnect: () => {
                console.log("WebSocket disconnected");
                setConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;
        return () => client.deactivate();
    }, []);

    const subscribe = useCallback((fn) => {
        listenersRef.current.add(fn);
        return () => listenersRef.current.delete(fn);
    }, []);

    const sendChallenge = useCallback((friendId) => {
        console.log("📤 Sending challenge to friendId:", friendId);
        clientRef.current?.publish({
            destination: "/app/challenge.send",
            body: String(friendId),
        });
    }, []);

    const acceptChallenge = useCallback((challengerId) => {
        console.log("✅ Accepting challenge from:", challengerId);
        clientRef.current?.publish({
            destination: "/app/challenge.accept",
            body: String(challengerId),
        });
    }, []);

    const declineChallenge = useCallback((challengerId) => {
        clientRef.current?.publish({
            destination: "/app/challenge.decline",
            body: String(challengerId),
        });
    }, []);

    return (
        <WebSocketContext.Provider value={{
            connected,
            subscribe,
            sendChallenge,
            acceptChallenge,
            declineChallenge,
        }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket(onMessage) {
    const ctx = useContext(WebSocketContext);
    const callbackRef = useRef(onMessage);

    // ✅ always keep ref pointing to latest callback
    // without this, navigate and setState inside the callback are stale
    useEffect(() => {
        callbackRef.current = onMessage;
    });

    useEffect(() => {
        if (!ctx?.subscribe) return;
        // ✅ subscribe with a stable wrapper that always calls the latest callback
        const unsub = ctx.subscribe((data) => {
            callbackRef.current?.(data);
        });
        return unsub;
    }, [ctx?.subscribe]);

    return ctx;
}