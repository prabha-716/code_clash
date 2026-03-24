import { Box, Typography, Grid, Skeleton, Drawer, List,
    ListItem, ListItemAvatar, ListItemText, Avatar, Button,
    Chip, Divider, IconButton } from "@mui/material";
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
import api from "../api/axios";
import { useWebSocket } from "../hooks/useWebSocket";

const RANK_COLORS = ["#f59e0b", "#9ca3af", "#b45309"];

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    // Clash drawer
    const [clashOpen, setClashOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [challenging, setChallenging] = useState(null);

    // History drawer
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState([]);
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

    const handleChallenge = (friendId, friendUsername) => {
        setChallenging(friendId);
        challenge(friendId);
        setTimeout(() => setChallenging(null), 5000);
    };

    const handleRevenge = (opponentId, opponentUsername) => {
        setHistoryOpen(false);
        setClashOpen(true);
        setFriends([{ id: opponentId, username: opponentUsername, rating: "?" }]);
    };

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);
    const userRank = leaderboard.findIndex((u) => u.username === user?.username) + 1;

    return (
        <Layout>
            <Box sx={{ maxWidth: "820px", mx: "auto", mt: "64px", px: { xs: 3, sm: 4 }, pb: 8, fontFamily: "'Inter', sans-serif" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>

                {/* Header */}
                <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#b0b0b0" }} />
                        <Typography sx={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
                            Dashboard
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: { xs: "35px", sm: "35px" }, fontWeight: 500, color: "#e8e8e8", letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif", mb: "4px" }}>
                        Welcome back, {user?.username}
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                        Ready to clash?
                    </Typography>
                </Box>

                {/* Quick Actions */}
                <Box sx={{
                    background: "#161616", border: "0.5px solid #252525", borderRadius: "14px",
                    p: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 2, mb: "28px",
                }}>
                    <Box>
                        <Typography sx={{ fontSize: "13px", color: "#555", fontFamily: "'Inter', sans-serif", mb: "2px" }}>Quick actions</Typography>
                        <Typography sx={{ fontSize: "14px", color: "#aaa", fontFamily: "'Inter', sans-serif" }}>Start a new match or view history</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Box component="button" onClick={openHistory} sx={{ display: "flex", alignItems: "center", gap: "6px", background: "#222", border: "0.5px solid #333", color: "#bbb", px: "14px", py: "8px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "background 0.15s", "&:hover": { background: "#2a2a2a" } }}>
                            <HistoryIcon sx={{ fontSize: 15 }} /> History
                        </Box>
                        <Box component="button" onClick={openClash} sx={{ display: "flex", alignItems: "center", gap: "6px", background: "#e8e8e8", border: "none", color: "#111", px: "14px", py: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "background 0.15s", "&:hover": { background: "#d4d4d4" } }}>
                            <SportsEsportsIcon sx={{ fontSize: 15 }} /> Clash
                        </Box>
                    </Box>
                </Box>

                {/* Leaderboard */}
                <Box sx={{ mb: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <EmojiEventsIcon sx={{ fontSize: 16, color: "#555" }} />
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif", letterSpacing: "0.02em" }}>
                            Leaderboard
                        </Typography>
                    </Box>
                    {userRank > 0 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", background: "#161616", border: "0.5px solid #252525", borderRadius: "8px", px: "10px", py: "4px" }}>
                            <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>Your rank</Typography>
                            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif" }}>#{userRank}</Typography>
                        </Box>
                    )}
                </Box>

                {/* Top 3 */}
                {loading ? (
                    <Grid container spacing={1.5} sx={{ mb: "10px" }}>
                        {[0, 1, 2].map((i) => (
                            <Grid item xs={4} key={i}>
                                <Skeleton variant="rounded" height={100} sx={{ bgcolor: "#1a1a1a", borderRadius: "12px" }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : top3.length > 0 && (
                    <Grid container spacing={1.5} sx={{ mb: "10px" }}>
                        {top3.map((player, i) => {
                            const rankColor = RANK_COLORS[i];
                            const isMe = player.username === user?.username;
                            return (
                                <Grid item xs={4} key={player.username}>
                                    <Box sx={{ background: "#161616", border: `0.5px solid ${isMe ? "#3a3a3a" : "#252525"}`, borderRadius: "12px", p: "16px 14px", textAlign: "center", position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%)", pointerEvents: "none" } }}>
                                        <Typography sx={{ fontSize: "11px", fontWeight: 600, color: rankColor, fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em", mb: "8px" }}>#{i + 1}</Typography>
                                        <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: `${rankColor}18`, border: `0.5px solid ${rankColor}30`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: "10px" }}>
                                            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: rankColor, fontFamily: "'Inter', sans-serif" }}>{player.username[0].toUpperCase()}</Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: "12px", fontWeight: 500, color: isMe ? "#e8e8e8" : "#aaa", fontFamily: "'Inter', sans-serif", mb: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.username}</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                            <BoltIcon sx={{ fontSize: 11, color: "#444" }} />
                                            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#666", fontFamily: "'Inter', sans-serif" }}>{player.rating}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Rest of leaderboard */}
                <Box sx={{ background: "#161616", border: "0.5px solid #252525", borderRadius: "12px", overflow: "hidden" }}>
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "16px", py: "11px", borderBottom: "0.5px solid #1e1e1e" }}>
                                <Skeleton width={20} height={14} sx={{ bgcolor: "#222" }} />
                                <Skeleton variant="circular" width={26} height={26} sx={{ bgcolor: "#222" }} />
                                <Skeleton width="30%" height={14} sx={{ bgcolor: "#222" }} />
                                <Box sx={{ ml: "auto" }}><Skeleton width={40} height={14} sx={{ bgcolor: "#222" }} /></Box>
                            </Box>
                        ))
                    ) : rest.length === 0 && leaderboard.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "32px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>No data yet</Typography>
                        </Box>
                    ) : (
                        rest.map((player, i) => {
                            const rank = i + 4;
                            const isMe = player.username === user?.username;
                            return (
                                <Box key={player.username} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "16px", py: "11px", borderBottom: "0.5px solid #1e1e1e", background: isMe ? "#1c1c1c" : "transparent", "&:last-child": { borderBottom: "none" }, transition: "background 0.15s", "&:hover": { background: "#1a1a1a" } }}>
                                    <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif", fontWeight: 500, width: "20px", textAlign: "right", flexShrink: 0 }}>{rank}</Typography>
                                    <Box sx={{ width: 26, height: 26, borderRadius: "7px", background: "#222", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#666", fontFamily: "'Inter', sans-serif" }}>{player.username[0].toUpperCase()}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: "13px", color: isMe ? "#e8e8e8" : "#888", fontFamily: "'Inter', sans-serif", fontWeight: isMe ? 500 : 400, flex: 1 }}>
                                        {player.username}
                                        {isMe && <Box component="span" sx={{ ml: "6px", fontSize: "10px", color: "#444", fontWeight: 400 }}>you</Box>}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <BoltIcon sx={{ fontSize: 11, color: "#333" }} />
                                        <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#555", fontFamily: "'Inter', sans-serif" }}>{player.rating}</Typography>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Box>

            {/* ⚔️ CLASH DRAWER */}
            <Drawer anchor="right" open={clashOpen} onClose={() => setClashOpen(false)}
                    PaperProps={{ sx: { width: 340, bgcolor: "#0f0f0f", borderLeft: "0.5px solid #252525", p: 0 } }}>
                <Box sx={{ p: "20px 20px 12px" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "4px" }}>
                        <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif" }}>
                            Challenge a Friend
                        </Typography>
                        <IconButton size="small" onClick={() => setClashOpen(false)} sx={{ color: "#444" }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                        Pick a friend to start a battle
                    </Typography>
                </Box>

                <Divider sx={{ borderColor: "#1e1e1e" }} />

                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    {friendsLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "20px", py: "12px" }}>
                                <Skeleton variant="rounded" width={36} height={36} sx={{ bgcolor: "#1a1a1a", borderRadius: "10px" }} />
                                <Box flex={1}>
                                    <Skeleton width="50%" height={14} sx={{ bgcolor: "#1a1a1a" }} />
                                    <Skeleton width="30%" height={12} sx={{ bgcolor: "#1a1a1a", mt: "4px" }} />
                                </Box>
                                <Skeleton width={70} height={30} sx={{ bgcolor: "#1a1a1a", borderRadius: "8px" }} />
                            </Box>
                        ))
                    ) : friends.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "48px", px: "20px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#333", fontFamily: "'Inter', sans-serif", mb: "8px" }}>
                                No friends yet
                            </Typography>
                            <Typography sx={{ fontSize: "12px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>
                                Add friends from the Friends page first
                            </Typography>
                        </Box>
                    ) : (
                        friends.map((f) => (
                            <Box key={f.id} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "20px", py: "12px", borderBottom: "0.5px solid #1a1a1a", "&:hover": { background: "#141414" }, transition: "background 0.15s" }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "#1e1e1e", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                                        {f.username[0].toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box flex={1} sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#ccc", fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {f.username}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mt: "2px" }}>
                                        <BoltIcon sx={{ fontSize: 10, color: "#333" }} />
                                        <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>{f.rating}</Typography>
                                    </Box>
                                </Box>
                                <Box component="button"
                                     disabled={challenging === f.id}
                                     onClick={() => handleChallenge(f.id, f.username)}
                                     sx={{ display: "flex", alignItems: "center", gap: "5px", background: challenging === f.id ? "#1a1a1a" : "#e8e8e8", border: "none", color: challenging === f.id ? "#444" : "#111", px: "12px", py: "7px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: challenging === f.id ? "default" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", flexShrink: 0, "&:hover": { background: challenging === f.id ? "#1a1a1a" : "#d4d4d4" } }}>
                                    <SportsKabaddiIcon sx={{ fontSize: 13 }} />
                                    {challenging === f.id ? "Sent..." : "Challenge"}
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Drawer>

            {/* 📜 HISTORY DRAWER */}
            <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}
                    PaperProps={{ sx: { width: 360, bgcolor: "#0f0f0f", borderLeft: "0.5px solid #252525" } }}>
                <Box sx={{ p: "20px 20px 12px" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "4px" }}>
                        <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif" }}>
                            Battle History
                        </Typography>
                        <IconButton size="small" onClick={() => setHistoryOpen(false)} sx={{ color: "#444" }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                        Your recent battles
                    </Typography>
                </Box>

                <Divider sx={{ borderColor: "#1e1e1e" }} />

                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    {historyLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Box key={i} sx={{ px: "20px", py: "14px", borderBottom: "0.5px solid #1a1a1a" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: "8px" }}>
                                    <Skeleton width="40%" height={16} sx={{ bgcolor: "#1a1a1a" }} />
                                    <Skeleton width="20%" height={16} sx={{ bgcolor: "#1a1a1a" }} />
                                </Box>
                                <Skeleton width="60%" height={13} sx={{ bgcolor: "#1a1a1a" }} />
                            </Box>
                        ))
                    ) : history.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "48px", px: "20px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#333", fontFamily: "'Inter', sans-serif" }}>
                                No battles yet
                            </Typography>
                            <Typography sx={{ fontSize: "12px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif", mt: "6px" }}>
                                Challenge a friend to get started
                            </Typography>
                        </Box>
                    ) : (
                        history.map((h, i) => {
                            const isWin = h.result === "WIN";
                            return (
                                <Box key={i} sx={{ px: "20px", py: "14px", borderBottom: "0.5px solid #1a1a1a", "&:hover": { background: "#141414" }, transition: "background 0.15s" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: "8px" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {isWin
                                                ? <EmojiEmotionsIcon sx={{ fontSize: 15, color: "#4ade80" }} />
                                                : <SentimentVeryDissatisfiedIcon sx={{ fontSize: 15, color: "#f87171" }} />
                                            }
                                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: isWin ? "#4ade80" : "#f87171", fontFamily: "'Inter', sans-serif" }}>
                                                {isWin ? "Victory" : "Defeat"}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={h.problemDifficulty}
                                            size="small"
                                            sx={{
                                                fontSize: "10px", height: "18px",
                                                bgcolor: h.problemDifficulty === "EASY" ? "#14532d22" : h.problemDifficulty === "MEDIUM" ? "#43140722" : "#450a0a22",
                                                color: h.problemDifficulty === "EASY" ? "#4ade80" : h.problemDifficulty === "MEDIUM" ? "#fb923c" : "#f87171",
                                                border: "0.5px solid",
                                                borderColor: h.problemDifficulty === "EASY" ? "#4ade8033" : h.problemDifficulty === "MEDIUM" ? "#fb923c33" : "#f8717133",
                                            }}
                                        />
                                    </Box>

                                    <Typography sx={{ fontSize: "12px", color: "#555", fontFamily: "'Inter', sans-serif", mb: "2px" }}>
                                        {h.problemTitle}
                                    </Typography>

                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "10px" }}>
                                        <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif" }}>
                                            vs <Box component="span" sx={{ color: "#666" }}>{h.opponent}</Box>
                                        </Typography>
                                        <Box component="button"
                                             onClick={() => handleRevenge(h.opponentId, h.opponent)}
                                             sx={{ display: "flex", alignItems: "center", gap: "4px", background: isWin ? "#141414" : "#1e0a0a", border: `0.5px solid ${isWin ? "#252525" : "#3a1212"}`, color: isWin ? "#555" : "#f87171", px: "10px", py: "5px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", "&:hover": { background: isWin ? "#1a1a1a" : "#2a1010" } }}>
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