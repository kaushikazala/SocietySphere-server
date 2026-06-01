import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input, Button, Card } from "../components/Common";
import { COLORS } from "../theme";

const CreateSociety = () => {
  const navigate = useNavigate();
  const { token, refreshUser, logout } = useAuth();
  const [form, setForm] = useState({ name: "", line1: "", city: "", state: "", pincode: "", totalUnits: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) return setErrors({ submit: "Name is required" });
    if (!form.city.trim()) return setErrors({ submit: "City is required" });
    if (!form.state.trim()) return setErrors({ submit: "State is required" });
    if (!form.totalUnits || Number(form.totalUnits) <= 0)
      return setErrors({ submit: "Total units must be a positive number" });

    setLoading(true);
    try {
      const res = await fetch("/api/societies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          address: {
            line1: form.line1,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          totalUnits: Number(form.totalUnits),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Create failed: ${res.status}`);

      if (data?.society?.code) {
        alert(`Society created successfully! Share this code with members: ${data.society.code}`);
      }

      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      console.error("Create society error:", err);
      setErrors({ submit: err.message || "Create failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0 }}>Create Society</h1>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <Card style={{ padding: 20, maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <Input label="Society Name" value={form.name} onChange={handleChange("name")} />
          <Input label="Address Line 1" value={form.line1} onChange={handleChange("line1")} />
          <Input label="City" value={form.city} onChange={handleChange("city")} />
          <Input label="State" value={form.state} onChange={handleChange("state")} />
          <Input label="Pincode" value={form.pincode} onChange={handleChange("pincode")} />
          <Input label="Total Units" type="number" value={form.totalUnits} onChange={handleChange("totalUnits")} />
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Society"}
            </Button>
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
          {errors.submit && <div style={{ color: COLORS.danger, marginTop: 12 }}>{errors.submit}</div>}
        </form>
      </Card>
    </div>
  );
};

export default CreateSociety;
