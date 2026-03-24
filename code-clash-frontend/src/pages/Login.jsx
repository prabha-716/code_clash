import { Box, Typography } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
    const { user, loading } = useAuth();

    if (!loading && user) return <Navigate to="/home" replace />;

    const sx = {
        page: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#0f0f0f",
            fontFamily: "'Inter', sans-serif",
        },
        card: {
            width: 360,
            background: "#161616",
            border: "0.5px solid #252525",
            borderRadius: "18px",
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0px",
            position: "relative",
            overflow: "hidden",
            "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)",
                pointerEvents: "none",
            },
        },
        iconWrap: {
            width: 52,
            height: 52,
            borderRadius: "14px",
            background: "#222",
            border: "0.5px solid #2e2e2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: "18px",
        },
        title: {
            fontSize: "22px",
            fontWeight: 600,
            color: "#e8e8e8",
            letterSpacing: "-0.02em",
            fontFamily: "'Inter', sans-serif",
            mb: "6px",
        },
        subtitle: {
            fontSize: "13px",
            color: "#444",
            textAlign: "center",
            fontFamily: "'Inter', sans-serif",
            mb: "32px",
            lineHeight: 1.6,
        },
        divider: {
            width: "100%",
            height: "0.5px",
            background: "#252525",
            mb: "28px",
        },
        btn: {
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: "#e8e8e8",
            color: "#111",
            border: "none",
            borderRadius: "10px",
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            textDecoration: "none",
            transition: "background 0.15s",
            mb: "16px",
            "&:hover": { background: "#d4d4d4" },
        },
        caption: {
            fontSize: "12px",
            color: "#333",
            fontFamily: "'Inter', sans-serif",
        },
    };

    return (
        <Box sx={sx.page}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>
            <Box sx={sx.card}>
                <Box sx={sx.iconWrap}>
                    <SportsKabaddiIcon sx={{ fontSize: 26, color: "#888" }} />
                </Box>
                <Typography sx={sx.title}>Code Clash</Typography>
                <Typography sx={sx.subtitle}>
                    Challenge your friends to real-time coding battles
                </Typography>
                <Box sx={sx.divider} />
                <Box
                    component="a"
                    href="http://localhost:8080/oauth2/authorization/github"
                    sx={sx.btn}
                >
                    <GitHubIcon sx={{ fontSize: 18 }} />
                    Login with GitHub
                </Box>
                <Typography sx={sx.caption}>Only GitHub login is supported</Typography>
            </Box>
        </Box>
    );
}