

import { useState } from "react";


function InputField({ label, type, value, onChange, placeholder, error }) {
  return (
    <div style={styles.fieldWrapper}>
      {/* Label above input */}
      <label style={styles.label}>{label}</label>

      {/* The actual input */}
      <input
        type={type || "text"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...styles.input,
          borderColor: error ? "#fc5c7d" : "#2a2a3d",  // red border if error
        }}
      />

      {/* Show error message if exists */}
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

// ============================================================
// LOGIN FORM COMPONENT
// ============================================================
function LoginForm({ onSwitch }) {
  // State for form fields
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for success message
  const [success, setSuccess] = useState(false);

  // Validate form fields
  function validate() {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!email.includes("@")) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    return newErrors;
  }

  // Handle form submission
  function handleSubmit(e) {
    e.preventDefault();  // prevent page reload

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      // There are errors — show them
      setErrors(validationErrors);
      setSuccess(false);
    } else {
      // No errors — simulate login success
      setErrors({});
      setSuccess(true);
      console.log("Logging in with:", { email, password });
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Welcome Back 👋</h2>
      <p style={styles.subtitle}>Login to your account</p>

      {/* Success message */}
      {success && (
        <div style={styles.successBox}>
          ✅ Login successful! (Connect to backend for real auth)
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={errors.email}
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={errors.password}
        />

        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>

      <p style={styles.switchText}>
        Don't have an account?{" "}
        <span style={styles.link} onClick={onSwitch}>
          Register here
        </span>
      </p>
    </div>
  );
}

// ============================================================
// REGISTER FORM COMPONENT
// ============================================================
function RegisterForm({ onSwitch }) {
  const [formData, setFormData] = useState({
    fullName:        "",
    email:           "",
    password:        "",
    confirmPassword: "",
  });

  const [errors,  setErrors]  = useState({});
  const [success, setSuccess] = useState(false);

  // Generic change handler — updates the right field by name
  function handleChange(field) {
    return function(e) {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };
  }

  function validate() {
    const e = {};

    if (!formData.fullName.trim()) {
      e.fullName = "Full name is required.";
    }

    if (!formData.email) {
      e.email = "Email is required.";
    } else if (!formData.email.includes("@")) {
      e.email = "Enter a valid email.";
    }

    if (!formData.password) {
      e.password = "Password is required.";
    } else if (formData.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }

    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSuccess(false);
    } else {
      setErrors({});
      setSuccess(true);
      console.log("Registering:", formData);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Create Account ✨</h2>
      <p style={styles.subtitle}>Register a new account</p>

      {success && (
        <div style={styles.successBox}>
          ✅ Registered successfully! You can now log in.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Full Name"
          type="text"
          value={formData.fullName}
          onChange={handleChange("fullName")}
          placeholder="Sita Sharma"
          error={errors.fullName}
        />

        <InputField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange("email")}
          placeholder="you@example.com"
          error={errors.email}
        />

        <InputField
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange("password")}
          placeholder="Min. 6 characters"
          error={errors.password}
        />

        <InputField
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <button type="submit" style={styles.button}>
          Register
        </button>
      </form>

      <p style={styles.switchText}>
        Already have an account?{" "}
        <span style={styles.link} onClick={onSwitch}>
          Login here
        </span>
      </p>
    </div>
  );
}

// ============================================================
// MAIN APP — switches between Login and Register
// ============================================================
export default function App() {
  // track which form to show: "login" or "register"
  const [page, setPage] = useState("login");

  return (
    <div style={styles.page}>
      {/* Page heading */}
      <div style={styles.header}>
        <h1 style={styles.appTitle}>Auth App</h1>
        <p style={styles.appSub}>LAB 3 — React + State</p>
      </div>

      {/* Show the right form */}
      {page === "login" ? (
        <LoginForm    onSwitch={() => setPage("register")} />
      ) : (
        <RegisterForm onSwitch={() => setPage("login")}    />
      )}
    </div>
  );
}

// ============================================================
// INLINE STYLES (no CSS file needed for this lab)
// ============================================================
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Space Mono', monospace",
    padding: "2rem",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  appTitle: {
    color: "#7c5cfc",
    fontSize: "2rem",
    fontWeight: 800,
  },
  appSub: {
    color: "#8888aa",
    fontSize: "0.85rem",
    marginTop: "0.3rem",
  },
  card: {
    background: "#13131a",
    border: "1px solid #2a2a3d",
    borderRadius: "12px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "420px",
  },
  title: {
    color: "#e8e8f0",
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "0.3rem",
  },
  subtitle: {
    color: "#8888aa",
    fontSize: "0.85rem",
    marginBottom: "1.8rem",
  },
  fieldWrapper: {
    marginBottom: "1.2rem",
  },
  label: {
    display: "block",
    color: "#aaaacc",
    fontSize: "0.8rem",
    marginBottom: "0.4rem",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    background: "#1c1c28",
    border: "1px solid #2a2a3d",
    borderRadius: "6px",
    color: "#e8e8f0",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Space Mono', monospace",
  },
  errorText: {
    color: "#fc5c7d",
    fontSize: "0.75rem",
    marginTop: "0.3rem",
  },
  button: {
    width: "100%",
    background: "#7c5cfc",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.85rem",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "0.5rem",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.05em",
  },
  successBox: {
    background: "rgba(46,125,50,0.15)",
    border: "1px solid #2e7d32",
    color: "#81c784",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    marginBottom: "1.2rem",
  },
  switchText: {
    color: "#8888aa",
    fontSize: "0.85rem",
    textAlign: "center",
    marginTop: "1.5rem",
  },
  link: {
    color: "#7c5cfc",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
