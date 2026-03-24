import { useState, useRef } from "react";
import { Box, Typography, Select, MenuItem, Alert } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Layout from "./Layout";
import api from "../api/axios.js";

// ── Language config ───────────────────────────────────────────────
const LANGUAGES = [
    { id: 71, label: "Python 3",     ext: "py",   placeholder: "# Write your Python code here\nprint('Hello, World!')" },
    { id: 62, label: "Java",         ext: "java",  placeholder: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}" },
    { id: 63, label: "JavaScript",   ext: "js",   placeholder: "// Write your JavaScript code here\nconsole.log('Hello, World!');" },
    { id: 54, label: "C++",          ext: "cpp",  placeholder: "#include <iostream>\nusing namespace std;\nint main() {\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}" },
    { id: 50, label: "C",            ext: "c",    placeholder: "#include <stdio.h>\nint main() {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}" },
    { id: 74, label: "TypeScript",   ext: "ts",   placeholder: "// Write your TypeScript code here\nconsole.log('Hello, World!');" },
    { id: 72, label: "Ruby",         ext: "rb",   placeholder: "# Write your Ruby code here\nputs 'Hello, World!'" },
    { id: 68, label: "PHP",          ext: "php",  placeholder: "<?php\necho 'Hello, World!';\n?>" },
];

const STATUS_COLORS = {
    Accepted:           { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)"  },
    "Wrong Answer":     { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
    "Time Limit Exceeded": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    "Runtime Error":    { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
    "Compilation Error":{ color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
};

const btnBase = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    border: "0.5px solid #2a2a2a", borderRadius: "8px",
    fontSize: "12px", fontWeight: 500, fontFamily: "'Inter', sans-serif",
    cursor: "pointer", transition: "all 0.15s", padding: "7px 14px",
};

export default function Compiler() {
    const [langId, setLangId]       = useState(71);
    const [code, setCode]           = useState(LANGUAGES[0].placeholder);
    const [stdin, setStdin]         = useState("");
    const [result, setResult]       = useState(null);
    const [running, setRunning]     = useState(false);
    const [copied, setCopied]       = useState(false);
    const [stdinOpen, setStdinOpen] = useState(false);
    const [error, setError]         = useState(null);
    const textareaRef               = useRef(null);

    const currentLang = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];

    const handleLangChange = (newId) => {
        setLangId(newId);
        const lang = LANGUAGES.find((l) => l.id === newId);
        if (lang) setCode(lang.placeholder);
        setResult(null);
        setError(null);
    };

    const handleRun = async () => {
        if (!code.trim()) return;
        setRunning(true);
        setResult(null);
        setError(null);
        try {
            const res = await api.post("/compile", {
                code,
                languageId: langId,
                stdin: stdin || "",
            });
            setResult(res.data);
        } catch (e) {
            setError("Failed to run code. Please try again.");
        } finally {
            setRunning(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        setCode(currentLang.placeholder);
        setResult(null);
        setError(null);
    };

    // Tab key inserts spaces instead of leaving textarea
    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const { selectionStart, selectionEnd } = e.target;
            const newCode = code.substring(0, selectionStart) + "    " + code.substring(selectionEnd);
            setCode(newCode);
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = selectionStart + 4;
            }, 0);
        }
    };

    const statusStyle = result?.status ? (STATUS_COLORS[result.status] || { color: "#888", bg: "#1a1a1a", border: "#2a2a2a" }) : null;

    return (
        <Layout>
            <Box sx={{ height: "calc(100vh - 0px)", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
                    .code-editor::-webkit-scrollbar { width: 6px; height: 6px; }
                    .code-editor::-webkit-scrollbar-track { background: transparent; }
                    .code-editor::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
                    .code-editor::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
                `}</style>

                {/* ── Top bar ── */}
                <Box sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    px: "20px", py: "12px",
                    borderBottom: "0.5px solid #1e1e1e",
                    background: "#0f0f0f",
                    flexShrink: 0,
                    gap: "12px",
                    flexWrap: "wrap",
                }}>
                    {/* Left — title + lang */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#b0b0b0" }} />
                            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif", letterSpacing: "0.02em" }}>
                                Sandbox
                            </Typography>
                        </Box>
                        <Select
                            value={langId}
                            onChange={(e) => handleLangChange(e.target.value)}
                            size="small"
                            sx={{
                                fontSize: "12px", fontFamily: "'Inter', sans-serif",
                                color: "#aaa", background: "#161616",
                                borderRadius: "8px", minWidth: 130,
                                "& .MuiOutlinedInput-notchedOutline": { border: "0.5px solid #252525" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { border: "0.5px solid #3a3a3a" },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "0.5px solid #555" },
                                "& .MuiSvgIcon-root": { color: "#444" },
                            }}
                        >
                            {LANGUAGES.map((l) => (
                                <MenuItem key={l.id} value={l.id} sx={{ fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                                    {l.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Right — actions */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Copy */}
                        <Box component="button" onClick={handleCopy} sx={{ ...btnBase, background: "#111", color: "#555", "&:hover": { color: "#aaa", borderColor: "#3a3a3a" } }}>
                            <ContentCopyIcon sx={{ fontSize: 13 }} />
                            {copied ? "Copied!" : "Copy"}
                        </Box>
                        {/* Clear */}
                        <Box component="button" onClick={handleClear} sx={{ ...btnBase, background: "#111", color: "#555", "&:hover": { color: "#aaa", borderColor: "#3a3a3a" } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                            Clear
                        </Box>
                        {/* Run */}
                        <Box
                            component="button"
                            onClick={handleRun}
                            disabled={running}
                            sx={{
                                ...btnBase,
                                background: running ? "#1e1e1e" : "#e8e8e8",
                                color: running ? "#444" : "#111",
                                border: "none",
                                px: "18px",
                                cursor: running ? "not-allowed" : "pointer",
                                "&:hover": { background: running ? "#1e1e1e" : "#d0d0d0" },
                            }}
                        >
                            {running
                                ? <><StopIcon sx={{ fontSize: 14 }} /> Running...</>
                                : <><PlayArrowIcon sx={{ fontSize: 14 }} /> Run</>
                            }
                        </Box>
                    </Box>
                </Box>

                {/* ── Main split ── */}
                <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

                    {/* ── Editor panel ── */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "0.5px solid #1a1a1a", overflow: "hidden" }}>
                        {/* Line numbers + editor */}
                        <Box sx={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
                            {/* Line numbers */}
                            <Box sx={{
                                width: "44px", flexShrink: 0,
                                background: "#0d0d0d",
                                borderRight: "0.5px solid #1a1a1a",
                                overflowY: "hidden",
                                pt: "14px", pb: "14px",
                                userSelect: "none",
                            }}>
                                {code.split("\n").map((_, i) => (
                                    <Box key={i} sx={{ height: "21px", display: "flex", alignItems: "center", justifyContent: "flex-end", pr: "10px" }}>
                                        <Typography sx={{ fontSize: "12px", color: "#2e2e2e", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                                            {i + 1}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                className="code-editor"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                                style={{
                                    flex: 1,
                                    background: "#0d0d0d",
                                    color: "#d4d4d4",
                                    border: "none",
                                    outline: "none",
                                    padding: "14px 16px",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: "13px",
                                    lineHeight: "21px",
                                    resize: "none",
                                    overflowY: "auto",
                                    tabSize: 4,
                                    whiteSpace: "pre",
                                    overflowX: "auto",
                                }}
                            />
                        </Box>

                        {/* ── Stdin section ── */}
                        <Box sx={{ borderTop: "0.5px solid #1a1a1a", flexShrink: 0 }}>
                            <Box
                                onClick={() => setStdinOpen((v) => !v)}
                                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", py: "8px", cursor: "pointer", "&:hover": { background: "#111" }, transition: "background 0.15s" }}
                            >
                                <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Stdin / Input
                                </Typography>
                                {stdinOpen
                                    ? <KeyboardArrowDownIcon sx={{ fontSize: 15, color: "#333" }} />
                                    : <KeyboardArrowUpIcon sx={{ fontSize: 15, color: "#333" }} />
                                }
                            </Box>
                            {stdinOpen && (
                                <textarea
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                    placeholder="Enter input here..."
                                    rows={4}
                                    style={{
                                        width: "100%",
                                        background: "#0a0a0a",
                                        color: "#888",
                                        border: "none",
                                        borderTop: "0.5px solid #1a1a1a",
                                        outline: "none",
                                        padding: "12px 16px",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: "12px",
                                        lineHeight: "1.6",
                                        resize: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* ── Output panel ── */}
                    <Box sx={{ width: "380px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#0d0d0d", overflow: "hidden" }}>
                        {/* Output header */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", py: "10px", borderBottom: "0.5px solid #1a1a1a", flexShrink: 0 }}>
                            <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Output
                            </Typography>
                            {result?.time && (
                                <Box sx={{ display: "flex", gap: "10px" }}>
                                    <Typography sx={{ fontSize: "10px", color: "#2a2a2a", fontFamily: "'JetBrains Mono', monospace" }}>
                                        {result.time}s
                                    </Typography>
                                    {result.memory && (
                                        <Typography sx={{ fontSize: "10px", color: "#2a2a2a", fontFamily: "'JetBrains Mono', monospace" }}>
                                            {Math.round(result.memory / 1024)}kb
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>

                        {/* Output body */}
                        <Box sx={{ flex: 1, overflowY: "auto", p: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {/* idle state */}
                            {!result && !running && !error && (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px" }}>
                                    <PlayArrowIcon sx={{ fontSize: 28, color: "#1e1e1e" }} />
                                    <Typography sx={{ fontSize: "12px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>
                                        Hit Run to execute
                                    </Typography>
                                </Box>
                            )}

                            {/* Running spinner */}
                            {running && (
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px" }}>
                                    <Typography sx={{ fontSize: "12px", color: "#333", fontFamily: "'JetBrains Mono', monospace" }}>
                                        Executing...
                                    </Typography>
                                </Box>
                            )}

                            {/* Error */}
                            {error && (
                                <Alert severity="error" sx={{ background: "#1a1a1a", border: "0.5px solid #2a2a2a", color: "#f87171", fontSize: "12px", borderRadius: "8px" }}>
                                    {error}
                                </Alert>
                            )}

                            {/* Result */}
                            {result && !running && (
                                <>
                                    {/* Status badge */}
                                    {result.status && (
                                        <Box sx={{ display: "inline-flex", alignSelf: "flex-start", px: "10px", py: "4px", borderRadius: "7px", background: statusStyle?.bg, border: `0.5px solid ${statusStyle?.border}` }}>
                                            <Typography sx={{ fontSize: "11px", fontWeight: 500, color: statusStyle?.color, fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
                                                {result.status}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* stdout */}
                                    {result.output && (
                                        <Box>
                                            <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "6px" }}>
                                                Output
                                            </Typography>
                                            <Box sx={{ background: "#111", border: "0.5px solid #1e1e1e", borderRadius: "8px", p: "12px 14px" }}>
                                                <Typography component="pre" sx={{ fontSize: "12px", color: "#c8c8c8", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    {result.output}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* stderr */}
                                    {result.stderr && (
                                        <Box>
                                            <Typography sx={{ fontSize: "10px", color: "#3a1a1a", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "6px" }}>
                                                Stderr
                                            </Typography>
                                            <Box sx={{ background: "#130d0d", border: "0.5px solid #2a1a1a", borderRadius: "8px", p: "12px 14px" }}>
                                                <Typography component="pre" sx={{ fontSize: "12px", color: "#f87171", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    {result.stderr}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* compile error */}
                                    {result.compileOutput && (
                                        <Box>
                                            <Typography sx={{ fontSize: "10px", color: "#3a1a1a", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "6px" }}>
                                                Compile Error
                                            </Typography>
                                            <Box sx={{ background: "#130d0d", border: "0.5px solid #2a1a1a", borderRadius: "8px", p: "12px 14px" }}>
                                                <Typography component="pre" sx={{ fontSize: "12px", color: "#f87171", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    {result.compileOutput}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
}