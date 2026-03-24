import { Box, Typography, Skeleton, Drawer, Divider, IconButton, Chip } from "@mui/material";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import HistoryIcon from "@mui/icons-material/History";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PeopleIcon from "@mui/icons-material/People";
import api from "../api/axios";
import { useWebSocket } from "../hooks/useWebSocket";

const RANK_COLORS = ["#f59e0b", "#9ca3af", "#b45309"];
const MEDAL = ["🥇", "🥈", "🥉"];

function getRank(rating) {
    if (rating >= 2000) return { label: "Grandmaster", color: "#f59e0b" };
    if (rating >= 1600) return { label: "Master",      color: "#a78bfa" };
    if (rating >= 1400) return { label: "Diamond",     color: "#67e8f9" };
    if (rating >= 1200) return { label: "Platinum",    color: "#4ade80" };
    if (rating >= 1100) return { label: "Gold",        color: "#facc15" };
    return                     { label: "Silver",      color: "#9ca3af" };
}

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading]         = useState(true);

    const [clashOpen, setClashOpen]         = useState(false);
    const [friends, setFriends]             = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [challenging, setChallenging]     = useState(null);

    const [historyOpen, setHistoryOpen]     = useState(false);
    const [history, setHistory]             = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const { challenge } = useWebSocket((data) => {
        if (data.status === "BATTLE_START") {
            setClashOpen(false);
            navigate("/battle", { state: data });
        }
    });

    useEffect(() => {
        api.get("/leaderboard")
            .then((r) => setLeaderboard(r.data))
            .catch(() => setLeaderboard([]))
            .finally(() => setLoading(false));
    }, []);

    const openClash = () => {
        setClashOpen(true);
        setFriendsLoading(true);
        api.get("/friends")
            .then((r) => setFriends(r.data))
            .finally(() => setFriendsLoading(false));
    };

    const openHistory = () => {
        setHistoryOpen(true);
        setHistoryLoading(true);
        api.get("/battles/history")
            .then((r) => setHistory(r.data))
            .finally(() => setHistoryLoading(false));
    };

    const handleChallenge = (friendId) => {
        setChallenging(friendId);
        challenge(friendId);
        setTimeout(() => setChallenging(null), 5000);
    };

    const handleRevenge = (opponentId, opponentUsername) => {
        setHistoryOpen(false);
        setClashOpen(true);
        setFriends([{ id: opponentId, username: opponentUsername, rating: "?" }]);
    };

    const rank     = getRank(user?.rating ?? 1000);
    const userRank = leaderboard.findIndex((u) => u.username === user?.username) + 1;
    const wins     = history.filter((h) => h.result === "WIN").length;
    const top3     = leaderboard.slice(0, 3);
    const rest     = leaderboard.slice(3);

    return (
        <Layout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@500;600;700&display=swap');
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.3; }
                }
                .fade-up { animation: fadeUp 0.5s ease both; }
                .fade-up-1 { animation-delay: 0.05s; }
                .fade-up-2 { animation-delay: 0.12s; }
                .fade-up-3 { animation-delay: 0.20s; }
                .action-btn:hover { transform: translateY(-1px); }
                .action-btn { transition: transform 0.15s ease, background 0.15s ease !important; }
                .leaderboard-row:hover { background: #161616 !important; }
            `}</style>

            <Box sx={{
                maxWidth: "1100px", mx: "auto",
                mt: "64px", px: { xs: 2, sm: 4 }, pb: 8,
                fontFamily: "'Syne', sans-serif",
            }}>

                {/* ── Two-column layout ── */}
                <Box sx={{ display: "flex", gap: "24px", alignItems: "flex-start", flexDirection: { xs: "column", md: "row" } }}>

                    {/* ══ LEFT COLUMN ══ */}
                    <Box sx={{ flex: "0 0 340px", width: { xs: "100%", md: "340px" } }}>

                        {/* Welcome header */}
                        <Box className="fade-up fade-up-1" sx={{ mb: "20px" }}>
                            <Typography sx={{ fontSize: "11px", color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", mb: "6px" }}>
                                Dashboard
                            </Typography>
                            <Typography sx={{ fontSize: "28px", fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif", lineHeight: 1.1 }}>
                                Hey, {user?.username}
                            </Typography>
                            <Typography sx={{ fontSize: "13px", color: "#3a3a3a", fontFamily: "'DM Mono', monospace", mt: "6px" }}>
                                Ready to clash?
                            </Typography>
                        </Box>

                        {/* User card */}
                        <Box className="fade-up fade-up-2" sx={{
                            background: "#111", border: "0.5px solid #222",
                            borderRadius: "14px", p: "20px", mb: "14px",
                            position: "relative", overflow: "hidden",
                            "&::after": {
                                content: '""', position: "absolute",
                                top: 0, left: 0, right: 0, height: "2px",
                                background: `linear-gradient(90deg, transparent, ${rank.color}66, transparent)`,
                            }
                        }}>
                            {/* Avatar row */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: "14px", mb: "18px" }}>
                                <Box sx={{
                                    width: 48, height: 48, borderRadius: "12px",
                                    background: `${rank.color}15`,
                                    border: `1px solid ${rank.color}30`,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <Typography sx={{ fontSize: "18px", fontWeight: 700, color: rank.color, fontFamily: "'Syne', sans-serif" }}>
                                        {user?.username?.[0]?.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box flex={1}>
                                    <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#ddd", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em" }}>
                                        {user?.username}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mt: "3px" }}>
                                        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#4ade80", animation: "pulse-dot 2s ease infinite" }} />
                                        <Typography sx={{ fontSize: "11px", color: "#3a3a3a", fontFamily: "'DM Mono', monospace" }}>Online</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: "right" }}>
                                    <Box sx={{
                                        display: "inline-flex", alignItems: "center", gap: "5px",
                                        bgcolor: `${rank.color}12`, border: `0.5px solid ${rank.color}30`,
                                        borderRadius: "7px", px: "9px", py: "4px",
                                    }}>
                                        <WorkspacePremiumIcon sx={{ fontSize: 11, color: rank.color }} />
                                        <Typography sx={{ fontSize: "11px", fontWeight: 600, color: rank.color, fontFamily: "'DM Mono', monospace" }}>
                                            {rank.label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Stats row */}
                            <Box sx={{ display: "flex", gap: "1px", borderRadius: "10px", overflow: "hidden", border: "0.5px solid #1e1e1e" }}>
                                {[
                                    { label: "Rating", value: user?.rating ?? "—" },
                                    { label: "Rank",   value: userRank > 0 ? `#${userRank}` : "—" },
                                ].map((s) => (
                                    <Box key={s.label} sx={{ flex: 1, bgcolor: "#0d0d0d", px: "14px", py: "12px", textAlign: "center" }}>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#ccc", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>
                                            {s.value}
                                        </Typography>
                                        <Typography sx={{ fontSize: "10px", color: "#2e2e2e", fontFamily: "'DM Mono', monospace", mt: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            {s.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Action buttons */}
                        <Box className="fade-up fade-up-3" sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {/* Clash — primary */}
                            <Box component="button" className="action-btn" onClick={openClash} sx={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                width: "100%", background: "#e8e8e8", border: "none",
                                color: "#111", py: "13px", borderRadius: "11px",
                                fontSize: "14px", fontWeight: 600, cursor: "pointer",
                                fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em",
                                "&:hover": { background: "#f0f0f0" },
                            }}>
                                <SportsEsportsIcon sx={{ fontSize: 17 }} />
                                Start a Clash
                            </Box>

                            {/* History — secondary */}
                            <Box component="button" className="action-btn" onClick={openHistory} sx={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                width: "100%", background: "#111", border: "0.5px solid #222",
                                color: "#666", py: "12px", borderRadius: "11px",
                                fontSize: "13px", fontWeight: 500, cursor: "pointer",
                                fontFamily: "'Syne', sans-serif",
                                "&:hover": { background: "#161616", color: "#888" },
                            }}>
                                <HistoryIcon sx={{ fontSize: 15 }} />
                                Battle History
                            </Box>

                            {/* Friends shortcut */}
                            <Box component="button" className="action-btn" onClick={() => navigate("/friends")} sx={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                width: "100%", background: "#111", border: "0.5px solid #222",
                                color: "#666", py: "12px", borderRadius: "11px",
                                fontSize: "13px", fontWeight: 500, cursor: "pointer",
                                fontFamily: "'Syne', sans-serif",
                                "&:hover": { background: "#161616", color: "#888" },
                            }}>
                                <PeopleIcon sx={{ fontSize: 15 }} />
                                Manage Friends
                            </Box>
                        </Box>
                    </Box>

                    {/* ══ RIGHT COLUMN — Leaderboard ══ */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>

                        {/* Leaderboard header */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "16px", mt: { xs: "8px", md: "0" } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <EmojiEventsIcon sx={{ fontSize: 15, color: "#555" }} />
                                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#777", fontFamily: "'Syne', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                    Leaderboard
                                </Typography>
                            </Box>
                            {userRank > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: "5px", bgcolor: "#111", border: "0.5px solid #222", borderRadius: "7px", px: "10px", py: "4px" }}>
                                    <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'DM Mono', monospace" }}>you</Typography>
                                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#888", fontFamily: "'DM Mono', monospace" }}>#{userRank}</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Top 3 podium */}
                        {loading ? (
                            <Box sx={{ display: "flex", gap: "10px", mb: "12px" }}>
                                {[0,1,2].map(i => <Skeleton key={i} variant="rounded" height={110} sx={{ bgcolor: "#161616", borderRadius: "12px", flex: 1 }} />)}
                            </Box>
                        ) : top3.length > 0 && (
                            <Box sx={{ display: "flex", gap: "10px", mb: "12px" }}>
                                {top3.map((player, i) => {
                                    const rc    = RANK_COLORS[i];
                                    const isMe  = player.username === user?.username;
                                    return (
                                        <Box key={player.username} sx={{
                                            flex: 1, background: "#0f0f0f",
                                            border: `0.5px solid ${isMe ? "#2e2e2e" : "#1a1a1a"}`,
                                            borderRadius: "12px", p: "16px 12px", textAlign: "center",
                                            position: "relative", overflow: "hidden",
                                            "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: rc },
                                        }}>
                                            <Typography sx={{ fontSize: "18px", mb: "8px", lineHeight: 1 }}>{MEDAL[i]}</Typography>
                                            <Box sx={{
                                                width: 34, height: 34, borderRadius: "9px",
                                                background: `${rc}18`, border: `0.5px solid ${rc}35`,
                                                display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: "8px",
                                            }}>
                                                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: rc, fontFamily: "'Syne', sans-serif" }}>
                                                    {player.username[0].toUpperCase()}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: isMe ? "#e8e8e8" : "#888", fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {player.username}
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", mt: "5px" }}>
                                                <BoltIcon sx={{ fontSize: 10, color: "#333" }} />
                                                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#555", fontFamily: "'DM Mono', monospace" }}>{player.rating}</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}

                        {/* Rest of list */}
                        <Box sx={{ background: "#0f0f0f", border: "0.5px solid #1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "16px", py: "11px", borderBottom: "0.5px solid #161616" }}>
                                        <Skeleton width={22} height={13} sx={{ bgcolor: "#1a1a1a" }} />
                                        <Skeleton variant="rounded" width={28} height={28} sx={{ bgcolor: "#1a1a1a", borderRadius: "8px" }} />
                                        <Skeleton width="28%" height={13} sx={{ bgcolor: "#1a1a1a" }} />
                                        <Box sx={{ ml: "auto" }}><Skeleton width={36} height={13} sx={{ bgcolor: "#1a1a1a" }} /></Box>
                                    </Box>
                                ))
                            ) : rest.length === 0 && leaderboard.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: "36px" }}>
                                    <Typography sx={{ fontSize: "13px", color: "#222", fontFamily: "'DM Mono', monospace" }}>No data yet</Typography>
                                </Box>
                            ) : (
                                rest.map((player, i) => {
                                    const isMe = player.username === user?.username;
                                    return (
                                        <Box key={player.username} className="leaderboard-row" sx={{
                                            display: "flex", alignItems: "center", gap: "12px",
                                            px: "16px", py: "11px",
                                            borderBottom: "0.5px solid #141414",
                                            background: isMe ? "#131313" : "transparent",
                                            "&:last-child": { borderBottom: "none" },
                                            transition: "background 0.15s",
                                        }}>
                                            <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'DM Mono', monospace", width: "22px", textAlign: "right", flexShrink: 0 }}>
                                                {i + 4}
                                            </Typography>
                                            <Box sx={{
                                                width: 28, height: 28, borderRadius: "8px",
                                                background: isMe ? "#1e1e1e" : "#141414",
                                                border: `0.5px solid ${isMe ? "#2e2e2e" : "#1e1e1e"}`,
                                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                            }}>
                                                <Typography sx={{ fontSize: "11px", fontWeight: 700, color: isMe ? "#888" : "#555", fontFamily: "'Syne', sans-serif" }}>
                                                    {player.username[0].toUpperCase()}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: "13px", color: isMe ? "#ddd" : "#666", fontFamily: "'Syne', sans-serif", fontWeight: isMe ? 600 : 400, flex: 1 }}>
                                                {player.username}
                                                {isMe && <Box component="span" sx={{ ml: "6px", fontSize: "10px", color: "#333", fontWeight: 400, fontFamily: "'DM Mono', monospace" }}>you</Box>}
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <BoltIcon sx={{ fontSize: 10, color: "#2a2a2a" }} />
                                                <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#444", fontFamily: "'DM Mono', monospace" }}>{player.rating}</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ⚔️ CLASH DRAWER */}
            <Drawer anchor="right" open={clashOpen} onClose={() => setClashOpen(false)}
                    PaperProps={{ sx: { width: 340, bgcolor: "#0c0c0c", borderLeft: "0.5px solid #1e1e1e" } }}>
                <Box sx={{ p: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#e8e8e8", fontFamily: "'Syne', sans-serif", mb: "3px" }}>
                            Challenge a Friend
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'DM Mono', monospace" }}>
                            Pick a friend to battle
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setClashOpen(false)} sx={{ color: "#333", mt: "-2px" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Divider sx={{ borderColor: "#161616" }} />
                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    {friendsLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "20px", py: "13px", borderBottom: "0.5px solid #141414" }}>
                                <Skeleton variant="rounded" width={36} height={36} sx={{ bgcolor: "#161616", borderRadius: "10px" }} />
                                <Box flex={1}>
                                    <Skeleton width="50%" height={13} sx={{ bgcolor: "#161616" }} />
                                    <Skeleton width="28%" height={11} sx={{ bgcolor: "#161616", mt: "5px" }} />
                                </Box>
                                <Skeleton width={72} height={32} sx={{ bgcolor: "#161616", borderRadius: "8px" }} />
                            </Box>
                        ))
                    ) : friends.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "56px", px: "24px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#222", fontFamily: "'Syne', sans-serif", mb: "6px" }}>No friends yet</Typography>
                            <Typography sx={{ fontSize: "11px", color: "#1a1a1a", fontFamily: "'DM Mono', monospace" }}>Add friends from the Friends page first</Typography>
                        </Box>
                    ) : (
                        friends.map((f) => (
                            <Box key={f.id} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "20px", py: "12px", borderBottom: "0.5px solid #141414", "&:hover": { background: "#111" }, transition: "background 0.15s" }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "#141414", border: "0.5px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#666", fontFamily: "'Syne', sans-serif" }}>
                                        {f.username[0].toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box flex={1} sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#bbb", fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {f.username}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mt: "2px" }}>
                                        <BoltIcon sx={{ fontSize: 10, color: "#2a2a2a" }} />
                                        <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'DM Mono', monospace" }}>{f.rating}</Typography>
                                    </Box>
                                </Box>
                                <Box component="button" disabled={challenging === f.id} onClick={() => handleChallenge(f.id)} sx={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    background: challenging === f.id ? "#141414" : "#e8e8e8",
                                    border: "none", color: challenging === f.id ? "#333" : "#111",
                                    px: "12px", py: "7px", borderRadius: "8px", fontSize: "12px",
                                    fontWeight: 600, cursor: challenging === f.id ? "default" : "pointer",
                                    fontFamily: "'Syne', sans-serif", transition: "all 0.15s", flexShrink: 0,
                                    "&:hover": { background: challenging === f.id ? "#141414" : "#d4d4d4" },
                                }}>
                                    <SportsKabaddiIcon sx={{ fontSize: 13 }} />
                                    {challenging === f.id ? "Sent…" : "Challenge"}
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Drawer>

            {/* 📜 HISTORY DRAWER */}
            <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}
                    PaperProps={{ sx: { width: 360, bgcolor: "#0c0c0c", borderLeft: "0.5px solid #1e1e1e" } }}>
                <Box sx={{ p: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#e8e8e8", fontFamily: "'Syne', sans-serif", mb: "3px" }}>
                            Battle History
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'DM Mono', monospace" }}>
                            Your recent clashes
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setHistoryOpen(false)} sx={{ color: "#333", mt: "-2px" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Divider sx={{ borderColor: "#161616" }} />
                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    {historyLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Box key={i} sx={{ px: "20px", py: "14px", borderBottom: "0.5px solid #141414" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: "8px" }}>
                                    <Skeleton width="40%" height={15} sx={{ bgcolor: "#161616" }} />
                                    <Skeleton width="20%" height={15} sx={{ bgcolor: "#161616" }} />
                                </Box>
                                <Skeleton width="60%" height={12} sx={{ bgcolor: "#161616" }} />
                            </Box>
                        ))
                    ) : history.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "56px", px: "24px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#222", fontFamily: "'Syne', sans-serif", mb: "6px" }}>No battles yet</Typography>
                            <Typography sx={{ fontSize: "11px", color: "#1a1a1a", fontFamily: "'DM Mono', monospace" }}>Challenge a friend to get started</Typography>
                        </Box>
                    ) : (
                        history.map((h, i) => {
                            const isWin = h.result === "WIN";
                            return (
                                <Box key={i} sx={{ px: "20px", py: "14px", borderBottom: "0.5px solid #141414", "&:hover": { background: "#0f0f0f" }, transition: "background 0.15s" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "8px" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                            {isWin
                                                ? <EmojiEmotionsIcon sx={{ fontSize: 14, color: "#4ade80" }} />
                                                : <SentimentVeryDissatisfiedIcon sx={{ fontSize: 14, color: "#f87171" }} />
                                            }
                                            <Typography sx={{ fontSize: "13px", fontWeight: 700, color: isWin ? "#4ade80" : "#f87171", fontFamily: "'Syne', sans-serif" }}>
                                                {isWin ? "Victory" : "Defeat"}
                                            </Typography>
                                        </Box>
                                        {h.problemDifficulty && (
                                            <Chip label={h.problemDifficulty} size="small" sx={{
                                                fontSize: "9px", height: "17px",
                                                bgcolor: h.problemDifficulty === "EASY" ? "#14532d18" : h.problemDifficulty === "MEDIUM" ? "#43140718" : "#450a0a18",
                                                color:   h.problemDifficulty === "EASY" ? "#4ade80"   : h.problemDifficulty === "MEDIUM" ? "#fb923c"   : "#f87171",
                                                border: "0.5px solid",
                                                borderColor: h.problemDifficulty === "EASY" ? "#4ade8030" : h.problemDifficulty === "MEDIUM" ? "#fb923c30" : "#f8717130",
                                                fontFamily: "'DM Mono', monospace",
                                            }} />
                                        )}
                                    </Box>

                                    {h.problemTitle && (
                                        <Typography sx={{ fontSize: "12px", color: "#3a3a3a", fontFamily: "'DM Mono', monospace", mb: "10px" }}>
                                            {h.problemTitle}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Box>
                                            <Typography sx={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "'DM Mono', monospace" }}>
                                                vs <Box component="span" sx={{ color: "#555" }}>{h.opponent}</Box>
                                            </Typography>
                                            {h.playedAt && (
                                                <Typography sx={{ fontSize: "10px", color: "#222", fontFamily: "'DM Mono', monospace", mt: "2px" }}>
                                                    {new Date(h.playedAt).toLocaleDateString()}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box component="button" onClick={() => handleRevenge(h.opponentId, h.opponent)} sx={{
                                            display: "flex", alignItems: "center", gap: "4px",
                                            background: isWin ? "#111" : "#1a0808",
                                            border: `0.5px solid ${isWin ? "#1e1e1e" : "#2e1010"}`,
                                            color: isWin ? "#444" : "#f87171",
                                            px: "10px", py: "5px", borderRadius: "7px",
                                            fontSize: "11px", cursor: "pointer",
                                            fontFamily: "'Syne', sans-serif", fontWeight: 600,
                                            transition: "all 0.15s",
                                            "&:hover": { background: isWin ? "#161616" : "#220e0e" },
                                        }}>
                                            <SportsKabaddiIcon sx={{ fontSize: 11 }} />
                                            {isWin ? "Rematch" : "Revenge"}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Drawer>

        </Layout>
    );
}