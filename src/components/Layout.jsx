import React from "react";
import { Link } from "react-router-dom";
import { Logo, Button } from "./Common";
import { COLORS, FONTS } from "../theme";

export const Navbar = ({ showAuthButtons = true, onAuthClick }) => {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        padding: "0 32px",
        background: "rgba(7,15,32,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/">
          <Logo size={1} />
        </Link>
        {showAuthButtons && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onAuthClick?.("login")}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onAuthClick?.("signup")}
            >
              Get Started →
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Footer = () => {
  return (
    <footer
      style={{
        borderTop: `1px solid ${COLORS.border}`,
        padding: "48px 32px 32px",
        background: COLORS.surface,
      }}
    >
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "40px",
            marginBottom: "40px",
          }}
        >
          <div>
            <Logo size={1} />
            <p
              style={{
                fontSize: "13px",
                color: COLORS.muted,
                marginTop: "16px",
                lineHeight: 1.7,
                maxWidth: "280px",
              }}
            >
              The all-in-one platform for modern residential communities. Manage,
              communicate, and grow — together.
            </p>
          </div>
          {[
            ["Product", ["Features", "Pricing", "Changelog", "Roadmap"]],
            ["Company", ["About", "Blog", "Careers", "Press"]],
            ["Support", ["Documentation", "API", "Contact", "Status"]],
          ].map(([title, links]) => (
            <div key={title}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: COLORS.mutedlt,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                {title}
              </div>
              {links.map((link) => (
                <div key={link} style={{ marginBottom: "10px" }}>
                  <a
                    href="#"
                    style={{
                      fontSize: "13px",
                      color: COLORS.muted,
                      textDecoration: "none",
                    }}
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            paddingTop: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: COLORS.muted }}>
            © 2025 SocietySphere Technologies Pvt. Ltd.
          </span>
          <span style={{ fontSize: "12px", color: COLORS.muted }}>
            Privacy Policy · Terms of Service
          </span>
        </div>
      </div>
    </footer>
  );
};
