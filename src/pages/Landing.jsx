import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Footer } from "../components/Layout";
import { Button, Badge, Card, Input, Logo } from "../components/Common";
import { COLORS, FONTS } from "../theme";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleAuthClick = (mode) => {
    navigate(`/auth?mode=${mode}`);
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <Navbar
        showAuthButtons={true}
        onAuthClick={handleAuthClick}
      />

      {/* Hero Section */}
      <section
        style={{
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "60px 32px",
          background: COLORS.bg,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(34,217,160,0.03)1px,transparent 1px),linear-gradient(90deg,rgba(34,217,160,0.03)1px,transparent 1px)`,
            backgroundSize: "56px 56px",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse,rgba(34,217,160,0.07)0%,transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Floating cards */}
        <FloatingCard
          icon="🔔"
          title="New Notice"
          subtitle="Maintenance due 25th"
          style={{ top: "16%", left: "2%", animation: "floatA 4s ease-in-out infinite" }}
        />
        <FloatingCard
          icon="✅"
          title="Visitor Approved"
          subtitle="Rahul Sharma • Gate A"
          style={{ top: "55%", left: "1%", animation: "floatB 5s ease-in-out infinite" }}
        />
        <FloatingCard
          icon="📋"
          title="Complaint Resolved"
          subtitle="Plumbing — Block C"
          style={{ top: "16%", right: "2%", left: "auto", animation: "floatB 5s ease-in-out infinite" }}
        />
        <FloatingCard
          icon="💳"
          title="Payment Received"
          subtitle="₹4,500 — Flat 204"
          style={{ top: "58%", right: "1%", left: "auto", animation: "floatA 4s ease-in-out infinite" }}
        />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "720px" }}>
          <div style={{ marginBottom: "22px", animation: "fadeUp 0.55s ease both", animationDelay: "0.1s" }}>
            <Badge color="jade">Now in Beta — Join 500+ Societies</Badge>
          </div>
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: "clamp(50px,7vw,80px)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: COLORS.text,
              marginBottom: "24px",
              animation: "fadeUp 0.55s ease both",
              animationDelay: "0.2s",
            }}
          >
            The Operating System<br />
            for Your <span style={{ color: COLORS.jade }}>Community</span>
          </h1>
          <p
            style={{
              fontSize: "17px",
              color: COLORS.muted,
              lineHeight: 1.75,
              maxWidth: "520px",
              margin: "0 auto 44px",
              fontWeight: 300,
              animation: "fadeUp 0.55s ease both",
              animationDelay: "0.35s",
            }}
          >
            Replace WhatsApp groups, paper registers, and manual ledgers with one intelligent platform — built for admins, residents, and security teams.
          </p>
          <div
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              animation: "fadeUp 0.55s ease both",
              animationDelay: "0.45s",
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleAuthClick("signup")}
            >
              Start Free Trial
            </Button>
            <Button variant="secondary" size="lg">
              Watch Demo ▶
            </Button>
          </div>
          <p style={{ marginTop: "18px", fontSize: "12px", color: COLORS.muted }}>
            No credit card required · 30-day free trial · Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "44px 32px",
          background: COLORS.surface,
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "32px",
            textAlign: "center",
          }}
        >
          {[
            ["7,500+", "Societies Managed"],
            ["2.4M+", "Residents Served"],
            ["98.7%", "Uptime SLA"],
            ["₹12Cr+", "Dues Collected"],
          ].map(([value, label]) => (
            <div key={label}>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: "44px",
                  fontWeight: 700,
                  color: COLORS.jade,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: "13px", color: COLORS.muted, marginTop: "6px" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "88px 32px" }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <Badge color="jade">Platform Features</Badge>
            <h2
              style={{
                fontFamily: FONTS.serif,
                fontSize: "clamp(34px,4vw,50px)",
                fontWeight: 700,
                color: COLORS.text,
                marginBottom: "14px",
                letterSpacing: "-0.02em",
                marginTop: "18px",
              }}
            >
              Everything your society needs
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: COLORS.muted,
                maxWidth: "440px",
                margin: "0 auto",
              }}
            >
              Twelve integrated modules. One platform. Zero WhatsApp groups.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
            }}
          >
            {[
              ["🏠", "Resident Dashboard", "Personal hub for maintenance payments, complaints, visitor approvals, and society notices — all in one place."],
              ["🛡️", "Visitor Management", "QR-based digital passes replace physical registers. Pre-approve guests, scan at gate, get real-time entry alerts."],
              ["💰", "Maintenance Billing", "Automated invoice generation, UPI/card payment integration, smart reminders, and late fee computation."],
              ["📣", "Notice Board", "Rich digital announcements with emergency broadcast — simultaneous push, SMS, and email delivery."],
              ["🔧", "Complaint Tracker", "Structured complaints with category, priority, photo attachments, SLA timelines, and resolution ratings."],
              ["🚨", "Emergency Alerts", "One-tap SOS button broadcasts to all stakeholders with geo-tagged context and full incident audit log."],
            ].map(([icon, title, desc]) => (
              <Card key={title}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "13px",
                    fontSize: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: COLORS.jadedim,
                    border: `1px solid rgba(34,217,160,0.15)`,
                    marginBottom: "18px",
                  }}
                >
                  {icon}
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: COLORS.text,
                    marginBottom: "9px",
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: "13px", color: COLORS.muted, lineHeight: 1.7 }}>
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        style={{
          padding: "88px 32px",
          background: COLORS.surface,
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <Badge color="gold">Simple Setup</Badge>
          <h2
            style={{
              fontFamily: FONTS.serif,
              fontSize: "clamp(34px,4vw,50px)",
              fontWeight: 700,
              color: COLORS.text,
              marginBottom: "52px",
              letterSpacing: "-0.02em",
              marginTop: "18px",
            }}
          >
            Up and running in minutes
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "40px",
            }}
          >
            {[
              ["01", "Register Your Society", "Admin signs up, sets up the society profile, configures billing cycles, and generates a unique Society Code in under 5 minutes."],
              ["02", "Onboard Residents & Staff", "Residents self-register with the Society Code. Guards and maintenance staff are added by admin with role-specific access."],
              ["03", "Run on Autopilot", "Maintenance invoices auto-generate, visitors get QR passes, complaints get tracked — your society runs digitally from day one."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ padding: "0 16px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    margin: "0 auto 20px",
                    background: COLORS.jadedim,
                    border: `1px solid rgba(34,217,160,0.3)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONTS.serif,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: COLORS.jade,
                  }}
                >
                  {num}
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 600,
                    color: COLORS.text,
                    marginBottom: "10px",
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: "13px", color: COLORS.muted, lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "88px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(232,166,76,0.1)",
              border: `1px solid rgba(232,166,76,0.2)`,
              borderRadius: "999px",
              padding: "6px 16px",
              marginBottom: "28px",
            }}
          >
            <span style={{ fontSize: "13px", color: COLORS.gold }}>
              ✦ Special launch pricing — 60% off first 6 months
            </span>
          </div>
          <h2
            style={{
              fontFamily: FONTS.serif,
              fontSize: "clamp(38px,5vw,60px)",
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: "-0.02em",
              marginBottom: "18px",
              lineHeight: 1.1,
            }}
          >
            Ready to modernize<br />
            your community?
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: COLORS.muted,
              marginBottom: "36px",
              lineHeight: 1.7,
            }}
          >
            Join societies across India already running on SocietySphere. Start your
            30-day free trial — no setup fees, no contracts.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleAuthClick("signup")}
          >
            Start Free Trial →
          </Button>
          <p style={{ marginTop: "18px", fontSize: "12px", color: COLORS.muted }}>
            Trusted by RWAs, housing associations, and gated communities
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FloatingCard = ({ icon, title, subtitle, style }) => {
  return (
    <div
      style={{
        position: "absolute",
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        zIndex: 1,
        ...style,
      }}
    >
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: COLORS.text }}>
          {title}
        </div>
        <div style={{ fontSize: "10px", color: COLORS.muted }}>{subtitle}</div>
      </div>
      <div
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: COLORS.jade,
          animation: "pulse 2s infinite",
        }}
      />
    </div>
  );
};

export default LandingPage;
