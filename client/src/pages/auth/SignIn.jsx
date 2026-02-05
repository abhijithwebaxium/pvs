import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/userSlice";
import api from "../../utils/api";
import truckImage from "../../assets/pvs-truck.webp";
import logo from "../../assets/logo_black.png";

const SignIn = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("password"); // 'password' or 'ldap'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please provide email and password");
      return;
    }

    setLoading(true);
    dispatch(loginStart());

    try {
      // Determine endpoint based on auth method
      const endpoint = authMethod === "ldap"
        ? "/api/auth/ldap/login"
        : "/api/auth/login";

      const response = await api.post(endpoint, {
        email: formData.email,
        password: formData.password,
      });

      const { data: responseData } = response;

      if (responseData.data?.user) {
        dispatch(
          loginSuccess({
            ...responseData.data.user,
            token: responseData.data.token,
          }),
        );
      }

      if (responseData.data?.user?.role === "approver") {
        navigate("/approvals");
      } else {
        navigate("/");
      }
    } catch (err) {
      // Extract meaningful error message
      let errorMessage = "An error occurred during login";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = authMethod === "ldap"
          ? "Invalid LDAP credentials. Please check your email and password."
          : "Invalid email or password.";
      } else if (err.response?.status === 404) {
        errorMessage = authMethod === "ldap"
          ? "User not found in Active Directory or employee record not found in database."
          : "No account found with this email.";
      } else if (err.response?.status === 403) {
        errorMessage = "Your account has been deactivated. Please contact HR.";
      } else if (err.response?.status === 500) {
        errorMessage = authMethod === "ldap"
          ? "LDAP server error. Please try again or contact IT support."
          : "Server error. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Left Side - Image Section */}
      <Box
        sx={{
          flex: { xs: 0, md: 1.2, lg: 1.5 },
          display: { xs: "none", md: "block" },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(${truckImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.7)",
            transition: "transform 0.5s ease",
            "&:hover": {
              transform: "scale(1.02)",
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.1))",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 6,
            color: "white",
          }}
        >
          <Typography
            variant="h2"
            sx={{ fontWeight: 800, mb: 2, letterSpacing: -1 }}
          >
            PVS Chemicals
          </Typography>
          <Typography
            variant="h5"
            sx={{ opacity: 0.9, fontWeight: 300, maxWidth: "500px" }}
          >
            Chemistry for daily life.
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Login Form Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, sm: 6, md: 8 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: "450px",
            width: "100%",
            bgcolor: "transparent",
          }}
        >
          <Box sx={{ mb: 6, textAlign: "center" }}>
            <Box
              component="img"
              src={logo}
              alt="PVS Logo"
              sx={{ height: 60, mb: 3 }}
            />
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your credentials to access your dashboard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Authentication Method Selector */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, fontWeight: 500 }}
            >
              Authentication Method
            </Typography>
            <ToggleButtonGroup
              value={authMethod}
              exclusive
              onChange={(e, newMethod) => {
                if (newMethod !== null) {
                  setAuthMethod(newMethod);
                  setError("");
                }
              }}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  py: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="password">
                Local Account
              </ToggleButton>
              <ToggleButton value="ldap">
                LDAP
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              variant="outlined"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              sx={{ mb: 1 }}
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "text.secondary" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              {/* <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot password?
              </Typography> */}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: "1rem",
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                color: "#FFFFFF",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                },
              }}
            >
              {loading
                ? "Verifying..."
                : authMethod === "ldap"
                ? "Sign In with LDAP"
                : "Sign In"}
            </Button>

            {authMethod === "ldap" && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Chip
                  label="Using Active Directory Authentication"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>

          {/* <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Typography
                component="span"
                variant="body2"
                onClick={() => navigate("/signup")}
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Create Account
              </Typography>
            </Typography>
          </Box> */}
        </Paper>

        <Box sx={{ mt: "auto", pt: 4 }}>
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} PVS Logistics. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SignIn;
