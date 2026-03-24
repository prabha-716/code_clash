import { Box, Typography, Grid, Skeleton, LinearProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GitHubIcon from "@mui/icons-material/GitHub";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CodeIcon from "@mui/icons-material/Code";
import api from "../api/axios";

// ── Rank system ───────────────────────────────────────────────────
function getRank(rating) {
    if (rating >= 2000) return { label: "Grandmaster", color: "#f59e0b", next: null, nextAt: null };
    if (rating >= 1600) return { label: "Master",      color: "#a78bfa", next: "Grandmaster", nextAt: 2000 };
    if (rating >= 1400) return { label: "Diamond",     color: "#67e8f9", next: "Master",      nextAt: 1600 };
    if (rating >= 1200) return { label: "Platinum",    color: "#4ade80", next: "Diamond",     nextAt: 1400 };
    if (rating >= 1100) return { label: "Gold",        color: "#facc15", next: "Platinum",    nextAt: 1200 };
    return                     { label: "Silver",      color: "#9ca3af", next: "Gold",        nextAt: 1100 };
}

const RANK_PREV = { Grandmaster: 1600, Master: 1400, Diamond: 1200, Platinum: 1100, Gold: 1000, Silver: 0 };

// ── Streak calc ───────────────────────────────────────────────────
function calcStreak(history) {
    if (!history.length) return { current: 0, best: 0 };
    const dates = [...new Set(history.map((h) => h.playedAt?.slice(0, 10)))].sort().reverse();
    let current = 0;
    let best = 0;
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let prev = null;
    for (const d of dates) {
        if (!prev) {
            if (d === today || d === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
                streak = 1;
            } else break;
        } else {
            const diff = (new Date(prev) - new Date(d)) / 86400000;
            if (diff === 1) streak++;
            else break;
        }
        prev = d;
        if (streak > best) best = streak;
    }
    current = streak;
    const allDates = [...new Set(history.map((h) => h.playedAt?.slice(0, 10)))].sort();
    let b = 1; let tmp = 1;
    for (let i = 1; i < allDates.length; i++) {
        const diff = (new Date(allDates[i]) - new Date(allDates[i - 1])) / 86400000;
        if (diff === 1) { tmp++; if (tmp > b) b = tmp; }
        else tmp = 1;
    }
    return { current, best: Math.max(b, current) };
}

// ── Difficulty breakdown ──────────────────────────────────────────
function DiffBar({ label, count, total, color }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <Box sx={{ mb: "10px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: "4px" }}>
                <Typography sx={{ fontSize: "11px", color: "#555", fontFamily: "'Inter', sans-serif" }}>{label}</Typography>
                <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>{count} ({pct}%)</Typography>
            </Box>
            <Box sx={{ height: 4, bgcolor: "#1a1a1a", borderRadius: "4px", overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: "4px", transition: "width 1s ease" }} />
            </Box>
        </Box>
    );
}

// ── Badge component ───────────────────────────────────────────────
function Badge({ icon, label, desc, earned }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", p: "12px 14px", bgcolor: earned ? "#161616" : "#0f0f0f", border: `0.5px solid ${earned ? "#2a2a2a" : "#1a1a1a"}`, borderRadius: "10px", opacity: earned ? 1 : 0.4 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: earned ? "#222" : "#161616", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px" }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontSize: "12px", fontWeight: 500, color: earned ? "#ccc" : "#333", fontFamily: "'Inter', sans-serif" }}>{label}</Typography>
                <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif" }}>{desc}</Typography>
            </Box>
            {earned && <Box sx={{ ml: "auto", width: 6, height: 6, borderRadius: "50%", bgcolor: "#4ade80" }} />}
        </Box>
    );
}

// ── Main Profile ──────────────────────────────────────────────────
export default function Profile() {
    const { user } = useAuth();
    const [history, setHistory]           = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        api.get("/battles/history")
            .then((r) => setHistory(r.data))
            .catch(() => setHistory([]))
            .finally(() => setLoadingHistory(false));
    }, []);

    const wins    = history.filter((m) => m.result === "WIN").length;
    const losses  = history.filter((m) => m.result === "LOSS").length;
    const total   = history.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const rank    = getRank(user?.rating ?? 1000);
    const prevAt  = RANK_PREV[rank.label] ?? 0;
    const rankPct = rank.nextAt
        ? Math.min(100, Math.round(((user?.rating - prevAt) / (rank.nextAt - prevAt)) * 100))
        : 100;

    const streak  = calcStreak(history);

    // difficulty breakdown from history
    const easyWins   = history.filter((m) => m.result === "WIN" && m.problemDifficulty === "EASY").length;
    const mediumWins = history.filter((m) => m.result === "WIN" && m.problemDifficulty === "MEDIUM").length;
    const hardWins   = history.filter((m) => m.result === "WIN" && m.problemDifficulty === "HARD").length;

    // badges
    const badges = [
        { icon: "⚔️", label: "First Blood",   desc: "Win your first battle",       earned: wins >= 1 },
        { icon: "🔥", label: "On Fire",        desc: "Win 3 battles in a row",      earned: streak.best >= 3 },
        { icon: "💎", label: "Diamond Hands",  desc: "Reach Diamond rank",          earned: (user?.rating ?? 0) >= 1400 },
        { icon: "🧠", label: "Big Brain",      desc: "Solve a Hard problem",        earned: hardWins >= 1 },
        { icon: "⚡", label: "Speed Demon",    desc: "Win 10 battles total",        earned: wins >= 10 },
        { icon: "👑", label: "Grandmaster",    desc: "Reach 2000+ rating",          earned: (user?.rating ?? 0) >= 2000 },
    ];

    const statCards = [
        { label: "Rating",   value: user?.rating,  icon: <EmojiEventsIcon sx={{ fontSize: 16, color: "#666" }} /> },
        { label: "Wins",     value: wins,           icon: <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#666" }} />, loading: loadingHistory },
        { label: "Losses",   value: losses,         icon: <CancelOutlinedIcon sx={{ fontSize: 16, color: "#666" }} />, loading: loadingHistory },
        { label: "Win Rate", value: `${winRate}%`,  icon: <BoltIcon sx={{ fontSize: 16, color: "#666" }} />, loading: loadingHistory },
    ];

    return (
        <Layout>
            <Box sx={{ maxWidth: "860px", mx: "auto", mt: "64px", px: { xs: 3, sm: 4 }, pb: 8, fontFamily: "'Inter', sans-serif" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>

                {/* Page header */}
                <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#b0b0b0" }} />
                        <Typography sx={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
                            Profile
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: { xs: "22px", sm: "26px" }, fontWeight: 500, color: "#e8e8e8", letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif", mb: "4px" }}>
                        {user?.username}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <GitHubIcon sx={{ fontSize: 13, color: "#444" }} />
                        <Typography sx={{ fontSize: "13px", color: "#444", fontFamily: "'Inter', sans-serif", textTransform: "capitalize" }}>
                            {user?.provider}
                        </Typography>
                    </Box>
                </Box>

                {/* Avatar + rank card */}
                <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "14px", p: "20px 24px", display: "flex", alignItems: "center", gap: "20px", mb: "16px", position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%)", pointerEvents: "none" } }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: "14px", background: "#222", border: "0.5px solid #2e2e2e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "22px", fontWeight: 600, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                            {user?.username?.[0]?.toUpperCase()}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#d8d8d8", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em", mb: "4px" }}>
                            {user?.username}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 0 2px rgba(74,222,128,0.15)" }} />
                            <Typography sx={{ fontSize: "12px", color: "#444", fontFamily: "'Inter', sans-serif" }}>Online</Typography>
                        </Box>
                    </Box>
                    {/* Rank badge */}
                    <Box sx={{ textAlign: "right" }}>
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: "6px", bgcolor: "#111", border: `0.5px solid ${rank.color}22`, borderRadius: "8px", px: "10px", py: "5px", mb: "6px" }}>
                            <WorkspacePremiumIcon sx={{ fontSize: 13, color: rank.color }} />
                            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: rank.color, fontFamily: "'Inter', sans-serif" }}>
                                {rank.label}
                            </Typography>
                        </Box>
                        {rank.nextAt && (
                            <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif" }}>
                                {rank.nextAt - (user?.rating ?? 0)} pts to {rank.next}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Rank progress bar */}
                {rank.nextAt && (
                    <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "10px", p: "14px 18px", mb: "16px" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: "8px" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <TrendingUpIcon sx={{ fontSize: 13, color: "#555" }} />
                                <Typography sx={{ fontSize: "12px", color: "#666", fontFamily: "'Inter', sans-serif" }}>
                                    Progress to {rank.next}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 500, color: rank.color, fontFamily: "'Inter', sans-serif" }}>
                                {user?.rating} / {rank.nextAt}
                            </Typography>
                        </Box>
                        <Box sx={{ height: 6, bgcolor: "#1a1a1a", borderRadius: "4px", overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${rankPct}%`, bgcolor: rank.color, borderRadius: "4px", transition: "width 1s ease", opacity: 0.8 }} />
                        </Box>
                        <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "6px" }}>
                            {rankPct}% of the way there
                        </Typography>
                    </Box>
                )}

                {/* Stat cards */}
                <Grid container spacing={1.5} sx={{ mb: "16px" }}>
                    {statCards.map((s) => (
                        <Grid item xs={6} sm={3} key={s.label}>
                            <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", p: "16px", position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)", pointerEvents: "none" } }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: "7px", background: "#222", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", mb: "12px" }}>
                                    {s.icon}
                                </Box>
                                <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#d8d8d8", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", mb: "2px" }}>
                                    {s.loading && loadingHistory
                                        ? <Skeleton width={32} sx={{ bgcolor: "#222" }} />
                                        : s.value}
                                </Typography>
                                <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Streak + Difficulty row */}
                <Grid container spacing={1.5} sx={{ mb: "16px" }}>

                    {/* Streak card */}
                    <Grid item xs={12} sm={5}>
                        <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", p: "16px 18px", height: "100%" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "14px" }}>
                                <WhatshotIcon sx={{ fontSize: 14, color: "#555" }} />
                                <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#666", fontFamily: "'Inter', sans-serif" }}>
                                    Streak
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", gap: "24px" }}>
                                <Box>
                                    <Typography sx={{ fontSize: "28px", fontWeight: 600, color: streak.current > 0 ? "#fb923c" : "#2a2a2a", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>
                                        {streak.current}
                                    </Typography>
                                    <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Current
                                    </Typography>
                                </Box>
                                <Box sx={{ width: "0.5px", bgcolor: "#1e1e1e" }} />
                                <Box>
                                    <Typography sx={{ fontSize: "28px", fontWeight: 600, color: "#555", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>
                                        {streak.best}
                                    </Typography>
                                    <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Best
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif", mt: "12px" }}>
                                {streak.current > 0 ? `🔥 ${streak.current} day streak!` : "Play today to start a streak"}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Difficulty breakdown */}
                    <Grid item xs={12} sm={7}>
                        <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", p: "16px 18px", height: "100%" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "14px" }}>
                                <CodeIcon sx={{ fontSize: 14, color: "#555" }} />
                                <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#666", fontFamily: "'Inter', sans-serif" }}>
                                    Problems Won
                                </Typography>
                            </Box>
                            {loadingHistory ? (
                                Array(3).fill(0).map((_, i) => <Skeleton key={i} height={14} sx={{ bgcolor: "#222", mb: "12px" }} />)
                            ) : (
                                <>
                                    <DiffBar label="Easy"   count={easyWins}   total={wins || 1} color="#4ade80" />
                                    <DiffBar label="Medium" count={mediumWins} total={wins || 1} color="#f59e0b" />
                                    <DiffBar label="Hard"   count={hardWins}   total={wins || 1} color="#f87171" />
                                </>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                {/* Badges */}
                <Box sx={{ mb: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <WorkspacePremiumIcon sx={{ fontSize: 14, color: "#555" }} />
                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                        Badges
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>
                        {badges.filter(b => b.earned).length}/{badges.length} earned
                    </Typography>
                </Box>
                <Grid container spacing={1.5} sx={{ mb: "20px" }}>
                    {badges.map((b) => (
                        <Grid item xs={12} sm={6} key={b.label}>
                            <Badge {...b} />
                        </Grid>
                    ))}
                </Grid>

                {/* Match History */}
                <Box sx={{ mb: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CalendarTodayIcon sx={{ fontSize: 14, color: "#555" }} />
                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                        Match History
                    </Typography>
                    {!loadingHistory && (
                        <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>
                            {total} battles
                        </Typography>
                    )}
                </Box>

                <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
                    {loadingHistory ? (
                        Array(4).fill(0).map((_, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "16px", py: "13px", borderBottom: "0.5px solid #1e1e1e" }}>
                                <Skeleton width={36} height={14} sx={{ bgcolor: "#222" }} />
                                <Skeleton width="35%" height={14} sx={{ bgcolor: "#222" }} />
                                <Box sx={{ ml: "auto" }}><Skeleton width={50} height={14} sx={{ bgcolor: "#222" }} /></Box>
                            </Box>
                        ))
                    ) : history.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "40px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>No matches played yet</Typography>
                        </Box>
                    ) : (
                        history.map((match, i) => {
                            const isWin = match.result === "WIN";
                            return (
                                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "16px", py: "13px", borderBottom: "0.5px solid #1e1e1e", "&:last-child": { borderBottom: "none" }, "&:hover": { background: "#1a1a1a" }, transition: "background 0.15s" }}>
                                    <Box sx={{ px: "8px", py: "3px", borderRadius: "6px", flexShrink: 0, background: isWin ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `0.5px solid ${isWin ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 500, color: isWin ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em" }}>
                                            {match.result}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: "13px", color: "#888", fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            vs <Box component="span" sx={{ color: "#bbb", fontWeight: 500 }}>{match.opponent}</Box>
                                        </Typography>
                                        {match.problemTitle && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: "2px" }}>
                                                <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {match.problemTitle}
                                                </Typography>
                                                {match.problemDifficulty && (
                                                    <Box sx={{ px: "5px", py: "1px", borderRadius: "4px", bgcolor: match.problemDifficulty === "EASY" ? "rgba(74,222,128,0.08)" : match.problemDifficulty === "MEDIUM" ? "rgba(245,158,11,0.08)" : "rgba(248,113,113,0.08)", flexShrink: 0 }}>
                                                        <Typography sx={{ fontSize: "9px", color: match.problemDifficulty === "EASY" ? "#4ade80" : match.problemDifficulty === "MEDIUM" ? "#f59e0b" : "#f87171", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                                                            {match.problemDifficulty}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                    {match.playedAt && (
                                        <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                                            {new Date(match.playedAt).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })
                    )}
                </Box>

            </Box>
        </Layout>
    );
}