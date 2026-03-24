import { useState, useEffect } from "react";
import {
    Box, Card, CardContent, Typography, TextField,
    Button, Divider, Chip, Alert, Avatar, List,
    ListItem, ListItemAvatar, ListItemText, Snackbar
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import CheckIcon from "@mui/icons-material/Check";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Layout from "./Layout";
import api from "../api/axios";
import { useWebSocket } from "../hooks/useWebSocket";
import { useNavigate } from "react-router-dom";
import ChallengeNotification from "../components/ChallengeNotification";

export default function Friends() {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [receiverId, setReceiverId] = useState("");
    const [message, setMessage] = useState({ text: "", type: "success" });
    const [challenging, setChallenging] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, text: "" });
    const [incomingChallenge, setIncomingChallenge] = useState(null);
    const navigate = useNavigate();

    const { sendChallenge, acceptChallenge, declineChallenge } = useWebSocket((data) => {
        switch (data.type) {
            case "BATTLE_START":
                navigate("/battle", { state: data });
                break;
            case "CHALLENGE_REQUEST":
                setIncomingChallenge(data);
                break;
            case "CHALLENGE_SENT":
                setSnackbar({ open: true, text: `Challenge sent to ${data.toUsername}!` });
                setChallenging(null);
                break;
            case "CHALLENGE_DECLINED":
                setSnackbar({ open: true, text: `${data.byUsername} declined your challenge` });
                setChallenging(null);
                break;
            default:
                break;
        }
    });

    useEffect(() => {
        loadFriends();
        loadRequests();
    }, []);

    const loadFriends = () =>
        api.get("/friends").then((r) => setFriends(r.data));

    const loadRequests = () =>
        api.get("/friends/requests").then((r) => setRequests(r.data));

    const sendRequest = async () => {
        try {
            const res = await api.post(`/friends/request?receiverId=${receiverId}`);
            setMessage({ text: res.data.message || res.data.error, type: res.data.error ? "error" : "success" });
            setReceiverId("");
        } catch {
            setMessage({ text: "Failed to send request", type: "error" });
        }
    };

    const acceptRequest = async (friendshipId) => {
        await api.post(`/friends/accept?friendshipId=${friendshipId}`);
        loadFriends();
        loadRequests();
    };

    const handleChallenge = (friendId) => {
        setChallenging(friendId);
        sendChallenge(friendId);
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: "720px", mx: "auto", mt: "48px", px: 4, pb: 8 }}>

                {/* Incoming challenge popup */}
                <ChallengeNotification
                    challenge={incomingChallenge}
                    onAccept={(id) => { acceptChallenge(id); setIncomingChallenge(null); }}
                    onDecline={(id) => { declineChallenge(id); setIncomingChallenge(null); }}
                />

                {/* Snackbar for sent/declined */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ open: false, text: "" })}
                    message={snackbar.text}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                />

                {/* Header */}
                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", mb: "4px" }}>
                        Friends
                    </Typography>
                    <Typography sx={{ fontSize: "28px", fontWeight: 500, color: "#e8e8e8", fontFamily: "'Inter', sans-serif" }}>
                        Your Friends
                    </Typography>
                </Box>

                {/* Add Friend */}
                <Box sx={{ bgcolor: "#161616", border: "0.5px solid #252525", borderRadius: "14px", p: "16px 20px", mb: 3 }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif", mb: "12px" }}>
                        Add Friend
                    </Typography>
                    <Box sx={{ display: "flex", gap: "8px" }}>
                        <TextField
                            fullWidth size="small"
                            type="number"
                            placeholder="Enter User ID"
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "13px" } }}
                        />
                        <Box component="button" onClick={sendRequest}
                             sx={{ px: "16px", py: "8px", bgcolor: "#e8e8e8", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "#111", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif", "&:hover": { bgcolor: "#d4d4d4" } }}>
                            <PersonAddIcon sx={{ fontSize: 15, mr: "4px", verticalAlign: "middle" }} />
                            Add
                        </Box>
                    </Box>
                    {message.text && (
                        <Alert severity={message.type} sx={{ mt: 1.5, py: 0.5, fontSize: "12px" }}>
                            {message.text}
                        </Alert>
                    )}
                </Box>

                {/* Pending Requests */}
                {requests.length > 0 && (
                    <Box sx={{ bgcolor: "#161616", border: "0.5px solid #252525", borderRadius: "14px", p: "16px 20px", mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px" }}>
                            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                                Pending Requests
                            </Typography>
                            <Box sx={{ bgcolor: "#f59e0b22", border: "0.5px solid #f59e0b44", borderRadius: "6px", px: "6px", py: "1px" }}>
                                <Typography sx={{ fontSize: "10px", color: "#f59e0b", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                                    {requests.length}
                                </Typography>
                            </Box>
                        </Box>
                        {requests.map((r) => (
                            <Box key={r.friendshipId} sx={{ display: "flex", alignItems: "center", gap: "12px", py: "10px", borderBottom: "0.5px solid #1e1e1e", "&:last-child": { borderBottom: "none" } }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: "#222", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#666", fontFamily: "'Inter', sans-serif" }}>
                                        {r.from[0].toUpperCase()}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: "13px", color: "#aaa", fontFamily: "'Inter', sans-serif", flex: 1 }}>
                                    {r.from}
                                </Typography>
                                <Box component="button" onClick={() => acceptRequest(r.friendshipId)}
                                     sx={{ display: "flex", alignItems: "center", gap: "4px", bgcolor: "#e8e8e8", border: "none", borderRadius: "7px", px: "12px", py: "6px", fontSize: "12px", fontWeight: 500, color: "#111", cursor: "pointer", fontFamily: "'Inter', sans-serif", "&:hover": { bgcolor: "#d4d4d4" } }}>
                                    <CheckIcon sx={{ fontSize: 13 }} /> Accept
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Friends List */}
                <Box sx={{ bgcolor: "#161616", border: "0.5px solid #252525", borderRadius: "14px", overflow: "hidden" }}>
                    <Box sx={{ px: "20px", py: "14px", borderBottom: "0.5px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#888", fontFamily: "'Inter', sans-serif" }}>
                            Friends
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#333", fontFamily: "'Inter', sans-serif" }}>
                            {friends.filter(f => f.online).length} online
                        </Typography>
                    </Box>

                    {friends.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: "40px" }}>
                            <Typography sx={{ fontSize: "13px", color: "#2a2a2a", fontFamily: "'Inter', sans-serif" }}>
                                No friends yet
                            </Typography>
                        </Box>
                    ) : (
                        friends.map((f) => (
                            <Box key={f.id} sx={{ display: "flex", alignItems: "center", gap: "12px", px: "20px", py: "12px", borderBottom: "0.5px solid #1a1a1a", "&:last-child": { borderBottom: "none" }, "&:hover": { bgcolor: "#141414" }, transition: "background 0.15s" }}>

                                {/* Avatar with online dot */}
                                <Box sx={{ position: "relative", flexShrink: 0 }}>
                                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#666", fontFamily: "'Inter', sans-serif" }}>
                                            {f.username[0].toUpperCase()}
                                        </Typography>
                                    </Box>
                                    {/* ✅ Online indicator dot */}
                                    <Box sx={{
                                        position: "absolute", bottom: -1, right: -1,
                                        width: 9, height: 9, borderRadius: "50%",
                                        bgcolor: f.online ? "#4ade80" : "#2a2a2a",
                                        border: "1.5px solid #161616",
                                    }} />
                                </Box>

                                {/* Name + rating */}
                                <Box flex={1} sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#ccc", fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {f.username}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mt: "1px" }}>
                                        <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                                            ⚡ {f.rating}
                                        </Typography>
                                        <Typography sx={{ fontSize: "10px", color: f.online ? "#4ade80" : "#333", fontFamily: "'Inter', sans-serif" }}>
                                            {f.online ? "● Online" : "● Offline"}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Challenge button — only if online */}
                                {f.online ? (
                                    <Box component="button"
                                         disabled={challenging === f.id}
                                         onClick={() => handleChallenge(f.id)}
                                         sx={{ display: "flex", alignItems: "center", gap: "5px", bgcolor: challenging === f.id ? "#1a1a1a" : "#e8e8e8", border: "none", color: challenging === f.id ? "#444" : "#111", px: "12px", py: "7px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: challenging === f.id ? "default" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s", flexShrink: 0, "&:hover:not(:disabled)": { bgcolor: "#d4d4d4" } }}>
                                        <SportsKabaddiIcon sx={{ fontSize: 13 }} />
                                        {challenging === f.id ? "Waiting..." : "Challenge"}
                                    </Box>
                                ) : (
                                    <Box sx={{ px: "12px", py: "7px", borderRadius: "8px", bgcolor: "#0f0f0f", border: "0.5px solid #1e1e1e" }}>
                                        <Typography sx={{ fontSize: "12px", color: "#333", fontFamily: "'Inter', sans-serif" }}>
                                            Offline
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Layout>
    );
}