"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/cuenta/actions";

export function AuthForms({
  initialMode,
  error,
  info,
}: {
  initialMode: "login" | "register";
  error?: string;
  info?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  return (
    <div>
      <div className="form-row">
        <button
          type="button"
          className={`btn small ${mode === "login" ? "" : "ghost"}`}
          onClick={() => setMode("login")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={`btn small ${mode === "register" ? "" : "ghost"}`}
          onClick={() => setMode("register")}
        >
          Crear cuenta
        </button>
      </div>

      {error && <div className="note note-error">{error}</div>}
      {info && <div className="note">{info}</div>}

      {mode === "login" ? (
        <form action={signIn}>
          <div className="form-row">
            <label>Correo</label>
            <input type="email" name="email" required />
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input type="password" name="password" required />
          </div>
          <div className="form-row">
            <button className="btn" type="submit">
              Iniciar sesión
            </button>
          </div>
        </form>
      ) : (
        <form action={signUp}>
          <div className="form-row">
            <label>Nombre</label>
            <input type="text" name="name" required />
          </div>
          <div className="form-row">
            <label>Correo</label>
            <input type="email" name="email" required />
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              minLength={6}
              required
              placeholder="mínimo 6 caracteres"
            />
          </div>
          <div className="form-row">
            <button className="btn" type="submit">
              Crear cuenta
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
