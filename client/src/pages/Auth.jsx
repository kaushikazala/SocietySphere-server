import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Logo, Button, Input, Badge } from "../components/Common";
import { COLORS, FONTS } from "../theme";
import { useAuth } from "../hooks/useAuth";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, loading } = useAuth();

  const initialMode = searchParams.get("mode") || "login";
  const [authMode, setAuthMode] = useState(initialMode);
  const [role, setRole] = useState("resident");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    societyCode: "",
    password: "",
    confirm: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      if (!loginForm.email.includes("@")) {
        setErrors({ email: "Enter a valid email" });
        return;
      }
      if (loginForm.password.length < 6) {
        setErrors({ password: "Password must be at least 6 characters" });
        return;
      }
      await login(loginForm.email, loginForm.password, role);
      navigate("/dashboard");
    } catch (error) {
      setErrors({ submit: error.message || "Login failed. Please try again." });
    }
  };

  const handleSignupStep1 = () => {
    setErrors({});
    if (!signupForm.name.trim()) {
      setErrors({ name: "Full name is required" });
      return;
    }
    if (!signupForm.email.includes("@")) {
      setErrors({ email: "Enter a valid email" });
      return;
    }
    if (signupForm.phone.replace(/\D/g, "").length < 10) {
      setErrors({ phone: "Enter a valid phone number" });
      return;
    }
    setStep(2);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      if (signupForm.password.length < 8) {
        setErrors({ password: "Minimum 8 characters" });
        return;
      }
      if (signupForm.password !== signupForm.confirm) {
        setErrors({ confirm: "Passwords do not match" });
        return;
      }
      await signup({
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        societyCode: (role === "resident" || role === "guard" || role === "maintenance") ? signupForm.societyCode : null,
        password: signupForm.password,
        role,
      });
      navigate("/dashboard");
    } catch (error) {
      setErrors({ submit: error.message || "Signup failed. Please try again." });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: COLORS.bg,
      }}
    >
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 52px",
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(34,217,160,0.03)1px,transparent 1px),linear-gradient(90deg,rgba(34,217,160,0.03)1px,transparent 1px)`,
            backgroundSize: "44px 44px",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Logo size={1} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontFamily: FONTS.serif,
              fontSize: "40px",
              fontWeight: 700,
              color: COLORS.text,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "18px",
            }}
          >
            Your society,<br />
            <span style={{ color: COLORS.jade }}>intelligently</span>
            <br />
            managed.
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Join 7,500+ societies already running on SocietySphere.
          </p>
          {[
            "✓  QR-based visitor management",
            "✓  Automated maintenance billing",
            "✓  Real-time complaint tracking",
            "✓  Emergency SOS alerts",
          ].map((text) => (
            <div
              key={text}
              style={{ fontSize: "13px", color: COLORS.mutedlt, marginBottom: "10px" }}
            >
              {text}
            </div>
          ))}
        </div>
        <div style={{ position: "relative", zIndex: 1, fontSize: "11px", color: COLORS.muted }}>
          © 2025 SocietySphere Technologies Pvt. Ltd.
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: "500px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "52px 48px",
          overflowY: "auto",
          animation: "slideIn 0.3s ease both",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: "28px",
            right: "28px",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            borderRadius: "8px",
            padding: "7px 12px",
            cursor: "pointer",
            fontFamily: FONTS.sans,
            fontSize: "12px",
          }}
        >
          ← Back to site
        </button>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: COLORS.surface,
            borderRadius: "11px",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          {["login", "signup"].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setAuthMode(mode);
                setStep(1);
                setErrors({});
              }}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                fontFamily: FONTS.sans,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                background: authMode === mode ? COLORS.bg : "transparent",
                color: authMode === mode ? COLORS.text : COLORS.muted,
                borderTop: authMode === mode ? `2px solid ${COLORS.jade}` : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <h2
          style={{
            fontFamily: FONTS.serif,
            fontSize: "30px",
            fontWeight: 700,
            color: COLORS.text,
            marginBottom: "6px",
          }}
        >
          {authMode === "login" ? "Welcome back" : "Get started free"}
        </h2>
        <p style={{ fontSize: "13px", color: COLORS.muted, marginBottom: "24px" }}>
          {authMode === "login"
            ? "Sign in to your SocietySphere account"
            : "Create your account — no credit card required"}
        </p>

        <div style={{ fontSize: "11px", color: COLORS.muted, marginBottom: "9px", fontWeight: 500, letterSpacing: "0.04em" }}>
          {authMode === "login" ? "SIGN IN AS" : "I AM A"}
        </div>

        {/* Role selector */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "9px",
            marginBottom: "22px",
          }}
        >
          {[
            { id: "super_admin", label: "Super Admin", icon: "👑", desc: "Platform admin" },
            { id: "admin", label: "Admin", icon: "⚙️", desc: "Society admin" },
            { id: "maintenance", label: "Maintenance", icon: "🔧", desc: "Maintenance staff" },
            { id: "resident", label: "Resident", icon: "🏠", desc: "Flat dashboard" },
            { id: "guard", label: "Security", icon: "🛡️", desc: "Gate management" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                background: role === r.id ? COLORS.jadedim : COLORS.surface,
                border: `1px solid ${role === r.id ? "rgba(34,217,160,0.4)" : COLORS.border}`,
                borderRadius: "11px",
                padding: "11px 6px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "3px" }}>{r.icon}</div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: role === r.id ? COLORS.jade : COLORS.text,
                }}
              >
                {r.label}
              </div>
              <div style={{ fontSize: "10px", color: COLORS.muted, marginTop: "2px" }}>
                {r.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Form content */}
        {authMode === "login" ? (
          <form onSubmit={handleLogin}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              error={errors.password}
            />
            <div style={{ textAlign: "right", marginBottom: "18px" }}>
              <a
                href="#"
                style={{
                  fontSize: "12px",
                  color: COLORS.jade,
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </a>
            </div>
            <Button
              variant="primary"
              style={{ width: "100%", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : `Sign In as ${role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role === "maintenance" ? "Maintenance" : role === "resident" ? "Resident" : "Security"}`}
            </Button>
            {errors.submit && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: COLORS.danger,
                  textAlign: "center",
                }}
              >
                {errors.submit}
              </div>
            )}
            <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: COLORS.muted }}>
              New to SocietySphere?{" "}
              <span
                onClick={() => setAuthMode("signup")}
                style={{
                  color: COLORS.jade,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Create account →
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleSignupStep1(); } : handleSignup}>
            {/* Step indicator */}
            <div style={{ display: "flex", gap: "7px", marginBottom: "20px" }}>
              {[1, 2].map((n) => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    height: "3px",
                    borderRadius: "3px",
                    background: n <= step ? COLORS.jade : COLORS.border,
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>

            {step === 1 ? (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Ramesh Patel"
                  value={signupForm.name}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, name: e.target.value })
                  }
                  error={errors.name}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, email: e.target.value })
                  }
                  error={errors.email}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={signupForm.phone}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, phone: e.target.value })
                  }
                  error={errors.phone}
                  style={{ marginBottom: "18px" }}
                />
                <Button
                  variant="primary"
                  style={{ width: "100%", padding: "12px" }}
                >
                  Continue →
                </Button>
              </>
            ) : (
              <>
                {(role === "resident" || role === "guard" || role === "maintenance") && (
                  <Input
                    label="Society Code"
                    type="text"
                    placeholder="e.g. SSP-AHMD-204"
                    value={signupForm.societyCode}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        societyCode: e.target.value,
                      })
                    }
                  />
                )}
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={signupForm.password}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, password: e.target.value })
                  }
                  error={errors.password}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={signupForm.confirm}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, confirm: e.target.value })
                  }
                  error={errors.confirm}
                  style={{ marginBottom: "18px" }}
                />
                <div style={{ display: "flex", gap: "9px" }}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1, padding: "12px" }}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 2, padding: "12px" }}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </>
            )}

            {errors.submit && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: COLORS.danger,
                  textAlign: "center",
                }}
              >
                {errors.submit}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
