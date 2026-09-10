import { GoogleGenAI } from "@google/genai";
import { VesselTelemetry, EnvironmentalCondition, Iceberg, RouteCorridor } from "../types";

const apiKey =
    (typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY
        : undefined) ||
    (typeof process !== "undefined" && process.env ? process.env.GEMINI_API_KEY : undefined) ||
    "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_PROMPT = `You are the AI Decision Support Assistant for our Smart India Hackathon (SIH) project: 
"AI-enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System" (Problem Statement 26059).

Your roles:
1. Provide crisp, professional mission-control style situational awareness and navigation advice.
2. When asked about current ship location, weather, iceberg threats, or routes, ALWAYS use the provided real-time situational data.
3. If asked about project details, explain our AI models (PINNs for iceberg drift, U-Net for SAR sea-ice segmentation, Dijkstra/A* for safe navigational corridors).
4. Keep answers informative, concise, and nautical in tone.`;

export interface SystemTelemetryContext {
    vessel?: VesselTelemetry;
    environment?: EnvironmentalCondition;
    icebergs?: Iceberg[];
    corridors?: RouteCorridor[];
}

function formatTelemetryContext(ctx?: SystemTelemetryContext): string {
    if (!ctx) return "";

    const parts: string[] = [];

    if (ctx.vessel) {
        parts.push(`VESSEL TELEMETRY:
- Name: ${ctx.vessel.name} (${ctx.vessel.callSign}, Ice Class: ${ctx.vessel.iceClass})
- Operational State: ${ctx.vessel.operationalState}
- Speed: ${ctx.vessel.speedKnots} knots | Heading: ${ctx.vessel.heading}°
- Position: Lat ${ctx.vessel.position.lat}, Lon ${ctx.vessel.position.lon}
- Destination: ${ctx.vessel.destination} (ETA: ${ctx.vessel.etaHours}h, Remaining: ${ctx.vessel.distanceRemainingNm} NM)
- Hull Strain: ${ctx.vessel.hullStrainPercent}% | Fuel: ${ctx.vessel.fuelRemainingPercent}% | Engine Load: ${ctx.vessel.engineLoadPercent}%`);
    }

    if (ctx.environment) {
        parts.push(`LIVE METEOROLOGICAL & OCEAN CONDITIONS:
- Sea Ice Coverage: ${ctx.environment.seaIceCoveragePct}% (${ctx.environment.seaIceStatus}) | Avg Thickness: ${ctx.environment.seaIceThicknessM}m
- Air Temp: ${ctx.environment.airTempC}°C | Sea Temp: ${ctx.environment.waterTempC}°C
- Wind: ${ctx.environment.windSpeedKn} knots (${ctx.environment.windDir}), Gusts: ${ctx.environment.windGustKn} knots
- Ocean Current: ${ctx.environment.oceanCurrentSpeedKn} knots (${ctx.environment.oceanCurrentDir})
- Visibility: ${ctx.environment.visibilityKm} km (${ctx.environment.visibilityStatus})
- Barometric Pressure: ${ctx.environment.barometricPressureHpa} hPa | Freeze-Up Risk: ${ctx.environment.freezeUpRisk}`);
    }

    if (ctx.icebergs && ctx.icebergs.length > 0) {
        const bergLines = ctx.icebergs.map(b => 
            `  * [${b.code}] ${b.name}: ${b.distanceNm} NM away (${b.latDisplay}, ${b.lonDisplay}), Hazard: ${b.hazardLevel.toUpperCase()}, Drift: ${b.driftSpeedKnots} kn @ ${b.driftHeadingDeg}°, Dimensions: ${b.dimensions}, Draft: ${b.draftM}m`
        ).join("\n");
        parts.push(`ACTIVE RADAR & SATELLITE ICEBERG TARGETS (${ctx.icebergs.length} tracked):\n${bergLines}`);
    }

    if (ctx.corridors && ctx.corridors.length > 0) {
        const corridorLines = ctx.corridors.map(c => 
            `  * ${c.name} (${c.status}): ${c.distanceNm} NM, ETA: ${c.etaFormatted}, Fuel: ${c.fuelConsumptionPct}%, Risk: ${c.riskScore}, Ice: ${c.packIceThicknessAvg}m`
        ).join("\n");
        parts.push(`ACTIVE NAVIGATION CORRIDORS:\n${corridorLines}`);
    }

    return `\n\n--- CURRENT REAL-TIME SITUATIONAL DATA ---\n${parts.join("\n\n")}\n------------------------------------------\nUse these exact real-time numbers and status when answering questions about current weather, positions, drift forecasts, risks, or ship telemetry.`;
}

let chatHistory: { role: string; parts: { text: string }[] }[] = [];

export async function sendMessage(userMessage: string, context?: SystemTelemetryContext): Promise<string> {
    try {
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

        const dynamicInstruction = SYSTEM_PROMPT + formatTelemetryContext(context);

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: chatHistory,
            config: { systemInstruction: dynamicInstruction },
        });

        const reply = response.text ?? "Sorry, I couldn't generate a response.";
        chatHistory.push({ role: "model", parts: [{ text: reply }] });
        return reply;
    } catch (error: any) {
        console.error("Gemini API error:", error);
        return "I'm having trouble connecting to the AI service right now. Please check your Gemini API key.";
    }
}