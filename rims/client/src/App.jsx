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

// ── Helpers ──────────────────────────────────────────────────────
const fmt   = (n) => `₦${Number(n || 0).toLocaleString()}`
const cap   = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const STATUS_COLORS = {
  paid: '#4da65a', sent: '#3498db', overdue: '#e74c3c',
  draft: '#95a5a6', partial: '#f39c12', viewed: '#9b59b6',
}
const AGING_META = [
  { range: '0–30d',  fill: '#4da65a' },
  { range: '31–60d', fill: '#e67e22' },
  { range: '61–90d', fill: '#e74c3c' },
  { range: '90+d',   fill: '#8e44ad' },
]

function Loader({ T }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: T.textSub, fontSize: 14 }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
      Loading…
    </div>
  )
}

function Empty({ message, T }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: T.textSub, fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
      {message}
    </div>
  )
}

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

// ── SIGNUP FIELD (module-scope so identity is stable across renders) ─
function SignupField({ label, value, onChange, type = "text", placeholder, error, T }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>{label}</label>
      <input value={value} onChange={onChange} type={type} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${error ? "#e74c3c" : T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      {error && <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 4 }}>{error}</div>}
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
const ROLES = [
  { value: "admin",      icon: "👑", label: "Admin",       desc: "Full access & user management"     },
  { value: "accountant", icon: "📊", label: "Accountant",  desc: "Invoices, receipts & reports"      },
  { value: "vendor",     icon: "🏢", label: "Vendor",      desc: "View invoices & payment history"   },
  { value: "client",     icon: "👤", label: "Client",      desc: "Access statements & documents"     },
]

function Signup({ onSignup, onLoginInstead, T }) {
  const [form, setForm]           = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "", role: "accountant" })
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
        role:      form.role,
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 8 }}>I am a…</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ROLES.map(r => {
                const selected = form.role === r.value
                return (
                  <div key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{ border: `2px solid ${selected ? T.accent : T.border}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", background: selected ? T.accentLight : T.surface, transition: "all 0.15s", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selected ? T.accent : T.text }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: T.textSub, marginTop: 1, lineHeight: 1.3 }}>{r.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}><SignupField label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="Amara"  error={errs.firstName} T={T} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><SignupField label="Last Name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Okafor" error={errs.lastName}  T={T} /></div>
          </div>

          <SignupField label="Email address" value={form.email} onChange={set("email")} type="email" placeholder="you@yourbusiness.ng" error={errs.email} T={T} />

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

          <SignupField label="Confirm Password" value={form.confirm} onChange={set("confirm")} type="password" placeholder="••••••••" error={errs.confirm} T={T} />

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
function Dashboard({ T, isMobile, isTablet, onNavigate }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader T={T} />

  const kpi            = data?.kpi || {}
  const cashFlowData   = (data?.cashFlow || []).map(d => ({ month: MONTHS[d._id.month - 1], receivables: d.receivables }))
  const agingData      = (data?.agingBuckets || []).map((b, i) => ({ ...AGING_META[i] || { range: '90+d', fill: '#8e44ad' }, amount: b.amount }))
  const statusData     = (data?.statusDistribution || []).map(s => ({ name: cap(s.status), value: s.count, color: STATUS_COLORS[s.status] || '#95a5a6' }))
  const recentInvoices = data?.recentInvoices || []
  const totalPct       = statusData.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Financial Overview</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Live data · Updated just now</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total Receivables" value={fmt(kpi.totalReceivables)}  icon="📥" color="#27ae60" T={T} />
        <StatCard label="Total Payables"    value={fmt(kpi.totalPayables)}     icon="💸" color="#e74c3c" T={T} />
        <StatCard label="Net Cash Position" value={fmt(kpi.netCashPosition)}   icon="💵" color="#3498db" T={T} />
        <StatCard label="Overdue Invoices"  value={fmt(kpi.overdueTotal)} sub={kpi.overdueCount ? `${kpi.overdueCount} invoice${kpi.overdueCount > 1 ? 's' : ''}` : 'None'} icon="⚠️" color="#e67e22" T={T} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Cash Flow Trend</div>
          {cashFlowData.length === 0
            ? <Empty message="No invoice data yet" T={T} />
            : <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="grR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#27ae60" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#27ae60" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSub }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={48} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
                  <Area type="monotone" dataKey="receivables" stroke="#27ae60" fill="url(#grR)" strokeWidth={2} name="Receivables" />
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>Invoice Status</div>
          {statusData.length === 0
            ? <Empty message="No invoices yet" T={T} />
            : <>
                <ResponsiveContainer width="100%" height={isMobile ? 140 : 160}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => `${Math.round(v / totalPct * 100)}%`} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
                  {statusData.map(s => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textMid }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Aging Report</div>
          {agingData.length === 0
            ? <Empty message="No outstanding invoices" T={T} />
            : <ResponsiveContainer width="100%" height={160}>
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
          }
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Recent Invoices</div>
            <span onClick={() => onNavigate('invoices')} style={{ fontSize: 12, color: T.accent, cursor: "pointer", whiteSpace: "nowrap" }}>View all →</span>
          </div>
          {recentInvoices.length === 0
            ? <Empty message="No invoices yet" T={T} />
            : recentInvoices.map(inv => (
                <div key={inv._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}`, gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.clientSnapshot?.name}</div>
                    <div style={{ fontSize: 11, color: T.textSub }}>{inv.invoiceNumber}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{fmt(inv.total)}</div>
                    <Badge status={cap(inv.status)} />
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}

// ── INVOICES ─────────────────────────────────────────────────────
const EMPTY_ITEM = () => ({ description: '', quantity: 1, unitPrice: 0 })
const EMPTY_FORM = () => ({ clientName: '', dueDate: '', taxRate: 0, discount: 0, notes: '', items: [EMPTY_ITEM()] })

function Invoices({ T, isMobile }) {
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState("All")
  const [search, setSearch]       = useState("")
  const [debSearch, setDebSearch] = useState("")
  const [showNew, setShowNew]     = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM())
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState("")
  const statuses = ["All", "Draft", "Sent", "Overdue", "Paid", "Partial"]

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Fetch invoices
  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filter !== 'All') params.status = filter.toLowerCase()
    if (debSearch) params.search = debSearch
    api.get('/invoices', { params })
      .then(r => { setRows(r.data.invoices); setTotal(r.data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter, debSearch])

  function setItem(i, key, val) {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [key]: val }
      return { ...f, items }
    })
  }
  function addItem()    { setForm(f => ({ ...f, items: [...f.items, EMPTY_ITEM()] })) }
  function removeItem(i){ setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) })) }

  const subtotal  = form.items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0)
  const taxAmt    = subtotal * Number(form.taxRate || 0) / 100
  const invoTotal = subtotal + taxAmt - Number(form.discount || 0)

  async function handleCreate() {
    if (!form.clientName.trim()) { setFormErr('Client name is required'); return }
    if (!form.dueDate)           { setFormErr('Due date is required');     return }
    if (form.items.some(it => !it.description.trim())) { setFormErr('All line items need a description'); return }
    setFormErr(''); setSaving(true)
    try {
      await api.post('/invoices', {
        clientSnapshot: { name: form.clientName },
        dueDate:   form.dueDate,
        taxRate:   Number(form.taxRate),
        discount:  Number(form.discount),
        notes:     form.notes,
        items:     form.items.map(it => ({ description: it.description, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      })
      setShowNew(false); setForm(EMPTY_FORM())
      // Refresh list
      const params = {}
      if (filter !== 'All') params.status = filter.toLowerCase()
      const r = await api.get('/invoices', { params })
      setRows(r.data.invoices); setTotal(r.data.total)
    } catch (err) {
      setFormErr(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to create invoice')
    } finally { setSaving(false) }
  }

  async function handleSend(id) {
    await api.patch(`/invoices/${id}/status`, { status: 'sent' }).catch(console.error)
    setRows(prev => prev.map(r => r._id === id ? { ...r, status: 'sent' } : r))
  }

  const inputSty = { width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Invoices</h2>
          <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>{total} invoice{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => { setShowNew(true); setForm(EMPTY_FORM()); setFormErr('') }}
          style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: isMobile ? "flex-start" : "auto" }}>
          + New Invoice
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexDirection: "column" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or invoice number…"
          style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${filter === s ? T.accent : T.border}`, background: filter === s ? T.accentLight : T.surface, color: filter === s ? T.accent : T.textMid, fontSize: 13, cursor: "pointer", fontWeight: filter === s ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? <Loader T={T} /> : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(inv => (
            <div key={inv._id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginTop: 2 }}>{inv.clientSnapshot?.name}</div>
                </div>
                <Badge status={cap(inv.status)} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fmt(inv.total)}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Due: {fmtDate(inv.dueDate)}
                    {inv.daysOverdue > 0 && <span style={{ color: "#e74c3c", marginLeft: 4 }}>({inv.daysOverdue}d overdue)</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {inv.status === 'draft' && <button onClick={() => handleSend(inv._id)} style={{ padding: "6px 12px", background: T.accentLight, color: T.accent, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Send</button>}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <Empty message="No invoices match your filter." T={T} />}
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Invoice #", "Client", "Total", "Balance", "Due Date", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(inv => (
                <tr key={inv._id} style={{ borderTop: `1px solid ${T.border}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: T.text, fontWeight: 500 }}>{inv.clientSnapshot?.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: T.text, whiteSpace: "nowrap" }}>{fmt(inv.total)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: inv.balance > 0 ? T.warn : T.success, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(inv.balance)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.textMid, whiteSpace: "nowrap" }}>
                    {fmtDate(inv.dueDate)}
                    {inv.daysOverdue > 0 && <span style={{ color: "#e74c3c", fontSize: 11, marginLeft: 6 }}>({inv.daysOverdue}d)</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}><Badge status={cap(inv.status)} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    {inv.status === 'draft' && (
                      <button onClick={() => handleSend(inv._id)} style={{ padding: "5px 10px", background: T.accentLight, color: T.accent, border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Send</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty message="No invoices match your filter." T={T} />}
        </div>
      )}

      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: T.card, borderRadius: 20, padding: isMobile ? "20px 16px" : 28, width: "100%", maxWidth: 580, border: `1px solid ${T.border}`, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>New Invoice</h3>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textSub }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Client Name *</label>
                <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Acme Ltd" style={inputSty} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inputSty} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>Line Items *</label>
                <button onClick={addItem} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Add item</button>
              </div>
              <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 88px 80px 28px", gap: 0, padding: "6px 10px", background: T.accentLight, fontSize: 10, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {['Description','Qty','Unit Price','Amount',''].map(h => <div key={h}>{h}</div>)}
                </div>
                {form.items.map((it, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 72px 88px 80px 28px", gap: 6, padding: "6px 10px", borderTop: `1px solid ${T.border}`, alignItems: "center" }}>
                    <input value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Item description" style={{ ...inputSty, padding: '6px 8px' }} />
                    <input type="number" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} min={0} style={{ ...inputSty, padding: '6px 8px' }} />
                    <input type="number" value={it.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} min={0} style={{ ...inputSty, padding: '6px 8px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmt(it.quantity * it.unitPrice)}</div>
                    <button onClick={() => removeItem(i)} disabled={form.items.length === 1} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 16, lineHeight: 1, opacity: form.items.length === 1 ? 0.3 : 1 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Tax Rate (%)</label>
                <input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} min={0} max={100} style={inputSty} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Discount (₦)</label>
                <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} min={0} style={inputSty} />
              </div>
            </div>

            <div style={{ background: T.accentLight, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.textMid, marginBottom: 4 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {Number(form.taxRate) > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: T.textMid, marginBottom: 4 }}><span>Tax ({form.taxRate}%)</span><span>{fmt(taxAmt)}</span></div>}
              {Number(form.discount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: T.textMid, marginBottom: 4 }}><span>Discount</span><span>−{fmt(form.discount)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, color: T.text, borderTop: `1px solid ${T.borderMid}`, paddingTop: 6, marginTop: 4 }}><span>Total</span><span>{fmt(invoTotal)}</span></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Payment instructions, terms…" style={{ ...inputSty, resize: 'vertical' }} />
            </div>

            {formErr && <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}44`, borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 13, color: T.danger }}>{formErr}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: "11px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: "11px", background: saving ? T.accentMid : T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Creating…" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── RECEIPTS ─────────────────────────────────────────────────────
function Receipts({ T, isMobile }) {
  const [drag, setDrag]           = useState(false)
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [reviewCount, setReview]  = useState(0)
  const fileRef                   = useState(null)

  useEffect(() => {
    api.get('/receipts', { params: { limit: 20 } })
      .then(r => { setRows(r.data.receipts); })
      .catch(console.error)
      .finally(() => setLoading(false))
    api.get('/receipts', { params: { needsReview: true, limit: 1 } })
      .then(r => setReview(r.data.total))
      .catch(() => {})
  }, [])

  async function handleFileDrop(files) {
    if (!files?.length) return
    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('type', 'expense')
    fd.append('date', new Date().toISOString())
    fd.append('amount', '0')
    try {
      await api.post('/receipts', fd)
      const r = await api.get('/receipts', { params: { limit: 20 } })
      setRows(r.data.receipts)
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Receipts & Document Capture</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Upload, scan, and manage receipts with OCR extraction</p>
      </div>

      <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFileDrop(e.dataTransfer.files) }}
        style={{ border: `2px dashed ${drag ? T.accent : T.borderMid}`, borderRadius: 16, padding: isMobile ? "28px 16px" : "40px 24px", textAlign: "center", marginBottom: 24, background: drag ? T.accentLight : T.surface, transition: "all 0.2s", cursor: "pointer" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: T.text, marginBottom: 6 }}>Drop files here or click to upload</div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 16 }}>Supports PDF, JPG, PNG · OCR extraction in &lt;10 seconds</div>
        <label style={{ padding: "9px 16px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, display: "inline-block" }}>
          📂 Browse Files
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={e => handleFileDrop(e.target.files)} />
        </label>
      </div>

      {reviewCount > 0 && (
        <div style={{ background: T.warnLight, border: `1px solid ${T.warn}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row" }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ fontSize: 13, color: T.warn }}><strong>{reviewCount} document{reviewCount > 1 ? 's' : ''}</strong> with OCR confidence below 90% — please review before saving.</div>
          <button onClick={() => {}} style={{ marginLeft: isMobile ? 0 : "auto", padding: "6px 14px", background: T.warn, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Review</button>
        </div>
      )}

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>Recent Receipts</div>
        {loading ? <Loader T={T} /> : rows.length === 0 ? <Empty message="No receipts yet — upload one above." T={T} /> : isMobile ? (
          <div>
            {rows.map(doc => (
              <div key={doc._id} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1, marginRight: 8 }}>📄 {doc.file?.name || doc.receiptNumber}</div>
                  <span style={{ background: T.accentLight, color: T.accent, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{cap(doc.type)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSub }}>{doc.vendorSnapshot?.name || '—'} · {fmtDate(doc.date)} · {fmt(doc.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["File / Number", "Type", "Vendor", "Amount", "Date", "OCR"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(doc => (
                <tr key={doc._id} style={{ borderTop: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>📄 {doc.file?.name || doc.receiptNumber}</td>
                  <td style={{ padding: "12px 16px" }}><span style={{ background: T.accentLight, color: T.accent, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{cap(doc.type)}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.textMid }}>{doc.vendorSnapshot?.name || '—'}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text }}>{fmt(doc.amount)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.textSub, whiteSpace: "nowrap" }}>{fmtDate(doc.date)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: doc.needsReview ? T.warn : T.success }}>{doc.ocr?.status || '—'}</td>
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
const EMPTY_VC = () => ({ name: '', email: '', phone: '', paymentTerms: 'Net 30', paymentStatus: 'Good', creditLimit: 0 })

function VendorsClients({ T, isMobile }) {
  const [tab, setTab]         = useState("vendors")
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(EMPTY_VC())
  const [saving, setSaving]   = useState(false)
  const [addErr, setAddErr]   = useState("")

  useEffect(() => {
    setLoading(true)
    api.get(`/${tab}`)
      .then(r => setRows(r.data[tab]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tab])

  async function handleAdd() {
    if (!form.name.trim()) { setAddErr('Name is required'); return }
    setSaving(true); setAddErr('')
    try {
      await api.post(`/${tab}`, form)
      setShowAdd(false); setForm(EMPTY_VC())
      const r = await api.get(`/${tab}`)
      setRows(r.data[tab])
    } catch (e) {
      setAddErr(e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const inputSty = { width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }

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
        <button onClick={() => { setShowAdd(true); setForm(EMPTY_VC()); setAddErr('') }}
          style={{ marginLeft: "auto", padding: "9px 18px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          + Add {tab.slice(0, -1)}
        </button>
      </div>

      {loading ? <Loader T={T} /> : rows.length === 0 ? <Empty message={`No ${tab} yet.`} T={T} /> : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {rows.map(v => (
            <div key={v._id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, transition: "transform 0.2s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, background: T.accentLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏢</div>
                {v.paymentStatus && <Badge status={v.paymentStatus} />}
                {v.status && <Badge status={cap(v.status)} />}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{v.name}</div>
              <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.email || v.contact || '—'}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: T.textMid }}>Terms: <strong>{v.paymentTerms || '—'}</strong></span>
                <span style={{ fontWeight: 700, color: v.balance > 0 ? T.warn : T.textSub }}>{fmt(v.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: T.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>Add {tab.slice(0, -1)}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textSub }}>✕</button>
            </div>
            {[['Name *', 'name', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'tel'], ['Payment Terms', 'paymentTerms', 'text']].map(([lbl, key, type]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>{lbl}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputSty} />
              </div>
            ))}
            {tab === 'vendors' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Payment Status</label>
                <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))} style={inputSty}>
                  {['Good', 'Late', 'Dispute'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            {tab === 'clients' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Credit Limit (₦)</label>
                <input type="number" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} min={0} style={inputSty} />
              </div>
            )}
            {addErr && <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}44`, borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 13, color: T.danger }}>{addErr}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{ flex: 2, padding: "11px", background: saving ? T.accentMid : T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : `Add ${cap(tab.slice(0, -1))}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DOCUMENTS ────────────────────────────────────────────────────
function Documents({ T, isMobile }) {
  const [search, setSearch]   = useState("")
  const [debSearch, setDeb]   = useState("")
  const [rows, setRows]       = useState([])
  const [counts, setCounts]   = useState({ receipt: 0, invoice: 0, archived: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDeb(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = { limit: 30 }
    if (debSearch) params.search = debSearch
    api.get('/documents', { params })
      .then(r => setRows(r.data.documents))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [debSearch])

  useEffect(() => {
    Promise.all([
      api.get('/documents', { params: { type: 'receipt', limit: 1 } }),
      api.get('/documents', { params: { type: 'invoice', limit: 1 } }),
      api.get('/documents', { params: { archived: true,  limit: 1 } }),
    ]).then(([r, inv, arch]) => setCounts({ receipt: r.data.total, invoice: inv.data.total, archived: arch.data.total }))
      .catch(() => {})
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Document Storage</h2>
        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Secure repository · 7-year retention</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor, keyword, filename…"
          style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", minWidth: 0 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[["📄 Receipts", counts.receipt, T.accent], ["🧾 Invoices", counts.invoice, T.info], ["📦 Archived", counts.archived, T.textSub]].map(([lbl, n, c]) => (
          <div key={lbl} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 13, color: T.textMid, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        {loading ? <Loader T={T} /> : rows.length === 0 ? <Empty message="No documents found." T={T} /> : rows.map((doc) => (
          <div key={doc._id} style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${T.border}`, transition: "background 0.15s", flexDirection: isMobile ? "column" : "row" }}
            onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📄</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{doc.entityName || '—'} · {fmtDate(doc.createdAt)} · {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '—'}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ background: doc.type === "receipt" ? T.accentLight : T.infoLight, color: doc.type === "receipt" ? T.accent : T.info, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{cap(doc.type)}</span>
              <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noreferrer"
                style={{ padding: "5px 10px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", textDecoration: "none" }}>↓</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── REPORTS ──────────────────────────────────────────────────────
const REPORT_CARDS = [
  { label: "Invoice Report",    sub: "All invoices with totals & status", endpoint: "/reports/invoices",  icon: "🧾" },
  { label: "Receipt Report",    sub: "All receipts and expense records",  endpoint: "/reports/receipts",  icon: "📄" },
  { label: "Financial Summary", sub: "Yearly income vs expenses",         endpoint: "/reports/summary",   icon: "📊" },
  { label: "Aging Report",      sub: "Outstanding invoices by age",       endpoint: "/reports/aging",     icon: "⏳" },
  { label: "Invoice Report",    sub: "Excel format with totals",          endpoint: "/reports/invoices",  icon: "🧾", fmt: "excel" },
  { label: "Receipt Report",    sub: "Excel format with summaries",       endpoint: "/reports/receipts",  icon: "📄", fmt: "excel" },
]

async function downloadReport(endpoint, format = "pdf") {
  try {
    const ext = format === "excel" ? "xlsx" : "pdf"
    const { data, headers } = await api.get(endpoint, {
      params: { format },
      responseType: "blob",
    })
    const cd = headers["content-disposition"] || ""
    const match = cd.match(/filename="?([^"]+)"?/)
    const filename = match ? match[1] : `report.${ext}`
    const url = URL.createObjectURL(new Blob([data]))
    const a = document.createElement("a")
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error("Export failed:", e)
    alert("Export failed. Please try again.")
  }
}

function Reports({ T, isMobile, isTablet }) {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [downloading, setDl]      = useState(null)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cashFlowData = (data?.cashFlow || []).map(d => ({ month: MONTHS[d._id.month - 1], receivables: d.receivables }))

  async function handleDownload(endpoint, format, key) {
    setDl(key)
    await downloadReport(endpoint, format)
    setDl(null)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: T.text, margin: 0 }}>Reports & Analytics</h2>
          <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Financial summaries and trend analysis</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleDownload("/reports/summary", "pdf", "summary-pdf")}
            disabled={downloading === "summary-pdf"}
            style={{ padding: "8px 14px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", opacity: downloading === "summary-pdf" ? 0.6 : 1 }}>
            {downloading === "summary-pdf" ? "Exporting…" : "📥 PDF"}
          </button>
          <button onClick={() => handleDownload("/reports/summary", "excel", "summary-excel")}
            disabled={downloading === "summary-excel"}
            style={{ padding: "8px 14px", background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", opacity: downloading === "summary-excel" ? 0.6 : 1 }}>
            {downloading === "summary-excel" ? "Exporting…" : "📊 Excel"}
          </button>
        </div>
      </div>

      {loading ? <Loader T={T} /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Monthly Revenue</div>
              {cashFlowData.length === 0 ? <Empty message="No data yet" T={T} /> : (
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <BarChart data={cashFlowData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={44} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
                    <Bar dataKey="receivables" fill="#27ae60" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Receivables Trend</div>
              {cashFlowData.length === 0 ? <Empty message="No data yet" T={T} /> : (
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: T.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} width={44} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13 }} />
                    <Line type="monotone" dataKey="receivables" stroke="#3498db" strokeWidth={2.5} dot={{ fill: "#3498db", r: 4 }} name="Receivables" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 12 }}>
            {REPORT_CARDS.map((card, i) => {
              const format = card.fmt || "pdf"
              const key = `card-${i}`
              const isLoading = downloading === key
              return (
                <div key={i} onClick={() => !isLoading && handleDownload(card.endpoint, format, key)}
                  style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, transition: "background 0.15s" }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = T.accentLight }}
                  onMouseLeave={e => e.currentTarget.style.background = T.card}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>
                      {isLoading ? "Generating…" : `${card.sub} · ${format.toUpperCase()}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 20 }}>{isLoading ? "⏳" : format === "excel" ? "📊" : card.icon}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
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
          <Page T={T} isMobile={isMobile} isTablet={isTablet} onNavigate={setActive} />
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
