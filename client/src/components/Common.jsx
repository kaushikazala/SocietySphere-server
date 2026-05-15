import React from "react";
import { COLORS, FONTS } from "../theme";

export const Logo = ({ size = 1 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <svg
        width={32 * size}
        height={32 * size}
        viewBox="0 0 32 32"
        fill="none"
      >
        <rect width="32" height="32" rx="9" fill={COLORS.jade} fillOpacity="0.15" />
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          stroke={COLORS.jade}
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <path
          d="M16 5L6 10.5V21.5L16 27L26 21.5V10.5L16 5Z"
          stroke={COLORS.jade}
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="16" cy="16" r="3" fill={COLORS.jade} />
        <path
          d="M16 10V13M16 19V22M10.5 13L13 14.5M19 17.5L21.5 19M10.5 19L13 17.5M19 14.5L21.5 13"
          stroke={COLORS.jade}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: `${22 * size}px`,
          fontWeight: 700,
          color: COLORS.text,
          letterSpacing: "-0.02em",
        }}
      >
        Society
        <span style={{ color: COLORS.jade }}>Sphere</span>
      </span>
    </div>
  );
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  style,
  disabled,
  ...props
}) => {
  const variants = {
    primary: {
      background: COLORS.jade,
      color: COLORS.bg,
      border: "none",
      boxShadow: `0 4px 16px rgba(34,217,160,0.25)`,
    },
    secondary: {
      background: "transparent",
      color: COLORS.mutedlt,
      border: `1px solid ${COLORS.border}`,
    },
    ghost: {
      background: "transparent",
      color: COLORS.text,
      border: "none",
    },
  };

  const sizes = {
    sm: { padding: "7px 12px", fontSize: "12px" },
    md: { padding: "11px 18px", fontSize: "14px" },
    lg: { padding: "13px 36px", fontSize: "16px" },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONTS.sans,
        fontWeight: 600,
        borderRadius: "9px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled ? 0.6 : 1,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "15px",
        padding: "26px 22px",
        transition: "all 0.25s",
        ...style,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = COLORS.surfhov;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "rgba(34,217,160,0.25)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = COLORS.surface;
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = COLORS.border;
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  ...props
}) => {
  return (
    <div style={{ marginBottom: "14px" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 500,
            color: COLORS.mutedlt,
            marginBottom: "5px",
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && (
        <div
          style={{
            fontSize: "12px",
            color: COLORS.danger,
            marginTop: "4px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export const Badge = ({ children, color = "jade", style }) => {
  const colors = {
    jade: { bg: COLORS.jadedim, border: "rgba(34,217,160,0.25)", text: COLORS.jade },
    gold: { bg: COLORS.golddim, border: "rgba(232,166,76,0.25)", text: COLORS.gold },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 14px",
        borderRadius: "999px",
        background: colors[color].bg,
        border: `1px solid ${colors[color].border}`,
        color: colors[color].text,
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
