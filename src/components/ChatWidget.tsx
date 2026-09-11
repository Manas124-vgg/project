import { useState, useRef, useEffect } from "react";
import { sendMessage, SystemTelemetryContext } from "../services/chatService";
import { getCurrentUser } from "../services/authService";

interface ChatWidgetProps {
    telemetry?: SystemTelemetryContext;
}

const CHAT_STORAGE_KEY = "polarnav-chat-history";

// Conversation survives reloads, not just open/close cycles
function loadStoredMessages(): { from: "user" | "bot"; text: string }[] {
    try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

const QUICK_PROMPTS = [
    "Rank the top iceberg threats right now",
    "Current weather & wind conditions?",
    "Assess safe corridors for navigation",
    "What AI models are used in PS 26059?",
];

export function ChatWidget({ telemetry }: ChatWidgetProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>(loadStoredMessages);
    const officer = getCurrentUser();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        // Persist the conversation so it survives reloads
        try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
        } catch {
            /* storage full/blocked — chat still works in-memory */
        }
    }, [messages, open]);

    const handleSend = async (textToSend?: string) => {
        const text = (textToSend ?? input).trim();
        if (!text || loading) return;

        setMessages((m) => [...m, { from: "user", text }]);
        if (!textToSend) setInput("");
        setLoading(true);

        try {
            const reply = await sendMessage(text, telemetry);
            setMessages((m) => [...m, { from: "bot", text: reply }]);
        } catch {
            setMessages((m) => [...m, { from: "bot", text: "Something went wrong. Please check connection." }]);
        }
        setLoading(false);
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    background: "linear-gradient(135deg, #0284c7, #2563eb)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "50px",
                    padding: "12px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                💬 Ask AI Assistant
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
            </button>
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                width: 380,
                maxWidth: "calc(100vw - 32px)",
                height: 520,
                maxHeight: "85vh",
                border: "1px solid rgba(196,219,255,0.22)",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                color: "#f1f5f9",
                background: "rgba(14, 22, 42, 0.72)",
                backdropFilter: "blur(22px) saturate(1.4)",
                WebkitBackdropFilter: "blur(22px) saturate(1.4)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
                zIndex: 9999,
                overflow: "hidden",
                fontFamily: "inherit",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(30, 41, 59, 0.65)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "20px" }}>🧊</span>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ fontSize: "14px", color: "#f8fafc" }}>POLARIS Assistant</strong>
                            <span style={{ fontSize: "10px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                PS 26059
                            </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#4ade80", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                            {telemetry?.icebergs?.length ?? 0} bergs tracked · telemetry live
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setOpen(false)}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "4px 8px",
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Message Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    background: "rgba(10, 16, 32, 0.55)",
                }}
            >
                {messages.length === 0 && (
                    <div style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", marginTop: 16 }}>
                        <p style={{ color: "#f8fafc", fontWeight: 600, marginBottom: 4 }}>
                            {officer ? `Welcome aboard, ${officer.name.split(' ')[0]}` : "Polar Decision Support Active"}
                        </p>
                        <p>Ask about live ice conditions, weather, iceberg proximity, or navigation corridors.</p>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div
                        key={i}
                        style={{
                            textAlign: m.from === "user" ? "right" : "left",
                        }}
                    >
                            <span
                            style={{
                                background: m.from === "user" ? "linear-gradient(135deg, #0284c7, #2563eb)" : "rgba(148, 180, 235, 0.12)",
                                color: "#f8fafc",
                                padding: "9px 13px",
                                borderRadius: 12,
                                display: "inline-block",
                                maxWidth: "85%",
                                fontSize: "13px",
                                lineHeight: "1.5",
                                textAlign: "left",
                                border: m.from === "user" ? "none" : "1px solid rgba(196, 219, 255, 0.22)",
                                backdropFilter: m.from === "user" ? "none" : "blur(12px)",
                                WebkitBackdropFilter: m.from === "user" ? "none" : "blur(12px)",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            {m.text}
                        </span>
                    </div>
                ))}

                {loading && (
                    <div style={{ color: "#38bdf8", fontSize: "12px", fontStyle: "italic", display: "flex", alignItems: "center", gap: 6, paddingLeft: 4 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", animation: "ping 1s infinite" }} />
                        Analyzing real-time mission telemetry...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts (visible when few messages) */}
            {messages.length <= 2 && !loading && (
                <div style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 6, background: "rgba(148,180,235,0.08)", borderTop: "1px solid rgba(196,219,255,0.12)" }}>
                    {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(prompt)}
                            style={{
                                background: "rgba(148,180,235,0.12)",
                                color: "#6ddcff",
                                border: "1px solid rgba(109,220,255,0.3)",
                                borderRadius: 20,
                                padding: "4px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Bar */}
            <div
                style={{
                    display: "flex",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    padding: 10,
                    background: "rgba(30, 41, 59, 0.65)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    gap: 8,
                }}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about ice threats, weather, corridors..."
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: "9px 12px",
                        border: "1px solid rgba(196,219,255,0.2)",
                        borderRadius: 8,
                        background: "rgba(10, 16, 32, 0.6)",
                        color: "#f8fafc",
                        fontSize: "13px",
                        outline: "none",
                    }}
                />
                <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    style={{
                        background: "linear-gradient(135deg, #0284c7, #2563eb)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        opacity: loading || !input.trim() ? 0.5 : 1,
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatWidget;