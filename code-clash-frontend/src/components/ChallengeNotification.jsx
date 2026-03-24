// src/components/ChallengeNotification.jsx

import { useState, useEffect } from "react";
import { Box, Typography, Button, Avatar, Slide } from "@mui/material";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import BoltIcon from "@mui/icons-material/Bolt";

export default function ChallengeNotification({ challenge, onAccept, onDecline }) {
    const [visible, setVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (challenge) {
            setVisible(true);
            setTimeLeft(30);
        }
    }, [challenge]);

    // auto-decline after 30 seconds
    useEffect(() => {
        if (!visible || !challenge) return;
        if (timeLeft <= 0) {
            onDecline(challenge.fromId);
            setVisible(false);
            return;
        }
        const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, visible, challenge]);

    if (!visible || !challenge) return null;

    return (
        <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
            <Box sx={{
                position: "fixed", bottom: 24, left: "50%",
                transform: "translateX(-50%)", zIndex: 9999,
                bgcolor: "#161616", border: "0.5px solid #2a2a2a",
                borderRadius: "16px", p: "20px 24px",
                minWidth: 320, maxWidth: 380,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "14px" }}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: "12px",
                        bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <SportsKabaddiIcon sx={{ fontSize: 20, color: "#6366f1" }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#e8e8e8", fontFamily: "'Inter', sans-serif" }}>
                            Battle Challenge!
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                            Expires in {timeLeft}s
                        </Typography>
                    </Box>
                    {/* Timer ring */}
                    <Box sx={{ ml: "auto" }}>
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#1e1e1e" strokeWidth="3"/>
                            <circle cx="18" cy="18" r="15" fill="none"
                                    stroke="#6366f1" strokeWidth="3"
                                    strokeDasharray={`${(timeLeft / 30) * 94} 94`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 18 18)"
                                    style={{ transition: "stroke-dasharray 1s linear" }}
                            />
                            <text x="18" y="22" textAnchor="middle"
                                  fontSize="10" fill="#888" fontFamily="Inter">
                                {timeLeft}
                            </text>
                        </svg>
                    </Box>
                </Box>

                {/* Challenger info */}
                <Box sx={{
                    bgcolor: "#0f0f0f", border: "0.5px solid #1e1e1e",
                    borderRadius: "10px", p: "12px 14px", mb: "14px",
                    display: "flex", alignItems: "center", gap: "12px",
                }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "#1e1e1e", border: "0.5px solid #2a2a2a", fontSize: "13px", fontWeight: 600, color: "#888" }}>
                        {challenge.fromUsername?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#ccc", fontFamily: "'Inter', sans-serif" }}>
                            {challenge.fromUsername}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <BoltIcon sx={{ fontSize: 10, color: "#444" }} />
                            <Typography sx={{ fontSize: "11px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                                {challenge.fromRating}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography sx={{ ml: "auto", fontSize: "12px", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                        wants to clash
                    </Typography>
                </Box>

                {/* Buttons */}
                <Box sx={{ display: "flex", gap: "8px" }}>
                    <Box component="button"
                         onClick={() => { onDecline(challenge.fromId); setVisible(false); }}
                         sx={{ flex: 1, py: "9px", borderRadius: "8px", border: "0.5px solid #2a2a2a", bgcolor: "#0f0f0f", color: "#555", fontSize: "13px", cursor: "pointer", fontFamily: "'Inter', sans-serif", "&:hover": { bgcolor: "#1a1a1a" } }}>
                        Decline
                    </Box>
                    <Box component="button"
                         onClick={() => { onAccept(challenge.fromId); setVisible(false); }}
                         sx={{ flex: 1, py: "9px", borderRadius: "8px", border: "none", bgcolor: "#e8e8e8", color: "#111", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", "&:hover": { bgcolor: "#d4d4d4" } }}>
                        Accept ⚔️
                    </Box>
                </Box>
            </Box>
        </Slide>
    );
}