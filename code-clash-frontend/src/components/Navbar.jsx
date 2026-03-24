import { Box, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const btnSx = {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        border: "0.5px solid #252525",
        borderRadius: "8px",
        color: "#666",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        cursor: "pointer",
        padding: "6px 12px",
        transition: "border-color 0.15s, color 0.15s",
        "&:hover": { borderColor: "#3a3a3a", color: "#aaa" },
    };

    return (
        <Box
            component="nav"
            sx={{
                background: "#0f0f0f",
                borderBottom: "0.5px solid #1e1e1e",
                px: { xs: 3, sm: 4 },
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "'Inter', sans-serif",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Logo */}
            <Box
                onClick={() => navigate("/home")}
                sx={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}
            >
                <Box sx={{ width: 28, height: 28, borderRadius: "7px", background: "#1a1a1a", border: "0.5px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SportsKabaddiIcon sx={{ fontSize: 15, color: "#777" }} />
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#d8d8d8", letterSpacing: "-0.01em", fontFamily: "'Inter', sans-serif" }}>
                    Code Clash
                </Typography>
            </Box>

            {/* Right side */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>

                {/* Rating pill */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "5px", background: "#161616", border: "0.5px solid #252525", borderRadius: "8px", px: "10px", py: "5px" }}>
                    <EmojiEventsIcon sx={{ fontSize: 12, color: "#666" }} />
                    <Typography sx={{ fontSize: "12px", color: "#888", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                        {user?.rating}
                    </Typography>
                </Box>

                {/* Username */}
                <Typography sx={{ fontSize: "12px", color: "#444", fontFamily: "'Inter', sans-serif", px: "4px" }}>
                    {user?.username}
                </Typography>

                {/* Friends */}
                <Box component="button" onClick={() => navigate("/friends")} sx={btnSx}>
                    <PeopleIcon sx={{ fontSize: 13 }} />
                    Friends
                </Box>

                {/* Logout */}
                <Box
                    component="button"
                    onClick={logout}
                    sx={{
                        ...btnSx,
                        "&:hover": { borderColor: "#4a2020", color: "#f87171" },
                    }}
                >
                    <LogoutIcon sx={{ fontSize: 13 }} />
                    Logout
                </Box>
            </Box>
        </Box>
    );
}