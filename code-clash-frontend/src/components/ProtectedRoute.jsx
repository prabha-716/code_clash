import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CircularProgress, Box } from "@mui/material";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <Box className="flex items-center justify-center h-screen">
            <CircularProgress color="primary" />
        </Box>
    );

    return user ? children : <Navigate to="/login" replace />;
}