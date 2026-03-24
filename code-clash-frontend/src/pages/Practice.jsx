import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box, Typography, Select, MenuItem, FormControl,
    Divider, CircularProgress, Tabs, Tab
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Editor from "@monaco-editor/react";
import Layout from "./Layout";
import api from "../api/axios";

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

const DIFF_COLOR = {
    EASY:   { bg: "#0d2a1a", border: "#4ade8033", text: "#4ade80" },
    MEDIUM: { bg: "#2a1a0d", border: "#fb923c33", text: "#fb923c" },
    HARD:   { bg: "#2a0d0d", border: "#f8717133", text: "#f87171" },
};

export default function Practice() {
    const { state: routeState } = useLocation();
    const navigate = useNavigate();

    const problem = routeState?.problem || null;

    const [code, setCode]             = useState(DEFAULT_CODE[71]);
    const [languageId, setLanguageId] = useState(71);
    const [leftTab, setLeftTab]       = useState(0); // 0=problem, 1=testcases
    const [customInput, setCustomInput] = useState("");
    const [running, setRunning]       = useState(false);
    const [runResult, setRunResult]   = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult]         = useState(null);
    const [solved, setSolved]         = useState(false);

    const testCases = (() => {
        try { return JSON.parse(problem?.testCases || "[]"); }
        catch { return []; }
    })();

    const diff = DIFF_COLOR[problem?.difficulty] || DIFF_COLOR.EASY;

    useEffect(() => {
        if (!problem) navigate("/problems");
    }, [problem]);

    const handleLanguageChange = (newLang) => {
        setLanguageId(newLang);
        setCode(DEFAULT_CODE[newLang]);
    };

    const resetCode = () => {
        setCode(DEFAULT_CODE[languageId]);
        setResult(null);
        setRunResult(null);
        setSolved(false);
    };

    // Run against custom input
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
        } catch {
            setRunResult({ status: "ERROR", stderr: "Run failed. Check your code." });
        } finally {
            setRunning(false);
        }
    };

    // Submit against all test cases — uses practice endpoint (no roomId, no rating impact)
    const submitCode = async () => {
        setSubmitting(true);
        setResult(null);
        try {
            const res = await api.post("/practice/submit", {
                problemId: problem.id,
                code,
                languageId,
            });
            setResult(res.data);
            if (res.data.status === "ACCEPTED") setSolved(true);
        } catch {
            setResult({ status: "ERROR", reason: "Submission failed. Try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (!problem) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: "#444", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
                    Loading practice room...
                </Typography>
            </Box>
        );
    }

    return (
        <Layout fullscreen>

            {/* Solved overlay */}
            {solved && (
                <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                    <Box sx={{ bgcolor: "#161616", border: "0.5px solid #2a2a2a", borderRadius: "20px", p: "40px 48px", textAlign: "center", minWidth: 320 }}>
                        <EmojiEventsIcon sx={{ fontSize: 52, color: "#4ade80", mb: 2 }} />
                        <Typography sx={{ fontSize: "26px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif", mb: "8px" }}>
                            Solved! 🎉
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: "#555", fontFamily: "'Inter', sans-serif", mb: "28px" }}>
                            You solved <Box component="span" sx={{ color: "#aaa" }}>{problem.title}</Box>
                        </Typography>
                        <Box sx={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <Box component="button" onClick={() => navigate("/problems")} sx={{ px: "20px", py: "10px", bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "10px", color: "#888", fontSize: "13px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                Back to Problems
                            </Box>
                            <Box component="button" onClick={() => { setSolved(false); resetCode(); }} sx={{ px: "20px", py: "10px", bgcolor: "#e8e8e8", border: "none", borderRadius: "10px", color: "#111", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                Try Again
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", overflow: "hidden" }}>

                {/* ── LEFT — Problem + Test Cases ── */}
                <Box sx={{ display: "flex", flexDirection: "column", borderRight: "0.5px solid #1e1e1e", overflow: "hidden" }}>

                    {/* Header bar */}
                    <Box sx={{ bgcolor: "#0f0f0f", borderBottom: "0.5px solid #1e1e1e", p: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Box component="button" onClick={() => navigate("/problems")} sx={{ display: "flex", alignItems: "center", gap: "5px", bgcolor: "transparent", border: "none", color: "#444", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter', sans-serif", p: 0, transition: "color 0.15s", "&:hover": { color: "#888" } }}>
                                <ArrowBackIcon sx={{ fontSize: 14 }} />
                                Problems
                            </Box>
                            <Box sx={{ width: "1px", height: "14px", bgcolor: "#2a2a2a" }} />
                            <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif" }}>
                                Practice Room
                            </Typography>
                        </Box>

                        {/* Difficulty badge */}
                        <Box sx={{ bgcolor: diff.bg, border: `0.5px solid ${diff.border}`, borderRadius: "7px", px: "10px", py: "4px" }}>
                            <Typography sx={{ fontSize: "10px", fontWeight: 600, color: diff.text, fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em" }}>
                                {problem.difficulty}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: "0.5px solid #1e1e1e", flexShrink: 0 }}>
                        <Tabs value={leftTab} onChange={(_, v) => setLeftTab(v)}
                              sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#444", textTransform: "none", py: 0 }, "& .Mui-selected": { color: "#e8e8e8 !important" }, "& .MuiTabs-indicator": { bgcolor: "#4ade80" } }}>
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
                                    <Typography sx={{ fontSize: "17px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif", flex: 1, pr: 2, lineHeight: 1.3 }}>
                                        {problem.title}
                                    </Typography>
                                </Box>

                                <Divider sx={{ borderColor: "#1e1e1e", mb: "14px" }} />

                                <Typography sx={{ fontSize: "13px", color: "#888", fontFamily: "'Inter', sans-serif", lineHeight: 1.8, mb: "20px" }}>
                                    {problem.description}
                                </Typography>

                                {problem.examples?.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "10px" }}>
                                            Examples
                                        </Typography>
                                        {problem.examples.map((ex, i) => (
                                            <Box key={i} sx={{ bgcolor: "#0d1117", border: "0.5px solid #30363d", borderRadius: "8px", p: "12px", mb: "8px", fontFamily: "monospace", fontSize: "12px", color: "#e6edf3", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                {ex}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Test Cases tab */}
                        {leftTab === 1 && (
                            <Box>
                                <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "12px" }}>
                                    {testCases.length} test cases — all must pass
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

                {/* ── RIGHT — Editor + Run/Submit ── */}
                <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Editor toolbar */}
                    <Box sx={{ bgcolor: "#0f0f0f", borderBottom: "0.5px solid #1e1e1e", p: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "12px", color: "#555", fontFamily: "'Inter', sans-serif" }}>Solution</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {/* Reset button */}
                            <Box component="button" onClick={resetCode} title="Reset code" sx={{ display: "flex", alignItems: "center", gap: "4px", bgcolor: "transparent", border: "0.5px solid #2a2a2a", borderRadius: "6px", color: "#444", px: "8px", py: "4px", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover": { color: "#888", borderColor: "#3a3a3a" } }}>
                                <RefreshIcon sx={{ fontSize: 13 }} /> Reset
                            </Box>
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <Select value={languageId} onChange={(e) => handleLanguageChange(e.target.value)}
                                        sx={{ fontSize: "12px", height: "30px", borderRadius: "8px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" } }}>
                                    {LANGUAGES.map((l) => (
                                        <MenuItem key={l.id} value={l.id} sx={{ fontSize: "12px" }}>{l.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
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

                    {/* Custom input + run result */}
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
                                background: "#0d1117",
                                border: "0.5px solid #2a2a2a", borderRadius: "6px",
                                color: "#aaa", fontFamily: "monospace", fontSize: "12px",
                                padding: "8px", resize: "none", outline: "none",
                            }}
                        />

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
                        const cases    = result.testResults || [];
                        const passed   = cases.filter(c => c.passed).length;
                        return (
                            <Box sx={{ bgcolor: accepted ? "#0d2a1a" : "#1a0d0d", border: `0.5px solid ${accepted ? "#4ade8033" : "#f8717133"}`, p: "10px 14px", flexShrink: 0, maxHeight: "240px", overflowY: "auto" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: cases.length > 0 ? "10px" : 0 }}>
                                    {accepted
                                        ? <CheckCircleIcon sx={{ fontSize: 14, color: "#4ade80" }} />
                                        : <CancelIcon      sx={{ fontSize: 14, color: "#f87171" }} />
                                    }
                                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: accepted ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif", flex: 1 }}>
                                        {accepted
                                            ? `All ${cases.length} test${cases.length !== 1 ? "s" : ""} passed!`
                                            : `${passed} / ${cases.length} test${cases.length !== 1 ? "s" : ""} passed`}
                                    </Typography>
                                </Box>

                                {cases.map((tc, i) => (
                                    <Box key={i} sx={{ mb: "6px", borderRadius: "8px", overflow: "hidden", border: `0.5px solid ${tc.passed ? "#4ade8033" : "#f8717133"}`, bgcolor: tc.passed ? "#0a1f10" : "#1f0a0a" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", px: "10px", py: "6px", borderBottom: `0.5px solid ${tc.passed ? "#4ade8022" : "#f8717122"}` }}>
                                            {tc.passed
                                                ? <CheckCircleIcon sx={{ fontSize: 12, color: "#4ade80" }} />
                                                : <CancelIcon      sx={{ fontSize: 12, color: "#f87171" }} />
                                            }
                                            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: tc.passed ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif" }}>
                                                Test {tc.index}
                                            </Typography>
                                            {tc.error && !tc.error.startsWith("ERROR:") && (
                                                <Typography sx={{ fontSize: "10px", color: "#f87171", fontFamily: "'Inter', sans-serif", ml: "auto" }}>Wrong Answer</Typography>
                                            )}
                                            {tc.error && tc.error.startsWith("ERROR:") && (
                                                <Typography sx={{ fontSize: "10px", color: "#fb923c", fontFamily: "'Inter', sans-serif", ml: "auto" }}>Runtime Error</Typography>
                                            )}
                                        </Box>
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
                        <Box component="button" onClick={runCode} disabled={running} sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", bgcolor: running ? "#1a1a1a" : "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "8px", color: running ? "#444" : "#aaa", fontSize: "13px", fontWeight: 500, py: "10px", cursor: running ? "default" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover:not(:disabled)": { bgcolor: "#252525", color: "#e8e8e8" } }}>
                            {running ? <CircularProgress size={12} sx={{ color: "#444" }} /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
                            {running ? "Running..." : "Run Code"}
                        </Box>
                        <Box component="button" onClick={submitCode} disabled={submitting} sx={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", bgcolor: submitting ? "#1a1a1a" : "#e8e8e8", border: "none", borderRadius: "8px", color: submitting ? "#444" : "#111", fontSize: "13px", fontWeight: 600, py: "10px", cursor: submitting ? "default" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover:not(:disabled)": { bgcolor: "#d4d4d4" } }}>
                            {submitting ? <CircularProgress size={12} sx={{ color: "#444" }} /> : <SendIcon sx={{ fontSize: 15 }} />}
                            {submitting ? "Checking..." : "Submit Solution"}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
}