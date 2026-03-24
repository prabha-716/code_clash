import { Box, Typography, Grid, Skeleton, Tooltip } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GitHubIcon from "@mui/icons-material/GitHub";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import api from "../api/axios";

// ── Constants ────────────────────────────────────────────────────
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL   = 16;
const GAP    = 4;
const WEEKS  = 26; // last 26 weeks displayed

// ── Helpers ──────────────────────────────────────────────────────
function buildWeeklyGrid(heatmapData) {
    // Build day-level count map
    const dayMap = {};
    heatmapData.forEach(({ date, count }) => { dayMap[date] = count; });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find Sunday of the current week
    const endSunday = new Date(today);
    endSunday.setDate(today.getDate() - today.getDay() + 6); // end on Saturday

    // Go back WEEKS weeks
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7); // Sunday of first week

    const grid = []; // grid[weekIndex][dayIndex 0=Sun..6=Sat]

    const cur = new Date(startDate);
    while (cur <= today || (grid.length > 0 && grid[grid.length - 1].length < 7)) {
        if (grid.length === 0 || grid[grid.length - 1].length === 7) {
            grid.push([]);
        }
        const isFuture = cur > today;
        const key = cur.toISOString().slice(0, 10);
        const weekStart = new Date(cur);
        weekStart.setDate(cur.getDate() - cur.getDay());
        grid[grid.length - 1].push({
            date: new Date(cur),
            key,
            count: isFuture ? null : (dayMap[key] ?? 0),
            isFuture,
        });
        cur.setDate(cur.getDate() + 1);
    }

    // Compute week-level totals and labels
    const weeks = grid.map((days, wi) => {
        const total = days.reduce((s, d) => s + (d.count || 0), 0);
        const firstReal = days.find((d) => !d.isFuture);
        const sundayDate = firstReal ? firstReal.date : days[0].date;
        const label = sundayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return { days, total, label, wi };
    });

    return weeks;
}

function weekCellColor(count) {
    if (count === null || count === undefined) return "transparent";
    if (count === 0)  return "#1a1a1a";
    if (count <= 2)   return "#252525";
    if (count <= 5)   return "#3a3a3a";
    if (count <= 10)  return "#666";
    if (count <= 18)  return "#aaa";
    return "#e0e0e0";
}

function dayCellColor(count) {
    if (count === null || count === undefined) return "transparent";
    if (count === 0) return "#1a1a1a";
    if (count === 1) return "#2a2a2a";
    if (count === 2) return "#3d3d3d";
    if (count <= 4)  return "#666";
    return "#d4d4d4";
}

// ── Heatmap component ────────────────────────────────────────────
function ActivityHeatmap({ heatmapData, loading }) {
    const weeks = useMemo(() => buildWeeklyGrid(heatmapData), [heatmapData]);
    const [hoveredWeek, setHoveredWeek] = useState(null);

    const totalMatches = heatmapData.reduce((s, d) => s + d.count, 0);
    const totalActive  = heatmapData.filter((d) => d.count > 0).length;
    const bestWeek     = weeks.reduce((best, w) => w.total > (best?.total ?? 0) ? w : best, null);

    if (loading) {
        return (
            <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "14px", p: "24px", mb: "20px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: "20px" }}>
                    <Skeleton width={80} height={14} sx={{ bgcolor: "#222" }} />
                    <Skeleton width={120} height={14} sx={{ bgcolor: "#222" }} />
                </Box>
                <Skeleton variant="rounded" width="100%" height={140} sx={{ bgcolor: "#1a1a1a", borderRadius: "8px" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "14px", p: "24px", mb: "20px" }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "20px", flexWrap: "wrap", gap: "10px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <LocalFireDepartmentIcon sx={{ fontSize: 14, color: "#555" }} />
                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                        Weekly Activity
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#2e2e2e", fontFamily: "'Inter', sans-serif" }}>
                        · last {WEEKS} weeks
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: "16px" }}>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>{totalMatches}</Typography>
                        <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "2px" }}>matches</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>{totalActive}</Typography>
                        <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "2px" }}>active days</Typography>
                    </Box>
                    {bestWeek && bestWeek.total > 0 && (
                        <Box sx={{ textAlign: "center" }}>
                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>{bestWeek.total}</Typography>
                            <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "2px" }}>best week</Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Grid — each column = 1 week, each row = day of week */}
            <Box sx={{ overflowX: "auto", pb: "4px" }}>
                <Box sx={{ display: "inline-flex", gap: 0, minWidth: "max-content" }}>

                    {/* Day-of-week labels */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, mr: "10px", mt: "26px" }}>
                        {WEEK_LABELS.map((label, i) => (
                            <Box key={i} sx={{ height: `${CELL}px`, display: "flex", alignItems: "center" }}>
                                <Typography sx={{ fontSize: "10px", color: "#2e2e2e", fontFamily: "'Inter', sans-serif", width: "28px", textAlign: "right", lineHeight: 1 }}>
                                    {label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Week columns */}
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {/* Week-start date labels */}
                        <Box sx={{ display: "flex", gap: `${GAP}px`, mb: "6px", height: "18px" }}>
                            {weeks.map((week, wi) => (
                                <Box
                                    key={wi}
                                    sx={{ width: `${CELL}px`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    {/* Show label every 4 weeks */}
                                    {wi % 4 === 0 && (
                                        <Typography sx={{ fontSize: "9px", color: hoveredWeek === wi ? "#888" : "#2e2e2e", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", transform: "rotate(-45deg)", transformOrigin: "left center", lineHeight: 1 }}>
                                            {week.label}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>

                        {/* Day cells per week */}
                        <Box sx={{ display: "flex", gap: `${GAP}px` }}>
                            {weeks.map((week, wi) => (
                                <Box
                                    key={wi}
                                    onMouseEnter={() => setHoveredWeek(wi)}
                                    onMouseLeave={() => setHoveredWeek(null)}
                                    sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}
                                >
                                    {week.days.map((day, di) => (
                                        <Tooltip
                                            key={di}
                                            title={day.isFuture ? "" : `${day.count} match${day.count !== 1 ? "es" : ""} · ${day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
                                            placement="top"
                                            arrow
                                            disableHoverListener={day.isFuture}
                                        >
                                            <Box
                                                sx={{
                                                    width: `${CELL}px`,
                                                    height: `${CELL}px`,
                                                    borderRadius: "3px",
                                                    background: dayCellColor(day.count),
                                                    border: (!day.isFuture && day.count === 0) ? "0.5px solid #252525" : "none",
                                                    outline: hoveredWeek === wi ? "0.5px solid #3a3a3a" : "none",
                                                    flexShrink: 0,
                                                    transition: "all 0.1s",
                                                    cursor: day.count > 0 ? "pointer" : "default",
                                                }}
                                            />
                                        </Tooltip>
                                    ))}
                                    {/* Week total bar at bottom */}
                                    <Tooltip title={`Week of ${week.label} · ${week.total} total`} placement="bottom" arrow>
                                        <Box
                                            sx={{
                                                width: `${CELL}px`,
                                                height: "4px",
                                                borderRadius: "2px",
                                                background: weekCellColor(week.total),
                                                mt: "2px",
                                                cursor: "default",
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "16px", flexWrap: "wrap", gap: "8px" }}>
                <Typography sx={{ fontSize: "10px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>
                    Hover a column to highlight the week · bar below = weekly total
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Typography sx={{ fontSize: "9px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif", mr: "2px" }}>Less</Typography>
                    {[0, 1, 2, 3, 5].map((v) => (
                        <Box key={v} sx={{ width: 12, height: 12, borderRadius: "3px", background: dayCellColor(v), border: v === 0 ? "0.5px solid #252525" : "none" }} />
                    ))}
                    <Typography sx={{ fontSize: "9px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif", ml: "2px" }}>More</Typography>
                </Box>
            </Box>
        </Box>
    );
}

// ── Profile page ─────────────────────────────────────────────────
export default function Profile() {
    const { user } = useAuth();
    const [history, setHistory]         = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loadingHistory, setLoadingHistory]   = useState(true);
    const [loadingHeatmap, setLoadingHeatmap]   = useState(true);

    useEffect(() => {
        // Match history
        api.get("/battles/history")
            .then((r) => setHistory(r.data))
            .catch(() => setHistory([]))
            .finally(() => setLoadingHistory(false));

        // Dedicated heatmap endpoint → [{ date: "YYYY-MM-DD", count: N }]
        api.get("/battles/heatmap")
            .then((r) => setHeatmapData(r.data))
            .catch(() => setHeatmapData([]))
            .finally(() => setLoadingHeatmap(false));
    }, []);

    const wins    = history.filter((m) => m.result === "WIN").length;
    const losses  = history.filter((m) => m.result === "LOSS").length;
    const winRate = history.length > 0 ? Math.round((wins / history.length) * 100) : 0;

    const statCards = [
        { label: "Rating",   value: user?.rating,  icon: <EmojiEventsIcon sx={{ fontSize: 16, color: "#666" }} />, loadFromHistory: false },
        { label: "Wins",     value: wins,           icon: <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#666" }} />, loadFromHistory: true },
        { label: "Losses",   value: losses,         icon: <CancelOutlinedIcon sx={{ fontSize: 16, color: "#666" }} />, loadFromHistory: true },
        { label: "Win Rate", value: `${winRate}%`,  icon: <BoltIcon sx={{ fontSize: 16, color: "#666" }} />, loadFromHistory: true },
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

                {/* Avatar card */}
                <Box sx={{
                    background: "#161616", border: "0.5px solid #252525", borderRadius: "14px",
                    p: "20px 24px", display: "flex", alignItems: "center", gap: "20px",
                    mb: "16px", position: "relative", overflow: "hidden",
                    "&::before": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%)", pointerEvents: "none" },
                }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: "14px", background: "#222", border: "0.5px solid #2e2e2e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "22px", fontWeight: 600, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                            {user?.username?.[0]?.toUpperCase()}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#d8d8d8", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em", mb: "4px" }}>
                            {user?.username}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 0 2px rgba(74,222,128,0.15)" }} />
                            <Typography sx={{ fontSize: "12px", color: "#444", fontFamily: "'Inter', sans-serif" }}>Online</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Stat cards */}
                <Grid container spacing={1.5} sx={{ mb: "16px" }}>
                    {statCards.map((s) => (
                        <Grid item xs={6} sm={3} key={s.label}>
                            <Box sx={{
                                background: "#161616", border: "0.5px solid #252525", borderRadius: "12px",
                                p: "16px", position: "relative", overflow: "hidden",
                                "&::before": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)", pointerEvents: "none" },
                            }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: "7px", background: "#222", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", mb: "12px" }}>
                                    {s.icon}
                                </Box>
                                <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#d8d8d8", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", mb: "2px" }}>
                                    {s.loadFromHistory && loadingHistory
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

                {/* Activity Heatmap — driven by /battles/heatmap */}
                <ActivityHeatmap heatmapData={heatmapData} loading={loadingHeatmap} />

                {/* Match History */}
                <Box sx={{ mb: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CalendarTodayIcon sx={{ fontSize: 14, color: "#555" }} />
                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                        Match History
                    </Typography>
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
                                <Box key={i} sx={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    px: "16px", py: "13px",
                                    borderBottom: "0.5px solid #1e1e1e",
                                    "&:last-child": { borderBottom: "none" },
                                    "&:hover": { background: "#1a1a1a" },
                                    transition: "background 0.15s",
                                }}>
                                    <Box sx={{
                                        px: "8px", py: "3px", borderRadius: "6px", flexShrink: 0,
                                        background: isWin ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
                                        border: `0.5px solid ${isWin ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                                    }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 500, color: isWin ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em" }}>
                                            {match.result}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: "13px", color: "#888", fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            vs <Box component="span" sx={{ color: "#bbb", fontWeight: 500 }}>{match.opponent}</Box>
                                        </Typography>
                                        {match.problem && (
                                            <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif", mt: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {match.problem}
                                            </Typography>
                                        )}
                                    </Box>
                                    {match.ratingChange != null && (
                                        <Typography sx={{ fontSize: "12px", fontWeight: 500, color: match.ratingChange >= 0 ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                                            {match.ratingChange >= 0 ? "+" : ""}{match.ratingChange}
                                        </Typography>
                                    )}
                                    {match.date && (
                                        <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                                            {new Date(match.date).toLocaleDateString()}
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