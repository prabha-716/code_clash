import { useState, useEffect } from "react";
import { Box, Typography, Grid, Collapse, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Layout from "./Layout";
import api from "../api/axios";

const DIFFICULTY_COLOR = {
    EASY:   { text: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)"  },
    MEDIUM: { text: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
    HARD:   { text: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
};

function DiffBadge({ diff }) {
    const c = DIFFICULTY_COLOR[diff] || { text: "#666", bg: "#1a1a1a", border: "#2a2a2a" };
    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", px: "8px", py: "2px", borderRadius: "6px", background: c.bg, border: `0.5px solid ${c.border}`, fontSize: "10px", fontWeight: 500, color: c.text, fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {diff}
        </Box>
    );
}

function ProblemCard({ problem }) {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const handlePractice = (e) => {
        e.stopPropagation(); // don't toggle expand
        navigate("/practice", { state: { problem } });
    };

    return (
        <Box
            onClick={() => setExpanded((v) => !v)}
            sx={{
                background: "#161616",
                border: `0.5px solid ${expanded ? "#3a3a3a" : "#252525"}`,
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.15s",
                "&:hover": { borderColor: "#3a3a3a" },
                position: "relative",
                "&::before": {
                    content: '""', position: "absolute", inset: 0,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)",
                    pointerEvents: "none",
                },
            }}
        >
            {/* Header row */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "14px 16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: "8px", background: "#1e1e1e", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CodeIcon sx={{ fontSize: 14, color: "#555" }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#d8d8d8", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em", mb: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {problem.title}
                        </Typography>
                        <DiffBadge diff={problem.difficulty} />
                    </Box>
                </Box>

                {/* Right side: practice button + chevron */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, ml: "12px" }}>
                    <Box
                        component="button"
                        onClick={handlePractice}
                        sx={{
                            display: "flex", alignItems: "center", gap: "5px",
                            background: "#1e1e1e", border: "0.5px solid #2e2e2e",
                            color: "#888", px: "12px", py: "5px", borderRadius: "7px",
                            fontSize: "11px", fontWeight: 500, cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            transition: "all 0.15s",
                            "&:hover": { background: "#e8e8e8", color: "#111", borderColor: "transparent" },
                        }}
                    >
                        <PlayArrowIcon sx={{ fontSize: 13 }} />
                        Practice
                    </Box>
                    <Box sx={{ color: "#333", display: "flex" }}>
                        {expanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                    </Box>
                </Box>
            </Box>

            {/* Expanded */}
            <Collapse in={expanded}>
                <Box sx={{ px: "16px", pb: "16px", borderTop: "0.5px solid #1e1e1e" }}>
                    <Typography sx={{ fontSize: "13px", color: "#555", fontFamily: "'Inter', sans-serif", lineHeight: 1.8, mt: "14px", mb: "16px" }}>
                        {problem.description}
                    </Typography>
                    {problem.examples?.length > 0 && (
                        <>
                            <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "8px", fontWeight: 500 }}>
                                Examples
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {problem.examples.map((ex, i) => (
                                    <Box key={i} sx={{ background: "#111", border: "0.5px solid #1e1e1e", borderRadius: "8px", p: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#777", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}>
                                        {ex}
                                    </Box>
                                ))}
                            </Box>
                        </>
                    )}

                    {/* Practice CTA inside expanded view too */}
                    <Box
                        component="button"
                        onClick={handlePractice}
                        sx={{
                            mt: "18px",
                            display: "flex", alignItems: "center", gap: "6px",
                            background: "#e8e8e8", border: "none",
                            color: "#111", px: "16px", py: "8px", borderRadius: "8px",
                            fontSize: "12px", fontWeight: 600, cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            transition: "background 0.15s",
                            "&:hover": { background: "#d4d4d4" },
                        }}
                    >
                        <PlayArrowIcon sx={{ fontSize: 15 }} />
                        Open Practice Room
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}

function SkeletonCard() {
    return (
        <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", p: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Skeleton variant="rounded" width={30} height={30} sx={{ bgcolor: "#222", borderRadius: "8px", flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
                <Skeleton width="38%" height={16} sx={{ bgcolor: "#222", mb: "6px" }} />
                <Skeleton width="12%" height={14} sx={{ bgcolor: "#1e1e1e" }} />
            </Box>
            <Skeleton width={80} height={30} sx={{ bgcolor: "#1e1e1e", borderRadius: "7px" }} />
        </Box>
    );
}

export default function Problems() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("ALL");

    useEffect(() => {
        api.get("/problems").then((res) => setProblems(res.data)).finally(() => setLoading(false));
    }, []);

    const filtered = problems.filter((p) => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchDiff = difficulty === "ALL" || p.difficulty === difficulty;
        return matchSearch && matchDiff;
    });

    const counts = {
        ALL:    problems.length,
        EASY:   problems.filter((p) => p.difficulty === "EASY").length,
        MEDIUM: problems.filter((p) => p.difficulty === "MEDIUM").length,
        HARD:   problems.filter((p) => p.difficulty === "HARD").length,
    };

    const statCards = [
        { label: "Total",  count: counts.ALL,    color: "#888"    },
        { label: "Easy",   count: counts.EASY,   color: "#4ade80" },
        { label: "Medium", count: counts.MEDIUM, color: "#f59e0b" },
        { label: "Hard",   count: counts.HARD,   color: "#f87171" },
    ];

    const filterBtns = ["ALL", "EASY", "MEDIUM", "HARD"];

    return (
        <Layout>
            <Box sx={{ maxWidth: "820px", mx: "auto", mt: "64px", px: { xs: 3, sm: 4 }, pb: 8, fontFamily: "'Inter', sans-serif" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'); @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

                {/* Header */}
                <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#b0b0b0" }} />
                        <Typography sx={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
                            Problems
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: { xs: "22px", sm: "26px" }, fontWeight: 500, color: "#e8e8e8", letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif", mb: "4px" }}>
                        Problem Set
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                        {problems.length} problems available — click any to expand, then practice
                    </Typography>
                </Box>

                {/* Stat mini-cards */}
                <Grid container spacing={1.5} sx={{ mb: 4 }}>
                    {statCards.map((s) => (
                        <Grid item xs={3} key={s.label}>
                            <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", p: "14px 16px", textAlign: "center", position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)", pointerEvents: "none" } }}>
                                <Typography sx={{ fontSize: "20px", fontWeight: 600, color: s.color, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", mb: "2px" }}>
                                    {s.count}
                                </Typography>
                                <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Search + filter */}
                <Box sx={{ display: "flex", gap: "10px", mb: "20px", flexWrap: "wrap" }}>
                    <Box sx={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "center", background: "#161616", border: "0.5px solid #252525", borderRadius: "9px", px: "12px", gap: "8px", transition: "border-color 0.15s", "&:focus-within": { borderColor: "#3a3a3a" } }}>
                        <SearchIcon sx={{ fontSize: 15, color: "#333", flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#aaa", fontSize: "13px", fontFamily: "'Inter', sans-serif", padding: "10px 0" }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: "4px", background: "#111", border: "0.5px solid #1e1e1e", borderRadius: "9px", p: "4px" }}>
                        {filterBtns.map((d) => {
                            const active = difficulty === d;
                            const c = DIFFICULTY_COLOR[d];
                            return (
                                <Box key={d} component="button" onClick={() => setDifficulty(d)} sx={{ background: active ? (c ? c.bg : "#1e1e1e") : "transparent", border: active ? `0.5px solid ${c ? c.border : "#2a2a2a"}` : "0.5px solid transparent", borderRadius: "6px", color: active ? (c ? c.text : "#aaa") : "#333", fontSize: "11px", fontWeight: 500, fontFamily: "'Inter', sans-serif", cursor: "pointer", px: "12px", py: "5px", transition: "all 0.15s", letterSpacing: "0.04em", "&:hover": { color: c ? c.text : "#888" } }}>
                                    {d}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* Problem list */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {loading ? (
                        Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    ) : filtered.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "60px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>No problems found</Typography>
                        </Box>
                    ) : (
                        filtered.map((p) => <ProblemCard key={p.id} problem={p} />)
                    )}
                </Box>
            </Box>
        </Layout>
    );
}