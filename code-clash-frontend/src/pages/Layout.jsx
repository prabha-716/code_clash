import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import TerminalIcon from "@mui/icons-material/Terminal";
import GridViewIcon from "@mui/icons-material/GridView";
import PeopleIcon from "@mui/icons-material/People";
import CodeIcon from "@mui/icons-material/Code";
import PersonIcon from "@mui/icons-material/Person";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LogoutIcon from "@mui/icons-material/Logout";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckIcon from "@mui/icons-material/Check";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import api from "../api/axios";
import { useWebSocket } from "../hooks/useWebSocket";
import ChallengeNotification from "../components/ChallengeNotification";

const SIDEBAR_W = 64;
const FRIENDS_W = 280;

export default function Layout({ children, fullscreen = false }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [friendsOpen, setFriendsOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [addId, setAddId] = useState("");
    const [msg, setMsg] = useState("");
    const [challenging, setChallenging] = useState(null);
    const [incomingChallenge, setIncomingChallenge] = useState(null);
    const [snackMsg, setSnackMsg] = useState("");

    const handleWsMessage = useCallback((data) => {
        const type = data.type || data.status;
        console.log("📨 WS Message received:", type, data); // ✅ add this

        if (type === "BATTLE_START") {
            console.log("🏟️ Navigating to battle:", data); // ✅ add this
            navigate("/battle", { state: data });
        } else if (type === "CHALLENGE_REQUEST") {
            setIncomingChallenge(data);
        } else if (type === "CHALLENGE_SENT") {
            setSnackMsg(`Challenge sent to ${data.toUsername}!`);
            setChallenging(null);
            setTimeout(() => setSnackMsg(""), 3000);
        } else if (type === "CHALLENGE_DECLINED") {
            setSnackMsg(`${data.byUsername} declined your challenge`);
            setChallenging(null);
            setTimeout(() => setSnackMsg(""), 3000);
        } else if (type === "FRIEND_REQUEST") {
            setSnackMsg(`${data.fromUsername} sent you a friend request!`);
            setTimeout(() => setSnackMsg(""), 4000);
            loadRequests();
            setFriendsOpen(true);
        } else if (type === "FRIEND_ACCEPTED") {
            setSnackMsg(`${data.fromUsername} accepted your friend request!`);
            setTimeout(() => setSnackMsg(""), 3000);
            loadFriends();
        }
    }, [navigate]);

    const { sendChallenge, acceptChallenge, declineChallenge } = useWebSocket(handleWsMessage);

    const loadFriends = () => api.get("/friends").then((r) => setFriends(r.data));
    const loadRequests = () => api.get("/friends/requests").then((r) => setRequests(r.data));

    // Layout.jsx — add auto-refresh every 10 seconds when panel is open
    useEffect(() => {
        if (!friendsOpen) return;
        loadFriends();
        loadRequests();

        const interval = setInterval(() => loadFriends(), 10000);
        return () => clearInterval(interval);
    }, [friendsOpen]);

    const sendRequest = async () => {
        try {
            const res = await api.post(`/friends/request?receiverId=${addId}`);
            setMsg(res.data.message || "Request sent!");
            setAddId("");
        } catch { setMsg("Failed to send request"); }
    };

    const acceptRequest = async (id) => {
        await api.post(`/friends/accept?friendshipId=${id}`);
        loadFriends(); loadRequests();
    };

    const handleChallenge = (friendId) => {
        setChallenging(friendId);
        sendChallenge(friendId);
    };

    const navItems = [
        { icon: <GridViewIcon sx={{ fontSize: 20 }} />, label: "Home", path: "/home" },
        { icon: <CodeIcon sx={{ fontSize: 20 }} />, label: "Problems", path: "/problems" },
        { icon: <PlayArrowIcon sx={{ fontSize: 20 }} />, label: "Compile", path: "/compiler" },
        { icon: <PeopleIcon sx={{ fontSize: 20 }} />, label: "Friends", action: () => setFriendsOpen((v) => !v) },
        { icon: <PersonIcon sx={{ fontSize: 20 }} />, label: "Profile", path: "/profile" },
    ];

    const isActive = (path) => location.pathname === path;

    const iconBtnSx = (active) => ({
        width: SIDEBAR_W,
        height: 52,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        cursor: "pointer",
        color: active ? "#d8d8d8" : "#3a3a3a",
        background: active ? "#1e1e1e" : "transparent",
        borderLeft: active ? "2px solid #666" : "2px solid transparent",
        transition: "all 0.15s",
        userSelect: "none",
        "&:hover": { color: "#888", background: "#161616" },
    });

    // ✅ fullscreen mode — no sidebar, just children + challenge notification
    if (fullscreen) {
        return (
            <Box sx={{ minHeight: "100vh", background: "#0f0f0f", fontFamily: "'Inter', sans-serif" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>

                {/* Challenge notification still works in fullscreen */}
                <ChallengeNotification
                    challenge={incomingChallenge}
                    onAccept={(id) => {
                        console.log("✅ Accepting challenge from:", id); // ✅ add log
                        acceptChallenge(id);
                        setIncomingChallenge(null);
                    }}
                    onDecline={(id) => {
                        declineChallenge(id);
                        setIncomingChallenge(null);
                    }}
                />

                {children}
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", background: "#0f0f0f", fontFamily: "'Inter', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>

            {/* Challenge notification popup */}
            <ChallengeNotification
                challenge={incomingChallenge}
                onAccept={(id) => { acceptChallenge(id); setIncomingChallenge(null); }}
                onDecline={(id) => { declineChallenge(id); setIncomingChallenge(null); }}
            />

            {/* Snack message */}
            {snackMsg && (
                <Box sx={{
                    position: "fixed", bottom: 24, left: "50%",
                    transform: "translateX(-50%)", zIndex: 9998,
                    bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a",
                    borderRadius: "10px", px: "16px", py: "10px",
                }}>
                    <Typography sx={{ fontSize: "13px", color: "#aaa", fontFamily: "'Inter', sans-serif" }}>
                        {snackMsg}
                    </Typography>
                </Box>
            )}

            {/* ── Vertical Sidebar ── */}
            <Box sx={{
                width: `${SIDEBAR_W}px`,
                minHeight: "100vh",
                background: "#0a0a0a",
                borderRight: "0.5px solid #1a1a1a",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "fixed",
                left: 0, top: 0,
                zIndex: 200,
            }}>
                {/* Logo */}
                <Box
                    onClick={() => navigate("/home")}
                    sx={{ width: "100%", height: 60, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderBottom: "0.5px solid #1a1a1a", mb: 1 }}
                >
                    <Box sx={{ width: 32, height: 32, borderRadius: "9px", background: "#1a1a1a", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <TerminalIcon sx={{ fontSize: 17, color: "#666" }} />
                    </Box>
                </Box>

                {/* Nav items */}
                <Box sx={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", pt: 1 }}>
                    {navItems.map((item) => (
                        <Box
                            key={item.label}
                            onClick={item.action || (() => navigate(item.path))}
                            sx={iconBtnSx(item.path ? isActive(item.path) : friendsOpen)}
                        >
                            {item.icon}
                            <Typography sx={{ fontSize: "9px", fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: "0.04em", color: "inherit" }}>
                                {item.label.toUpperCase()}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Bottom: rating + avatar + logout */}
                <Box sx={{ width: "100%", borderTop: "0.5px solid #1a1a1a", pt: 1, pb: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <EmojiEventsIcon sx={{ fontSize: 14, color: "#444" }} />
                        <Typography sx={{ fontSize: "11px", color: "#555", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                            {user?.rating}
                        </Typography>
                    </Box>
                    <Avatar sx={{ width: 28, height: 28, background: "#1e1e1e", border: "0.5px solid #2a2a2a", fontSize: "12px", fontWeight: 600, color: "#777" }}>
                        {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box
                        onClick={logout}
                        title="Logout"
                        sx={{ color: "#2a2a2a", cursor: "pointer", display: "flex", "&:hover": { color: "#f87171" }, transition: "color 0.15s" }}
                    >
                        <LogoutIcon sx={{ fontSize: 16 }} />
                    </Box>
                </Box>
            </Box>

            {/* ── Friends Panel ── */}
            <Box sx={{
                position: "fixed",
                left: `${SIDEBAR_W}px`,
                top: 0,
                width: friendsOpen ? `${FRIENDS_W}px` : 0,
                height: "100vh",
                background: "#0d0d0d",
                borderRight: friendsOpen ? "0.5px solid #1e1e1e" : "none",
                overflow: "hidden",
                transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
                zIndex: 150,
                display: "flex",
                flexDirection: "column",
            }}>
                <Box sx={{ width: FRIENDS_W, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>

                    {/* Panel header */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", py: "14px", borderBottom: "0.5px solid #1a1a1a" }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            Friends
                        </Typography>
                        <Box onClick={() => setFriendsOpen(false)} sx={{ color: "#333", cursor: "pointer", display: "flex", "&:hover": { color: "#888" } }}>
                            <CloseIcon sx={{ fontSize: 15 }} />
                        </Box>
                    </Box>

                    {/* Add friend */}
                    <Box sx={{ px: "14px", py: "14px", borderBottom: "0.5px solid #1a1a1a" }}>
                        <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", mb: "8px" }}>
                            Add by ID
                        </Typography>
                        <Box sx={{ display: "flex", gap: "6px" }}>
                            <input
                                type="number"
                                placeholder="User ID"
                                value={addId}
                                onChange={(e) => setAddId(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: "#111",
                                    border: "0.5px solid #222",
                                    borderRadius: "7px",
                                    color: "#aaa",
                                    fontSize: "12px",
                                    fontFamily: "'Inter', sans-serif",
                                    padding: "6px 10px",
                                    outline: "none",
                                }}
                            />
                            <Box
                                component="button"
                                onClick={sendRequest}
                                sx={{ background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "7px", color: "#888", cursor: "pointer", px: "10px", display: "flex", alignItems: "center", "&:hover": { background: "#252525", color: "#ccc" }, transition: "all 0.15s" }}
                            >
                                <PersonAddIcon sx={{ fontSize: 14 }} />
                            </Box>
                        </Box>
                        {msg && <Typography sx={{ fontSize: "11px", color: "#555", fontFamily: "'Inter', sans-serif", mt: "6px" }}>{msg}</Typography>}
                    </Box>

                    {/* Pending requests */}
                    {requests.length > 0 && (
                        <Box sx={{ px: "14px", py: "12px", borderBottom: "0.5px solid #1a1a1a" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "10px" }}>
                                <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Requests
                                </Typography>
                                <Box sx={{ background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "5px", px: "6px", py: "1px", fontSize: "10px", color: "#555", fontFamily: "'Inter', sans-serif" }}>
                                    {requests.length}
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {requests.map((r) => (
                                    <Box key={r.friendshipId} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "0.5px solid #1e1e1e", borderRadius: "8px", p: "8px 10px" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Avatar sx={{ width: 24, height: 24, background: "#1e1e1e", border: "0.5px solid #2a2a2a", color: "#666", fontSize: "10px", fontWeight: 600 }}>
                                                {r.from[0].toUpperCase()}
                                            </Avatar>
                                            <Typography sx={{ fontSize: "12px", color: "#aaa", fontFamily: "'Inter', sans-serif" }}>{r.from}</Typography>
                                        </Box>
                                        <Box
                                            component="button"
                                            onClick={() => acceptRequest(r.friendshipId)}
                                            sx={{ background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "6px", color: "#666", cursor: "pointer", p: "4px 8px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontFamily: "'Inter', sans-serif", "&:hover": { color: "#ccc", borderColor: "#3a3a3a" }, transition: "all 0.15s" }}
                                        >
                                            <CheckIcon sx={{ fontSize: 11 }} /> Accept
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Friends list with online dots + challenge */}
                    <Box sx={{ px: "14px", py: "12px", flex: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "10px" }}>
                            <Typography sx={{ fontSize: "10px", color: "#333", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Friends
                            </Typography>
                            <Typography sx={{ fontSize: "10px", color: "#2a4a2a", fontFamily: "'Inter', sans-serif" }}>
                                {friends.filter(f => f.online).length} online
                            </Typography>
                        </Box>

                        {friends.length === 0 ? (
                            <Typography sx={{ fontSize: "12px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>No friends yet.</Typography>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {friends.map((f) => (
                                    <Box key={f.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "0.5px solid #1e1e1e", borderRadius: "8px", p: "8px 10px", transition: "border-color 0.15s", "&:hover": { borderColor: "#2a2a2a" } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {/* Avatar with online dot */}
                                            <Box sx={{ position: "relative", flexShrink: 0 }}>
                                                <Avatar sx={{ width: 26, height: 26, background: "#1e1e1e", border: "0.5px solid #2a2a2a", color: "#666", fontSize: "11px", fontWeight: 600 }}>
                                                    {f.username[0].toUpperCase()}
                                                </Avatar>
                                                {/* ✅ online dot */}
                                                <Box sx={{
                                                    position: "absolute", bottom: -1, right: -1,
                                                    width: 8, height: 8, borderRadius: "50%",
                                                    bgcolor: f.online ? "#4ade80" : "#2a2a2a",
                                                    border: "1.5px solid #111",
                                                }} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: "12px", color: "#bbb", fontFamily: "'Inter', sans-serif", fontWeight: 500, lineHeight: 1.2 }}>
                                                    {f.username}
                                                </Typography>
                                                <Typography sx={{ fontSize: "10px", color: f.online ? "#2a4a2a" : "#333", fontFamily: "'Inter', sans-serif" }}>
                                                    {f.online ? "● online" : "● offline"}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* ✅ Challenge button — only if online */}
                                        {f.online ? (
                                            <Box
                                                component="button"
                                                onClick={() => handleChallenge(f.id)}
                                                disabled={challenging === f.id}
                                                title="Challenge"
                                                sx={{
                                                    background: challenging === f.id ? "#1a1a1a" : "#1e1e1e",
                                                    border: "0.5px solid #2a2a2a",
                                                    borderRadius: "6px",
                                                    color: challenging === f.id ? "#333" : "#555",
                                                    cursor: challenging === f.id ? "default" : "pointer",
                                                    p: "5px", display: "flex", alignItems: "center",
                                                    "&:hover:not(:disabled)": { color: "#e8e8e8", borderColor: "#3a3a3a", background: "#252525" },
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                <SportsKabaddiIcon sx={{ fontSize: 14 }} />
                                            </Box>
                                        ) : (
                                            <Box sx={{ p: "5px", opacity: 0.3 }}>
                                                <SportsKabaddiIcon sx={{ fontSize: 14, color: "#333" }} />
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Main content area ── */}
            <Box sx={{
                ml: `${SIDEBAR_W + (friendsOpen ? FRIENDS_W : 0)}px`,
                flex: 1,
                transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
                minHeight: "100vh",
            }}>
                {children}
            </Box>
        </Box>
    );
}