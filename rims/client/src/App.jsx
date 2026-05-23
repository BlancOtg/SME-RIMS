import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from './api'

// ── Breakpoint hook ──────────────────────────────────────────────
function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// ── Colour tokens ────────────────────────────────────────────────
const LIGHT = {
  bg: "#f7f9f4", surface: "#ffffff", card: "#ffffff",
  border: "#d6e8d0", borderMid: "#b8d9ae",
  text: "#1a2e1a", textMid: "#4a6741", textSub: "#7a9b72",
  accent: "#2d7a3a", accentLight: "#e8f5e3", accentMid: "#4da65a",
  danger: "#c0392b", dangerLight: "#fdecea",
  warn: "#e67e22", warnLight: "#fef3e2",
  info: "#1a6fa8", infoLight: "#e6f2fb",
  success: "#27ae60", successLight: "#e8f8ef",
  sidebar: "#1a2e1a", sidebarText: "#c8e6c0", sidebarActive: "#4da65a",
}
const DARK = {
  bg: "#0f1a0f", surface: "#162216", card: "#1e2e1e",
  border: "#2a3d2a", borderMid: "#3d5e3d",
  text: "#d4ecd0", textMid: "#8fba87", textSub: "#5c7a58",
  accent: "#4da65a", accentLight: "#1a3320", accentMid: "#3d8a48",
  danger: "#e74c3c", dangerLight: "#2d1212",
  warn: "#f39c12", warnLight: "#2d2010",
  info: "#3498db", infoLight: "#0d1e2d",
  success: "#2ecc71", successLight: "#0d2d1a",
  sidebar: "#0d180d", sidebarText: "#8fba87", sidebarActive: "#4da65a",
}

// ── Mock data ────────────────────────────────────────────────────
const cashFlowData = [
  { month: "Jan", receivables: 82000,  payables: 45000, net: 37000 },
  { month: "Feb", receivables: 91000,  payables: 52000, net: 39000 },
  { month: "Mar", receivables: 75000,  payables: 38000, net: 37000 },
  { month: "Apr", receivables: 110000, payables: 61000, net: 49000 },
  { month: "May", receivables: 98000,  payables: 54000, net: 44000 },
  { month: "Jun", receivables: 125000, payables: 68000, net: 57000 },
]
const agingData = [
  { range: "0–30d",  amount: 45000, fill: "#4da65a" },
  { range: "31–60d", amount: 28000, fill: "#e67e22" },
  { range: "61–90d", amount: 15000, fill: "#e74c3c" },
  { range: "90+d",   amount: 8000,  fill: "#8e44ad" },
]
const statusData = [
  { name: "Paid",    value: 52, color: "#4da65a" },
  { name: "Sent",    value: 18, color: "#3498db" },
  { name: "Overdue", value: 14, color: "#e74c3c" },
  { name: "Draft",   value: 10, color: "#95a5a6" },
  { name: "Partial", value: 6,  color: "#f39c12" },
]
const invoices = [
  { id: "INV-2026-001", client: "Adeyemi Enterprises", amount: 18500, status: "Overdue", due: "May 1, 2026",  days: 18 },
  { id: "INV-2026-002", client: "Tunde & Co",          amount: 6200,  status: "Sent",    due: "May 25, 2026", days: -6 },
  { id: "INV-2026-003", client: "Greenleaf Ltd",        amount: 32000, status: "Paid",    due: "Apr 20, 2026", days: 0  },
  { id: "INV-2026-004", client: "Balogun Motors",       amount: 9750,  status: "Partial", due: "May 15, 2026", days: -4 },
  { id: "INV-2026-005", client: "Lagos Textile Co",     amount: 41000, status: "Draft",   due: "—",            days: 0  },
  { id: "INV-2026-006", client: "Nwosu Pharma",         amount: 12800, status: "Overdue", due: "Apr 28, 2026", days: 21 },
]
const vendors = [
  { name: "OfficePro Supplies", contact: "supplier@officepro.ng", terms: "Net 30", balance: 12400, status: "Good"    },
  { name: "TechCore Nigeria",   contact: "billing@techcore.ng",   terms: "Net 15", balance: 8750,  status: "Late"    },
  { name: "Fastlink Logistics", contact: "accounts@fastlink.ng",  terms: "Net 45", balance: 3200,  status: "Good"    },
  { name: "DataStream Inc",     contact: "ap@datastream.ng",      terms: "Net 30", balance: 21000, status: "Dispute" },
]
const recentDocs = [
  { name: "Receipt_MarketRun_May18.pdf", type: "Receipt", size: "1.2 MB", date: "May 18, 2026", vendor: "Balogun Market"   },
  { name: "INV-2026-006_Nwosu.pdf",      type: "Invoice", size: "384 KB", date: "Apr 28, 2026", vendor: "Nwosu Pharma"    },
  { name: "Receipt_TechCore_May12.pdf",  type: "Receipt", size: "890 KB", date: "May 12, 2026", vendor: "TechCore Nigeria" },
  { name: "INV-2026-005_Lagos.pdf",      type: "Invoice", size: "512 KB", date: "May 10, 2026", vendor: "Lagos Textile Co" },
]

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => `₦${n.toLocaleString()}`

function Badge({ status }) {
  const map = {
    Paid:    { bg: "#e8f8ef", color: "#27ae60" },
    Sent:    { bg: "#e6f2fb", color: "#1a6fa8" },
    Overdue: { bg: "#fdecea", color: "#c0392b" },
    Draft:   { bg: "#f5f5f5", color: "#666"    },
    Partial: { bg: "#fef3e2", color: "#e67e22" },
    Good:    { bg: "#e8f8ef", color: "#27ae60" },
    Late:    { bg: "#fef3e2", color: "#e67e22" },
    Dispute: { bg: "#fdecea", color: "#c0392b" },
  }
  const s = map[status] || { bg: "#eee", color: "#555" }
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {status}
    </span>
  )
}

function Toggle({ on, set, T }) {
  return (
    <div onClick={() => set(!on)} style={{ width: 40, height: 22, background: on ? T.accent : T.border, borderRadius: 11, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
    </div>
  )
}

// ── LOGIN ────────────────────────────────────────────────────────
function Login({ onLogin, onSignupInstead, T }) {
  const [email, setEmail]         = useState("")
  const [pass, setPass]           = useState("")
  const [loading, setLoading]     = useState(false)
  const [shake, setShake]         = useState(false)
  const [serverErr, setServerErr] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !pass) { setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true)
    setServerErr("")
    try {
      const { data } = await api.post('/auth/login', { email, password: pass })
      localStorage.setItem('rims_token', data.token)
      onLogin(data)
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message
      setServerErr(
        status === 423 ? "Account locked — too many failed attempts. Try again in 30 minutes." :
        status === 401 ? "Incorrect email or password." :
        status === 403 ? "Your account has been deactivated." :
        msg || "Login failed. Please try again."
      )
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "16px" }}>
      <div style={{ position: "fixed", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: T.accentLight, opacity: 0.5, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -80, width: 320, height: 320, borderRadius: "50%", background: T.accentLight, opacity: 0.4, pointerEvents: "none" }} />

      <div style={{ background: T.card, borderRadius: 24, padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: `1px solid ${T.border}`, animation: "fadeUp 0.5s ease", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: T.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>💰</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: -0.5 }}>RIMS</div>
            <div style={{ fontSize: 11, color: T.textSub, letterSpacing: 0.5 }}>RECEIPT & INVOICE MANAGEMENT</div>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: T.textSub, marginBottom: 28 }}>Sign in to your RIMS account</p>

        <form onSubmit={handleSubmit} style={{ animation: shake ? "shake 0.4s ease" : "none" }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 6 }}>Email address</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="owner@yourbusiness.ng"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 15, marginBottom: 16, outline: "none", boxSizing: "border-box" }} />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 6 }}>Password</label>
          <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 15, marginBottom: 8, outline: "none", boxSizing: "border-box" }} />

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: T.accent, cursor: "pointer" }}>Forgot password?</span>
          </div>

          {serverErr && (
            <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.danger }}>
              {serverErr}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? T.accentMid : T.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: T.textSub }}>
          Don't have an account?{" "}
          <span onClick={onSignupInstead} style={{ color: T.accent, fontWeight: 600, cursor: "pointer" }}>Create one</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
      `}</style>
    </div>
  )
}

// ── SIGNUP ───────────────────────────────────────────────────────
function Signup({ onSignup, onLoginInstead, T }) {
  const [form, setForm]           = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" })
  const [errs, setErrs]           = useState({})
  const [loading, setLoading]     = useState(false)
  const [shake, setShake]         = useState(false)
  const [serverErr, setServerErr] = useState("")

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrs(p => ({ ...p, [k]: "" })); setServerErr("") }

  function strength(p) {
    if (!p) return 0
    let s = 0
    if (p.length >= 8)           s++
    if (/[A-Z]/.test(p))         s++
    if (/[0-9]/.test(p))         s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = "First name is required"
    if (!form.lastName.trim())  e.lastName  = "Last name is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required"
    if (form.password.length < 8) e.password = "Minimum 8 characters"
    if (form.password !== form.confirm) e.confirm = "Passwords do not match"
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrs(e); setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true)
    setServerErr("")
    try {
      const { data } = await api.post('/auth/register', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      })
      localStorage.setItem('rims_token', data.token)
      onSignup(data)
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        const fieldErrs = {}
        err.response.data.errors.forEach(fe => { fieldErrs[fe.path] = fe.msg })
        setErrs(fieldErrs)
      } else if (status === 409) {
        setErrs(p => ({ ...p, email: "This email is already registered." }))
      } else {
        setServerErr(err.response?.data?.message || "Registration failed. Please try again.")
      }
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const pw  = form.password
  const str = strength(pw)
  const strColors = ["", "#e74c3c", "#e67e22", "#f39c12", "#27ae60"]
  const strLabels = ["", "Weak", "Fair", "Good", "Strong"]
  const strColor  = strColors[str] || "#e74c3c"
  const strLabel  = strLabels[str] || ""

  function Field({ label, field, type = "text", placeholder }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>{label}</label>
        <input value={form[field]} onChange={set(field)} type={type} placeholder={placeholder}
          style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${errs[field] ? "#e74c3c" : T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        {errs[field] && <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 4 }}>{errs[field]}</div>}
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "16px" }}>
      <div style={{ position: "fixed", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: T.accentLight, opacity: 0.5, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -80, width: 320, height: 320, borderRadius: "50%", background: T.accentLight, opacity: 0.4, pointerEvents: "none" }} />

      <div style={{ background: T.card, borderRadius: 24, padding: "clamp(24px,5vw,40px) clamp(20px,5vw,36px)", width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: `1px solid ${T.border}`, position: "relative", zIndex: 1, animation: "fadeUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: T.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>💰</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: -0.5 }}>RIMS</div>
            <div style={{ fontSize: 11, color: T.textSub, letterSpacing: 0.5 }}>RECEIPT & INVOICE MANAGEMENT</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Create your account</h1>
        <p style={{ fontSize: 14, color: T.textSub, marginBottom: 24 }}>Get started with RIMS today</p>

        <form onSubmit={handleSubmit} style={{ animation: shake ? "shake 0.4s ease" : "none" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}><Field label="First Name" field="firstName" placeholder="Amara" /></div>
            <div style={{ flex: 1, minWidth: 0 }}><Field label="Last Name"  field="lastName"  placeholder="Okafor" /></div>
          </div>

          <Field label="Email address" field="email" type="email" placeholder="you@yourbusiness.ng" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>Password</label>
            <input value={pw} onChange={set("password")} type="password" placeholder="Min. 8 characters"
              style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${errs.password ? "#e74c3c" : T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            {pw && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: str >= i ? strColor : T.border, transition: "background 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strColor, fontWeight: 600 }}>{strLabel}</div>
              </div>
            )}
            {errs.password && <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 4 }}>{errs.password}</div>}
          </div>

          <Field label="Confirm Password" field="confirm" type="password" placeholder="••••••••" />

          {serverErr && (
            <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: T.danger }}>
              {serverErr}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px", background: loading ? T.accentMid : T.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: 4 }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: T.textSub }}>
          Already have an account?{" "}
          <span onClick={onLoginInstead} style={{ color: T.accent, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
      `}</style>
    </div>
  )
}

// ── SIDEBAR ──────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", icon: "📊", label: "Dashboard"        },
  { id: "invoices",  icon: "🧾", label: "Invoices"          },
  { id: "receipts",  icon: "📄", label: "Receipts"          },
  { id: "vendors",   icon: "🏢", label: "Vendors & Clients" },
  { id: "documents", icon: "📁", label: "Documents"         },
  { id: "reports",   icon: "📈", label: "Reports"           },
  { id: "settings",  icon: "⚙️", label: "Settings"          },
]

function Sidebar({ active, setActive, dark, setDark, collapsed, setCollapsed, isMobile, sidebarOpen, setSidebarOpen, onLogout, T }) {
  const visible = isMobile ? sidebarOpen : true
  const width   = isMobile ? 260 : collapsed ? 68 : 228

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
      )}

      <div style={{
        width, background: T.sidebar, height: "100vh",
        position: "fixed", left: 0, top: 0,
        display: "flex", flexDirection: "column",
        transition: "transform 0.25s ease, width 0.25s ease",
        transform: visible ? "translateX(0)" : "translateX(-100%)",
        zIndex: 100,
        borderRight: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "2px 0 20px rgba(0,0,0,0.15)",
        overflowY: "auto",
      }}>
        <div style={{ padding: collapsed && !isMobile ? "22px 0" : "22px 20px", display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
          <div style={{ width: 36, height: 36, background: T.accent, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginLeft: collapsed && !isMobile ? 16 : 0 }}>💰</div>
          {(!collapsed || isMobile) && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: -0.3 }}>RIMS</div>
              <div style={{ fontSize: 9, color: T.sidebarText, opacity: 0.6, letterSpacing: 0.8 }}>MANAGEMENT SYSTEM</div>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.sidebarText, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
          )}
        </div>

        <nav style={{ flex: 1, padding: "8px 0" }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setActive(item.id); if (isMobile) setSidebarOpen(false) }}
              title={collapsed && !isMobile ? item.label : ""}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed && !isMobile ? "12px 0" : "12px 20px", justifyContent: collapsed && !isMobile ? "center" : "flex-start", cursor: "pointer", background: active === item.id ? "rgba(77,166,90,0.18)" : "transparent", borderLeft: active === item.id ? `3px solid ${T.sidebarActive}` : "3px solid transparent", transition: "all 0.15s" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {(!collapsed || isMobile) && <span style={{ fontSize: 14, fontWeight: active === item.id ? 600 : 400, color: active === item.id ? "#fff" : T.sidebarText }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding: collapsed && !isMobile ? "12px 0" : "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div onClick={() => setDark(!dark)} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed && !isMobile ? "center" : "flex-start", cursor: "pointer", padding: "10px", borderRadius: 8 }}>
            <span style={{ fontSize: 18 }}>{dark ? "☀️" : "🌙"}</span>
            {(!collapsed || isMobile) && <span style={{ fontSize: 13, color: T.sidebarText }}>{dark ? "Light mode" : "Dark mode"}</span>}
          </div>
          {!isMobile && (
            <div onClick={() => setCollapsed(!collapsed)} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start", cursor: "pointer", padding: "10px", borderRadius: 8 }}>
              <span style={{ fontSize: 16, color: T.sidebarText }}>{collapsed ? "→" : "←"}</span>
              {!collapsed && <span style={{ fontSize: 13, color: T.sidebarText }}>Collapse</span>}
            </div>
          )}
          <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed && !isMobile ? "center" : "flex-start", cursor: "pointer", padding: "10px", borderRadius: 8 }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            {(!collapsed || isMobile) && <span style={{ fontSize: 13, color: "#e74c3c" }}>Log out</span>}
          </div>
        </div>
      </div>
    </>
  )
}

// ── STAT CARD ────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, color, icon, T }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 20px", flex: "1 1 160px", minWidth: 0, transition: "transform 0.2s, box-shadow 0.2s", borderTop: `3px solid ${color}` }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)" }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 800, color: T.text, marginBottom: 4, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 12, color: trend > 0 ? "#27ae60" : trend < 0 ? "#e74c3c" : T.textSub }}>
        {trend !== undefined && `${trend > 0 ? "↑" : "↓"} ${Math.abs(trend)}% vs last month`} {sub}
      </div>
    </div>
  )
}

// ── DASHBOARD ────────────────────────────────────────────────────
function Dashboard({ T, isMobile, isTablet }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Financial Overview</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>May 2026 · Updated just now</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total Receivables" value="₦489,200" trend={8.2}   icon="📥" color="#27ae60" T={T} />
        <StatCard label="Total Payables"    value="₦218,350" trend={-3.1}  icon="💸" color="#e74c3c" T={T} />
        <StatCard label="Net Cash Position" value="₦270,850" trend={14.5}  icon="💵" color="#3498db" T={T} />
        <StatCard label="Overdue Invoices"  value="₦26,800"  sub="2 invoices" icon="⚠️" color="#e67e22" T={T} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Cash Flow Trend</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="grR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#27ae60" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#27ae60" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e74c3c" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#e74c3c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={48} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
              <Area type="monotone" dataKey="receivables" stroke="#27ae60" fill="url(#grR)" strokeWidth={2} name="Receivables" />
              <Area type="monotone" dataKey="payables"    stroke="#e74c3c" fill="url(#grP)" strokeWidth={2} name="Payables" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>Invoice Status</div>
          <ResponsiveContainer width="100%" height={isMobile ? 140 : 160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textMid }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                {s.name} {s.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aging + recent invoices */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Aging Report</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={agingData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={44} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {agingData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Recent Invoices</div>
            <span style={{ fontSize: 12, color: T.accent, cursor: "pointer", whiteSpace: "nowrap" }}>View all →</span>
          </div>
          {invoices.slice(0, 4).map(inv => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}`, gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.client}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>{inv.id}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{fmt(inv.amount)}</div>
                <Badge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── INVOICES ─────────────────────────────────────────────────────
function Invoices({ T, isMobile }) {
  const [filter, setFilter]   = useState("All")
  const [search, setSearch]   = useState("")
  const [showNew, setShowNew] = useState(false)
  const statuses = ["All", "Draft", "Sent", "Overdue", "Paid", "Partial"]
  const filtered = invoices.filter(i =>
    (filter === "All" || i.status === filter) &&
    (i.client.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search))
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Invoices</h2>
          <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Manage your invoice lifecycle</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: isMobile ? "flex-start" : "auto" }}>
          + New Invoice
        </button>
      </div>

      <div style={{ background: T.infoLight, border: `1px solid ${T.info}33`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, overflowX: "auto" }}>
        <div style={{ fontSize: 13, color: T.info, whiteSpace: isMobile ? "normal" : "nowrap" }}>
          <strong>DSO:</strong> 28.4 days avg · <strong>Collection rate:</strong> 94.2% · <strong>Outstanding:</strong> ₦244,600
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexDirection: "column" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…"
          style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${filter === s ? T.accent : T.border}`, background: filter === s ? T.accentLight : T.surface, color: filter === s ? T.accent : T.textMid, fontSize: 13, cursor: "pointer", fontWeight: filter === s ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Mobile card view */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(inv => (
            <div key={inv.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{inv.id}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginTop: 2 }}>{inv.client}</div>
                </div>
                <Badge status={inv.status} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fmt(inv.amount)}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>
                    Due: {inv.due}
                    {inv.days > 0 && <span style={{ color: "#e74c3c", marginLeft: 4 }}>({inv.days}d overdue)</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ padding: "6px 12px", background: T.accentLight, color: T.accent, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>View</button>
                  {inv.status !== "Paid" && <button style={{ padding: "6px 12px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Send</button>}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textSub }}>No invoices match your filter.</div>}
        </div>
      ) : (
        /* Desktop table view */
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Invoice #", "Client", "Amount", "Due Date", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{inv.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: T.text, fontWeight: 500 }}>{inv.client}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: T.text, whiteSpace: "nowrap" }}>{fmt(inv.amount)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.textMid, whiteSpace: "nowrap" }}>
                    {inv.due}
                    {inv.days > 0 && <span style={{ color: "#e74c3c", fontSize: 11, marginLeft: 6 }}>({inv.days}d)</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}><Badge status={inv.status} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ padding: "5px 10px", background: T.accentLight, color: T.accent, border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>View</button>
                      {inv.status !== "Paid" && <button style={{ padding: "5px 10px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Send</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textSub }}>No invoices match your filter.</div>}
        </div>
      )}

      {/* New Invoice Modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: T.card, borderRadius: 20, padding: isMobile ? "24px 20px" : 32, width: "100%", maxWidth: 520, border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>New Invoice</h3>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textSub }}>✕</button>
            </div>
            {[["Client Name", "text", "Acme Ltd"], ["Invoice Number", "text", "INV-2026-007"], ["Amount (₦)", "number", "0.00"], ["Due Date", "date", ""]].map(([lbl, type, ph]) => (
              <div key={lbl} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>{lbl}</label>
                <input type={type} placeholder={ph} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: "11px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setShowNew(false)} style={{ flex: 2, padding: "11px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Create Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── RECEIPTS ─────────────────────────────────────────────────────
function Receipts({ T, isMobile }) {
  const [drag, setDrag] = useState(false)
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Receipts & Document Capture</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Upload, scan, and manage receipts with OCR extraction</p>
      </div>

      <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false) }}
        style={{ border: `2px dashed ${drag ? T.accent : T.borderMid}`, borderRadius: 16, padding: isMobile ? "28px 16px" : "40px 24px", textAlign: "center", marginBottom: 24, background: drag ? T.accentLight : T.surface, transition: "all 0.2s", cursor: "pointer" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: T.text, marginBottom: 6 }}>Drop files here or click to upload</div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 16 }}>Supports PDF, JPG, PNG · OCR extraction in &lt;10 seconds</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ padding: "9px 16px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>📂 Browse Files</button>
          <button style={{ padding: "9px 16px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>📧 Email Inbox</button>
          <button style={{ padding: "9px 16px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>📷 Camera</button>
        </div>
      </div>

      <div style={{ background: T.warnLight, border: `1px solid ${T.warn}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ fontSize: 13, color: T.warn }}><strong>1 document</strong> has a field with OCR confidence below 90% — please review before saving.</div>
        </div>
        <button style={{ marginLeft: isMobile ? 0 : "auto", padding: "6px 14px", background: T.warn, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: isMobile ? "flex-start" : "auto", flexShrink: 0 }}>Review</button>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>Recent Documents</div>

        {isMobile ? (
          <div>
            {recentDocs.map(doc => (
              <div key={doc.name} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1, marginRight: 8 }}>📄 {doc.name}</div>
                  <span style={{ background: doc.type === "Receipt" ? T.accentLight : T.infoLight, color: doc.type === "Receipt" ? T.accent : T.info, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{doc.type}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSub }}>{doc.vendor} · {doc.date} · {doc.size}</div>
                <button style={{ marginTop: 8, padding: "4px 10px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Preview</button>
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["File", "Type", "Vendor / Source", "Size", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDocs.map(doc => (
                <tr key={doc.name} style={{ borderTop: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text, fontWeight: 500 }}>📄 {doc.name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: doc.type === "Receipt" ? T.accentLight : T.infoLight, color: doc.type === "Receipt" ? T.accent : T.info, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{doc.type}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.textMid, whiteSpace: "nowrap" }}>{doc.vendor}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.textSub, whiteSpace: "nowrap" }}>{doc.size}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.textSub, whiteSpace: "nowrap" }}>{doc.date}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button style={{ padding: "4px 10px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Preview</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── VENDORS & CLIENTS ────────────────────────────────────────────
function VendorsClients({ T, isMobile }) {
  const [tab, setTab] = useState("vendors")
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Vendors & Clients</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Manage relationships and payment histories</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {["vendors", "clients"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${tab === t ? T.accent : T.border}`, background: tab === t ? T.accentLight : T.surface, color: tab === t ? T.accent : T.textMid, fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
        ))}
        <button style={{ marginLeft: "auto", padding: "9px 18px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>+ Add {tab.slice(0, -1)}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {vendors.map(v => (
          <div key={v.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, transition: "transform 0.2s", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, background: T.accentLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏢</div>
              <Badge status={v.status} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{v.name}</div>
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.contact}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: T.textMid }}>Terms: <strong>{v.terms}</strong></span>
              <span style={{ fontWeight: 700, color: v.status === "Good" ? T.accent : "#e74c3c" }}>₦{v.balance.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DOCUMENTS ────────────────────────────────────────────────────
function Documents({ T, isMobile }) {
  const [search, setSearch] = useState("")
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Document Storage</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Cloud-based secure repository · 7-year retention</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor, amount, date, keyword…"
          style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", minWidth: 0 }} />
        <button style={{ padding: "10px 16px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Search</button>
        <button style={{ padding: "10px 16px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>📦 Export</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[["📄 Receipts", "128", T.accent], ["🧾 Invoices", "94", T.info], ["📦 Archived", "340", T.textSub]].map(([lbl, n, c]) => (
          <div key={lbl} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 13, color: T.textMid, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        {recentDocs.concat(recentDocs).map((doc, i) => (
          <div key={i} style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${T.border}`, transition: "background 0.15s", flexDirection: isMobile ? "column" : "row" }}
            onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📄</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{doc.vendor} · {doc.date} · {doc.size}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ background: doc.type === "Receipt" ? T.accentLight : T.infoLight, color: doc.type === "Receipt" ? T.accent : T.info, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{doc.type}</span>
              <button style={{ padding: "5px 10px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Preview</button>
              <button style={{ padding: "5px 10px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>↓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── REPORTS ──────────────────────────────────────────────────────
function Reports({ T, isMobile, isTablet }) {
  const monthly = [
    { m: "Jan", rev: 82000, exp: 45000 }, { m: "Feb", rev: 91000, exp: 52000 },
    { m: "Mar", rev: 75000, exp: 38000 }, { m: "Apr", rev: 110000, exp: 61000 },
    { m: "May", rev: 98000, exp: 54000 },
  ]
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Reports & Analytics</h2>
          <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Financial summaries and trend analysis</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 14px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>📥 PDF</button>
          <button style={{ padding: "8px 14px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>📊 Excel</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Monthly Revenue vs Expenses</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <BarChart data={monthly} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: T.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={44} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
              <Bar dataKey="rev" fill="#27ae60" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="exp" fill="#e74c3c" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Net Cash Flow Trend</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={44} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
              <Line type="monotone" dataKey="net" stroke="#3498db" strokeWidth={2.5} dot={{ fill: "#3498db", r: 4 }} name="Net Flow" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 12 }}>
        {["Monthly Summary", "Quarterly Report", "Annual Statement", "Aging Report", "Tax Report", "Audit Trail"].map(r => (
          <div key={r} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{r}</div>
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Last generated: May 2026</div>
            </div>
            <span style={{ fontSize: 20 }}>📄</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SETTINGS ─────────────────────────────────────────────────────
function Settings({ T }) {
  const [mfa, setMfa]       = useState(true)
  const [notifs, setNotifs] = useState(true)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Settings</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Configure your RIMS workspace</p>
      </div>
      {[
        { title: "Business Profile", items: [["Business Name", "input", "Sunrise Enterprises Ltd"], ["Email", "input", "admin@sunrise.ng"]] },
        { title: "Security",         items: [["Multi-Factor Authentication", "toggle-mfa", mfa], ["Account Lock (5 failed attempts)", "static-on", true]] },
        { title: "Notifications",    items: [["Invoice due reminders (7, 3, 1 day)", "toggle-notifs", notifs], ["Overdue escalation alerts", "static-on", true], ["Payment confirmation emails", "static-on", true]] },
        { title: "Integrations",     items: [["QuickBooks Sync", "status", "Connected"], ["Paystack Gateway", "status", "Connected"], ["Xero", "status", "Disconnected"]] },
      ].map(section => (
        <div key={section.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14, color: T.text }}>{section.title}</div>
          {section.items.map(([lbl, type, val]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: T.text, flex: 1, minWidth: 0 }}>{lbl}</span>
              {type === "input"         && <input defaultValue={val} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, maxWidth: 220, width: "100%" }} />}
              {type === "toggle-mfa"    && <Toggle on={mfa}    set={setMfa}    T={T} />}
              {type === "toggle-notifs" && <Toggle on={notifs} set={setNotifs} T={T} />}
              {type === "static-on"     && <Toggle on={true}   set={() => {}}  T={T} />}
              {type === "status"        && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: val === "Connected" ? T.successLight : T.dangerLight, color: val === "Connected" ? T.success : T.danger, whiteSpace: "nowrap" }}>{val}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── ROOT APP ─────────────────────────────────────────────────────
const pages = {
  dashboard: Dashboard,
  invoices:  Invoices,
  receipts:  Receipts,
  vendors:   VendorsClients,
  documents: Documents,
  reports:   Reports,
  settings:  Settings,
}

export default function App() {
  const [dark, setDark]               = useState(false)
  const [loggedIn, setLoggedIn]       = useState(false)
  const [authView, setAuthView]       = useState("login")
  const [user, setUser]               = useState(null)
  const [active, setActive]           = useState("dashboard")
  const [collapsed, setCollapsed]     = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const width    = useWindowSize()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024

  const T     = dark ? DARK : LIGHT
  const sideW = isMobile ? 0 : collapsed ? 68 : 228
  const Page  = pages[active] || Dashboard

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('rims_token')
    if (!token) return
    api.get('/auth/me')
      .then(({ data }) => { setUser(data.user); setLoggedIn(true) })
      .catch(() => localStorage.removeItem('rims_token'))
  }, [])

  function handleAuth({ token, user: u }) {
    localStorage.setItem('rims_token', token)
    setUser(u)
    setLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('rims_token')
    setUser(null)
    setLoggedIn(false)
    setAuthView("login")
  }

  if (!loggedIn) {
    if (authView === "signup")
      return <Signup onSignup={handleAuth} onLoginInstead={() => setAuthView("login")} T={T} />
    return <Login onLogin={handleAuth} onSignupInstead={() => setAuthView("signup")} T={T} />
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: T.text }}>
      <Sidebar
        active={active} setActive={setActive}
        dark={dark} setDark={setDark}
        collapsed={collapsed} setCollapsed={setCollapsed}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        T={T}
      />

      <div style={{ marginLeft: sideW, transition: "margin-left 0.25s ease", minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ height: 56, background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.text, lineHeight: 1, padding: 0 }}>☰</button>
            )}
            <div style={{ fontSize: 13, color: T.textSub }}>
              Home / <span style={{ color: T.text, fontWeight: 600, textTransform: "capitalize" }}>{active}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 20, cursor: "pointer" }}>🔔</span>
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#e74c3c", borderRadius: "50%" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, background: T.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?"}
              </div>
              {!isMobile && (
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: isMobile ? "16px" : "28px" }}>
          <Page T={T} isMobile={isMobile} isTablet={isTablet} />
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input, button, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.borderMid}; border-radius: 3px; }
      `}</style>
    </div>
  )
}
