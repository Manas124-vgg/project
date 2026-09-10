import { useState, useRef, useEffect } from "react";
import { sendMessage, SystemTelemetryContext } from "../services/chatService";

interface ChatWidgetProps {
    telemetry?: SystemTelemetryContext;
}

const QUICK_PROMPTS = [
    "Current weather & wind conditions?",
    "Which iceberg is closest to our vessel?",
    "Assess safe corridors for navigation",
    "What AI models are used in PS 26059?",
];

export function ChatWidget({ telemetry }: ChatWidgetProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                background: "#0f172a",
                color: "#f1f5f9",
                boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
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
                    background: "#1e293b",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "20px" }}>🤖</span>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ fontSize: "14px", color: "#f8fafc" }}>PolarNav Assistant</strong>
                            <span style={{ fontSize: "10px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                PS 26059
                            </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#4ade80", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                            Live Telemetry Synced
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
                }}
            >
                {messages.length === 0 && (
                    <div style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", marginTop: 16 }}>
                        <p style={{ color: "#f8fafc", fontWeight: 600, marginBottom: 4 }}>Polar Decision Support Active</p>
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
                                background: m.from === "user" ? "linear-gradient(135deg, #0284c7, #2563eb)" : "#1e293b",
                                color: "#f8fafc",
                                padding: "9px 13px",
                                borderRadius: 12,
                                display: "inline-block",
                                maxWidth: "85%",
                                fontSize: "13px",
                                lineHeight: "1.5",
                                textAlign: "left",
                                border: m.from === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
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
                <div style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 6, background: "rgba(15,23,42,0.8)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(prompt)}
                            style={{
                                background: "#1e293b",
                                color: "#38bdf8",
                                border: "1px solid rgba(56,189,248,0.25)",
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
                    background: "#1e293b",
                    gap: 8,
                }}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about live ice, weather, ship status..."
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: "9px 12px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        background: "#0f172a",
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