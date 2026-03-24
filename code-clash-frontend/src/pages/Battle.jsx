import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box, Typography, Select, MenuItem, FormControl,
    Divider, CircularProgress, Tabs, Tab
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import TimerIcon from "@mui/icons-material/Timer";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import Editor from "@monaco-editor/react";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Layout from "./Layout";
import api from "../api/axios";
import { useWebSocket } from "../hooks/useWebSocket";

const LANGUAGES = [
    { id: 71, label: "Python 3" },
    { id: 62, label: "Java" },
    { id: 63, label: "JavaScript" },
    { id: 54, label: "C++" },
];

const DEFAULT_CODE = {
    71: "# Write your solution here\n",
    62: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}",
    63: "// Write your solution here\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n",
    54: "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Write your solution here\n    return 0;\n}",
};

export default function Battle() {
    const { state: routeState } = useLocation();
    const navigate = useNavigate();

    // ✅ fallback to sessionStorage if navigated directly
    const state = routeState || (() => {
        try { return JSON.parse(sessionStorage.getItem("battleState") || "null"); }
        catch { return null; }
    })();

    // ✅ save state to sessionStorage whenever we have it
    useEffect(() => {
        if (routeState?.roomId) {
            sessionStorage.setItem("battleState", JSON.stringify(routeState));
        }
    }, [routeState]);
    const [code, setCode] = useState(DEFAULT_CODE[71]);
    const [languageId, setLanguageId] = useState(71);
    const [result, setResult] = useState(null);
    const [runResult, setRunResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [running, setRunning] = useState(false);
    const [battleEnd, setBattleEnd] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [opponentSubmitted, setOpponentSubmitted] = useState(false);
    const [leftTab, setLeftTab] = useState(0); // 0=problem, 1=testcases
    const [customInput, setCustomInput] = useState("");
    const [exitConfirm, setExitConfirm] = useState(false);
    const [forfeiting, setForfeiting] = useState(false);

    // parse test cases from problem
    const testCases = (() => {
        try {
            return JSON.parse(state?.problem?.testCases || "[]");
        } catch { return []; }
    })();

    useEffect(() => {
        if (!state?.roomId) {
            const timer = setTimeout(() => navigate("/home"), 100);
            return () => clearTimeout(timer);
        }
    }, [state]);

    useEffect(() => {
        if (battleEnd) return;
        if (timeLeft <= 0) {
            setBattleEnd({ result: "TIMEOUT", winner: "No one" });
            return;
        }
        const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft, battleEnd]);

    useWebSocket((data) => {
        const type = data.type || data.status;
        if (type === "BATTLE_END") setBattleEnd(data);
        if (type === "OPPONENT_SUBMITTED") setOpponentSubmitted(true);
    });

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleLanguageChange = (newLang) => {
        setLanguageId(newLang);
        setCode(DEFAULT_CODE[newLang]);
    };

    // ✅ Run code against custom input only (not test cases)
    const runCode = async () => {
        setRunning(true);
        setRunResult(null);
        try {
            const res = await api.post("/compile", {
                code,
                languageId,
                stdin: customInput,
            });
            setRunResult(res.data);
        } catch (e) {
            setRunResult({ status: "ERROR", stderr: "Run failed. Check your code." });
        } finally {
            setRunning(false);
        }
    };

    // ✅ Submit runs against all test cases
    const submit = async () => {
        setSubmitting(true);
        setResult(null);
        try {
            const res = await api.post("/submit", {
                roomId: state.roomId,
                code,
                languageId,
            });
            setResult(res.data);
        } catch (e) {
            setResult({ status: "ERROR", reason: "Submission failed. Try again." });
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ Forfeit — opponent wins, ratings updated server-side
    const forfeit = async () => {
        setForfeiting(true);
        try {
            await api.post("/battle/forfeit", { roomId: state.roomId });
        } catch (e) {
            // server will broadcast BATTLE_END via WS regardless
        } finally {
            setForfeiting(false);
            setExitConfirm(false);
        }
    };

    const diffColor = {
        EASY: { bg: "#0d2a1a", border: "#4ade8033", text: "#4ade80" },
        MEDIUM: { bg: "#2a1a0d", border: "#fb923c33", text: "#fb923c" },
        HARD: { bg: "#2a0d0d", border: "#f8717133", text: "#f87171" },
    };
    const diff = diffColor[state?.problem?.difficulty] || diffColor.EASY;

    // ✅ don't render blank white page while waiting for state
    if (!state?.roomId) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: "#444", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
                    Loading battle...
                </Typography>
            </Box>
        );
    }

    return (
        <Layout fullscreen>

            {/* Battle End Overlay */}
            {battleEnd && (
                <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                    <Box sx={{ bgcolor: "#161616", border: "0.5px solid #2a2a2a", borderRadius: "20px", p: "40px 48px", textAlign: "center", minWidth: 340 }}>
                        {battleEnd.result === "WIN"
                            ? <EmojiEventsIcon sx={{ fontSize: 56, color: "#f59e0b", mb: 2 }} />
                            : battleEnd.result === "TIMEOUT"
                                ? <TimerIcon sx={{ fontSize: 56, color: "#6366f1", mb: 2 }} />
                                : <SentimentVeryDissatisfiedIcon sx={{ fontSize: 56, color: "#6b7280", mb: 2 }} />
                        }
                        <Typography sx={{ fontSize: "28px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif", mb: "8px" }}>
                            {battleEnd.result === "WIN" ? "You Win! 🎉"
                                : battleEnd.result === "TIMEOUT" ? "Time's Up!"
                                    : battleEnd.result === "FORFEIT" ? "Opponent Forfeited"
                                        : "You Lose"}
                        </Typography>

                        {/* Forfeit sub-label */}
                        {battleEnd.result === "FORFEIT" && (
                            <Typography sx={{ fontSize: "13px", color: "#fb923c", fontFamily: "'Inter', sans-serif", mb: "6px" }}>
                                {battleEnd.winner === battleEnd.you ? `${battleEnd.forfeiter} surrendered — you win!` : "You surrendered the match."}
                            </Typography>
                        )}

                        {battleEnd.winner && battleEnd.result !== "TIMEOUT" && battleEnd.result !== "FORFEIT" && (
                            <Typography sx={{ fontSize: "14px", color: "#555", fontFamily: "'Inter', sans-serif", mb: "6px" }}>
                                Winner: <Box component="span" sx={{ color: "#aaa" }}>{battleEnd.winner}</Box>
                            </Typography>
                        )}

                        {/* Rating change badge */}
                        {battleEnd.ratingDelta !== undefined && (
                            <Box sx={{
                                display: "inline-flex", alignItems: "center", gap: "5px",
                                bgcolor: battleEnd.ratingDelta > 0 ? "#0d2a1a" : "#2a0d0d",
                                border: `0.5px solid ${battleEnd.ratingDelta > 0 ? "#4ade8044" : "#f8717144"}`,
                                borderRadius: "8px", px: "14px", py: "6px", mt: "4px", mb: "20px",
                            }}>
                                {battleEnd.ratingDelta > 0
                                    ? <TrendingUpIcon sx={{ fontSize: 15, color: "#4ade80" }} />
                                    : <TrendingDownIcon sx={{ fontSize: 15, color: "#f87171" }} />
                                }
                                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: battleEnd.ratingDelta > 0 ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif" }}>
                                    {battleEnd.ratingDelta > 0 ? `+${battleEnd.ratingDelta}` : battleEnd.ratingDelta} Rating
                                </Typography>
                                {battleEnd.newRating !== undefined && (
                                    <Typography sx={{ fontSize: "12px", color: "#555", fontFamily: "'Inter', sans-serif", ml: "6px" }}>
                                        → {battleEnd.newRating}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Box sx={{ display: "flex", gap: "10px", justifyContent: "center", mt: 2 }}>
                            <Box component="button" onClick={() => navigate("/home")} sx={{ px: "20px", py: "10px", bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "10px", color: "#888", fontSize: "13px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                Go Home
                            </Box>
                            <Box component="button" onClick={() => navigate("/friends")} sx={{ px: "20px", py: "10px", bgcolor: "#e8e8e8", border: "none", borderRadius: "10px", color: "#111", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                Play Again
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Exit Confirm Dialog */}
            {exitConfirm && (
                <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}>
                    <Box sx={{ bgcolor: "#161616", border: "0.5px solid #2a2a2a", borderRadius: "16px", p: "32px 36px", textAlign: "center", minWidth: 300 }}>
                        <ExitToAppIcon sx={{ fontSize: 40, color: "#f87171", mb: 2 }} />
                        <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif", mb: "8px" }}>
                            Forfeit Battle?
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: "#555", fontFamily: "'Inter', sans-serif", mb: "6px" }}>
                            Your opponent will be declared the winner.
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#f87171", fontFamily: "'Inter', sans-serif", mb: "24px" }}>
                            You will lose <Box component="span" sx={{ fontWeight: 700 }}>2–3 rating</Box> points.
                        </Typography>
                        <Box sx={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <Box component="button" onClick={() => setExitConfirm(false)}
                                 sx={{ px: "20px", py: "9px", bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "10px", color: "#888", fontSize: "13px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                Stay
                            </Box>
                            <Box component="button" onClick={forfeit} disabled={forfeiting}
                                 sx={{ px: "20px", py: "9px", bgcolor: forfeiting ? "#2a1a1a" : "#2a0d0d", border: "0.5px solid #f8717144", borderRadius: "10px", color: forfeiting ? "#555" : "#f87171", fontSize: "13px", fontWeight: 600, cursor: forfeiting ? "default" : "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
                                {forfeiting ? <CircularProgress size={11} sx={{ color: "#555" }} /> : <ExitToAppIcon sx={{ fontSize: 14 }} />}
                                {forfeiting ? "Forfeiting..." : "Yes, Forfeit"}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", overflow: "hidden" }}>

                {/* LEFT — Problem + Test Cases */}
                <Box sx={{ display: "flex", flexDirection: "column", borderRight: "0.5px solid #1e1e1e", overflow: "hidden" }}>

                    {/* Battle header */}
                    <Box sx={{ bgcolor: "#0f0f0f", borderBottom: "0.5px solid #1e1e1e", p: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                        <Box>
                            <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>Battle Room</Typography>
                            <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "monospace" }}>{state?.roomId?.slice(0, 20)}...</Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                            <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>vs {state?.opponent}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center" }}>
                                <BoltIcon sx={{ fontSize: 10, color: "#444" }} />
                                <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>{state?.opponentRating}</Typography>
                            </Box>
                        </Box>
                        {/* Timer */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Box sx={{ bgcolor: timeLeft < 300 ? "#2a0d0d" : "#161616", border: `0.5px solid ${timeLeft < 300 ? "#f8717133" : "#252525"}`, borderRadius: "8px", px: "12px", py: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <TimerIcon sx={{ fontSize: 13, color: timeLeft < 300 ? "#f87171" : "#555" }} />
                                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: timeLeft < 300 ? "#f87171" : "#888", fontFamily: "monospace" }}>
                                    {formatTime(timeLeft)}
                                </Typography>
                            </Box>
                            {/* Exit / Forfeit button */}
                            <Box component="button" onClick={() => setExitConfirm(true)}
                                 title="Forfeit battle"
                                 sx={{ display: "flex", alignItems: "center", gap: "5px", bgcolor: "#1a0d0d", border: "0.5px solid #f8717133", borderRadius: "8px", px: "10px", py: "6px", color: "#f87171", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover": { bgcolor: "#2a0d0d", borderColor: "#f8717166" } }}>
                                <ExitToAppIcon sx={{ fontSize: 14 }} />
                                Exit
                            </Box>
                        </Box>
                    </Box>

                    {/* Tabs — Problem / Test Cases */}
                    <Box sx={{ borderBottom: "0.5px solid #1e1e1e", flexShrink: 0 }}>
                        <Tabs value={leftTab} onChange={(_, v) => setLeftTab(v)}
                              sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#444", textTransform: "none", py: 0 }, "& .Mui-selected": { color: "#e8e8e8 !important" }, "& .MuiTabs-indicator": { bgcolor: "#6366f1" } }}>
                            <Tab label="Problem" />
                            <Tab label={`Test Cases (${testCases.length})`} />
                        </Tabs>
                    </Box>

                    {/* Tab content */}
                    <Box sx={{ flex: 1, overflowY: "auto", p: "16px" }}>

                        {/* Problem tab */}
                        {leftTab === 0 && (
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: "12px" }}>
                                    <Typography sx={{ fontSize: "17px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif", flex: 1, pr: 2 }}>
                                        {state?.problem?.title}
                                    </Typography>
                                    <Box sx={{ bgcolor: diff.bg, border: `0.5px solid ${diff.border}`, borderRadius: "6px", px: "8px", py: "3px", flexShrink: 0 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 600, color: diff.text, fontFamily: "'Inter', sans-serif" }}>
                                            {state?.problem?.difficulty}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ borderColor: "#1e1e1e", mb: "14px" }} />

                                <Typography sx={{ fontSize: "13px", color: "#888", fontFamily: "'Inter', sans-serif", lineHeight: 1.8, mb: "20px" }}>
                                    {state?.problem?.description}
                                </Typography>

                                {state?.problem?.examples?.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "10px" }}>
                                            Examples
                                        </Typography>
                                        {state.problem.examples.map((ex, i) => (
                                            <Box key={i} sx={{ bgcolor: "#0d1117", border: "0.5px solid #30363d", borderRadius: "8px", p: "12px", mb: "8px", fontFamily: "monospace", fontSize: "12px", color: "#e6edf3", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                {ex}
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                {opponentSubmitted && (
                                    <Box sx={{ mt: 2, bgcolor: "#2a1a0d", border: "0.5px solid #fb923c33", borderRadius: "8px", p: "10px 12px" }}>
                                        <Typography sx={{ fontSize: "12px", color: "#fb923c", fontFamily: "'Inter', sans-serif" }}>
                                            ⚡ {state?.opponent} has submitted — hurry up!
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Test Cases tab */}
                        {leftTab === 1 && (
                            <Box>
                                <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "12px" }}>
                                    {testCases.length} test cases — all must pass to win
                                </Typography>
                                {testCases.length === 0 ? (
                                    <Typography sx={{ fontSize: "12px", color: "#333", fontFamily: "'Inter', sans-serif" }}>No test cases available</Typography>
                                ) : (
                                    testCases.map((tc, i) => (
                                        <Box key={i} sx={{ bgcolor: "#0f0f0f", border: "0.5px solid #1e1e1e", borderRadius: "10px", p: "12px 14px", mb: "10px" }}>
                                            <Typography sx={{ fontSize: "10px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", mb: "8px" }}>
                                                Test {i + 1}
                                            </Typography>
                                            <Box sx={{ mb: "8px" }}>
                                                <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mb: "4px" }}>Input</Typography>
                                                <Box sx={{ bgcolor: "#0d1117", border: "0.5px solid #30363d", borderRadius: "6px", p: "8px 10px", fontFamily: "monospace", fontSize: "12px", color: "#e6edf3", whiteSpace: "pre-wrap" }}>
                                                    {tc.input || "(empty)"}
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mb: "4px" }}>Expected Output</Typography>
                                                <Box sx={{ bgcolor: "#0d1117", border: "0.5px solid #30363d", borderRadius: "6px", p: "8px 10px", fontFamily: "monospace", fontSize: "12px", color: "#4ade80", whiteSpace: "pre-wrap" }}>
                                                    {tc.output || "(empty)"}
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* RIGHT — Editor + Run/Submit */}
                <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Editor toolbar */}
                    <Box sx={{ bgcolor: "#0f0f0f", borderBottom: "0.5px solid #1e1e1e", p: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "12px", color: "#555", fontFamily: "'Inter', sans-serif" }}>Solution</Typography>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <Select value={languageId} onChange={(e) => handleLanguageChange(e.target.value)}
                                    sx={{ fontSize: "12px", height: "30px", borderRadius: "8px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" } }}>
                                {LANGUAGES.map((l) => (
                                    <MenuItem key={l.id} value={l.id} sx={{ fontSize: "12px" }}>{l.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Monaco Editor */}
                    <Box sx={{ flex: 1, overflow: "hidden", borderBottom: "0.5px solid #1e1e1e" }}>
                        <Editor
                            height="100%"
                            language={
                                languageId === 71 ? "python" :
                                    languageId === 62 ? "java" :
                                        languageId === 63 ? "javascript" : "cpp"
                            }
                            value={code}
                            onChange={(val) => setCode(val || "")}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbers: "on",
                                tabSize: 4,
                                automaticLayout: true,
                                padding: { top: 12 },
                                scrollbar: { verticalScrollbarSize: 6 },
                            }}
                        />
                    </Box>

                    {/* ✅ Custom Input + Run section */}
                    <Box sx={{ bgcolor: "#0a0a0a", borderBottom: "0.5px solid #1e1e1e", p: "10px 14px", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "6px" }}>
                            Custom Input (stdin)
                        </Typography>
                        <textarea
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Enter custom input here..."
                            rows={2}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                bgcolor: "#0d1117", background: "#0d1117",
                                border: "0.5px solid #2a2a2a", borderRadius: "6px",
                                color: "#aaa", fontFamily: "monospace", fontSize: "12px",
                                padding: "8px", resize: "none", outline: "none",
                            }}
                        />

                        {/* Run result */}
                        {runResult && (
                            <Box sx={{ mt: "8px", bgcolor: runResult.status === "Accepted" ? "#0d2a1a" : "#1a1a0d", border: `0.5px solid ${runResult.status === "Accepted" ? "#4ade8033" : "#fb923c33"}`, borderRadius: "6px", p: "8px 10px" }}>
                                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: runResult.status === "Accepted" ? "#4ade80" : "#fb923c", fontFamily: "'Inter', sans-serif", mb: "4px" }}>
                                    {runResult.status}
                                </Typography>
                                {runResult.output && (
                                    <Box sx={{ fontFamily: "monospace", fontSize: "12px", color: "#e6edf3", whiteSpace: "pre-wrap" }}>
                                        {runResult.output}
                                    </Box>
                                )}
                                {runResult.stderr && (
                                    <Box sx={{ fontFamily: "monospace", fontSize: "11px", color: "#f87171", whiteSpace: "pre-wrap", mt: "4px" }}>
                                        {runResult.stderr}
                                    </Box>
                                )}
                                {runResult.time && (
                                    <Typography sx={{ fontSize: "10px", color: "#444", fontFamily: "'Inter', sans-serif", mt: "4px" }}>
                                        Time: {runResult.time}s · Memory: {runResult.memory}KB
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Submit result — per-test-case breakdown */}
                    {result && (() => {
                        const accepted = result.status === "ACCEPTED";
                        const cases = result.testResults || [];
                        const passedCount = cases.filter(c => c.passed).length;
                        return (
                            <Box sx={{ bgcolor: accepted ? "#0d2a1a" : "#1a0d0d", border: `0.5px solid ${accepted ? "#4ade8033" : "#f8717133"}`, p: "10px 14px", flexShrink: 0, maxHeight: "240px", overflowY: "auto" }}>

                                {/* Summary row */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: cases.length > 0 ? "10px" : 0 }}>
                                    {accepted
                                        ? <CheckCircleIcon sx={{ fontSize: 14, color: "#4ade80" }} />
                                        : <CancelIcon sx={{ fontSize: 14, color: "#f87171" }} />
                                    }
                                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: accepted ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif", flex: 1 }}>
                                        {accepted
                                            ? `All ${cases.length} test${cases.length !== 1 ? "s" : ""} passed! You win!`
                                            : `${passedCount} / ${cases.length} test${cases.length !== 1 ? "s" : ""} passed`}
                                    </Typography>
                                </Box>

                                {/* Per-case rows */}
                                {cases.map((tc, i) => (
                                    <Box key={i} sx={{
                                        mb: "6px", borderRadius: "8px", overflow: "hidden",
                                        border: `0.5px solid ${tc.passed ? "#4ade8033" : "#f8717133"}`,
                                        bgcolor: tc.passed ? "#0a1f10" : "#1f0a0a",
                                    }}>
                                        {/* Case header */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", px: "10px", py: "6px", borderBottom: `0.5px solid ${tc.passed ? "#4ade8022" : "#f8717122"}` }}>
                                            {tc.passed
                                                ? <CheckCircleIcon sx={{ fontSize: 12, color: "#4ade80" }} />
                                                : <CancelIcon sx={{ fontSize: 12, color: "#f87171" }} />
                                            }
                                            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: tc.passed ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif" }}>
                                                Test {tc.index}
                                            </Typography>
                                            {tc.error && !tc.error.startsWith("ERROR:") && (
                                                <Typography sx={{ fontSize: "10px", color: "#f87171", fontFamily: "'Inter', sans-serif", ml: "auto" }}>
                                                    Wrong Answer
                                                </Typography>
                                            )}
                                            {tc.error && tc.error.startsWith("ERROR:") && (
                                                <Typography sx={{ fontSize: "10px", color: "#fb923c", fontFamily: "'Inter', sans-serif", ml: "auto" }}>
                                                    Runtime Error
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Case body — show on failure or always */}
                                        {!tc.passed && (
                                            <Box sx={{ px: "10px", py: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <Box sx={{ display: "flex", gap: "6px" }}>
                                                    <Typography sx={{ fontSize: "10px", color: "#555", fontFamily: "'Inter', sans-serif", minWidth: 54 }}>Input</Typography>
                                                    <Box sx={{ fontFamily: "monospace", fontSize: "11px", color: "#aaa", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{tc.input}</Box>
                                                </Box>
                                                <Box sx={{ display: "flex", gap: "6px" }}>
                                                    <Typography sx={{ fontSize: "10px", color: "#555", fontFamily: "'Inter', sans-serif", minWidth: 54 }}>Expected</Typography>
                                                    <Box sx={{ fontFamily: "monospace", fontSize: "11px", color: "#4ade80", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{tc.expected}</Box>
                                                </Box>
                                                <Box sx={{ display: "flex", gap: "6px" }}>
                                                    <Typography sx={{ fontSize: "10px", color: "#555", fontFamily: "'Inter', sans-serif", minWidth: 54 }}>Got</Typography>
                                                    <Box sx={{ fontFamily: "monospace", fontSize: "11px", color: "#f87171", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                                        {tc.error?.startsWith("ERROR:") ? tc.error.replace("ERROR:", "").trim() : (tc.actual || "(empty)")}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        );
                    })()}

                    {/* Run + Submit buttons */}
                    <Box sx={{ display: "flex", gap: "8px", p: "10px 14px", bgcolor: "#0a0a0a", flexShrink: 0 }}>
                        <Box component="button" onClick={runCode} disabled={running}
                             sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", bgcolor: running ? "#1a1a1a" : "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "8px", color: running ? "#444" : "#aaa", fontSize: "13px", fontWeight: 500, py: "10px", cursor: running ? "default" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover:not(:disabled)": { bgcolor: "#252525", color: "#e8e8e8" } }}>
                            {running ? <CircularProgress size={12} sx={{ color: "#444" }} /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
                            {running ? "Running..." : "Run Code"}
                        </Box>
                        <Box component="button" onClick={submit} disabled={submitting}
                             sx={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", bgcolor: submitting ? "#1a1a1a" : "#e8e8e8", border: "none", borderRadius: "8px", color: submitting ? "#444" : "#111", fontSize: "13px", fontWeight: 600, py: "10px", cursor: submitting ? "default" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover:not(:disabled)": { bgcolor: "#d4d4d4" } }}>
                            {submitting ? <CircularProgress size={12} sx={{ color: "#444" }} /> : <SendIcon sx={{ fontSize: 15 }} />}
                            {submitting ? "Submitting..." : "Submit Solution"}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
}