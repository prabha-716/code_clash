// App.jsx — correct order
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Friends from "./pages/Friends";
import Battle from "./pages/Battle";
import Problems from "./pages/Problems";
import Profile from "./pages/Profile";
import Compiler from "./pages/Compiler";
import { WebSocketProvider } from "./context/WebSocketContext";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6366f1" },
    secondary: { main: "#f43f5e" },
    background: {
      default: "#030712",
      paper: "#111827",
    },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "'Inter', sans-serif" },
});

export default function App() {
  return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <WebSocketProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={
                <ProtectedRoute><Home /></ProtectedRoute>
              }/>
              <Route path="/friends" element={
                <ProtectedRoute><Friends /></ProtectedRoute>
              }/>
              <Route path="/battle" element={
                <ProtectedRoute><Battle /></ProtectedRoute>
              }/>
              <Route path="/problems" element={
                <ProtectedRoute><Problems /></ProtectedRoute>
              }/>
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              }/>
              <Route path="/compiler" element={
                <ProtectedRoute><Compiler /></ProtectedRoute>
              }/>
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
            </WebSocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
  );
}