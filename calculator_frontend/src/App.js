import React, { useEffect, useMemo, useReducer, useState } from "react";
import "./App.css";
import { CalculatorEngine } from "./calculatorEngine";

/**
 * PUBLIC_INTERFACE
 * App renders a simple calculator UI with basic arithmetic.
 *
 * Contract:
 * - No backend dependency; all computation is local and deterministic.
 * - Supports mouse/touch and basic keyboard input.
 * - Errors (like divide by zero) show "Error" until cleared.
 */
function App() {
  const [theme, setTheme] = useState("light");

  const [calcState, dispatch] = useReducer(
    CalculatorEngine.reduce,
    undefined,
    CalculatorEngine.initialState
  );

  // Observability: a minimal, consistent trace for debugging calculator behavior.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug("[CalculatorFlow] state", calcState);
  }, [calcState]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const title = useMemo(() => "Calculator", []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // Keyboard support maps keys to the same canonical flow actions.
  useEffect(() => {
    const onKeyDown = (e) => {
      const { key } = e;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        dispatch({ type: "DIGIT", payload: key });
        return;
      }

      if (key === ".") {
        e.preventDefault();
        dispatch({ type: "DOT" });
        return;
      }

      if (key === "Enter" || key === "=") {
        e.preventDefault();
        dispatch({ type: "EQUALS" });
        return;
      }

      if (key === "Backspace") {
        // Keep behavior simple: map Backspace to CLEAR (no partial delete flow requested).
        e.preventDefault();
        dispatch({ type: "CLEAR" });
        return;
      }

      const opMap = {
        "+": "+",
        "-": "−",
        "*": "×",
        x: "×",
        X: "×",
        "/": "÷",
      };

      if (opMap[key]) {
        e.preventDefault();
        dispatch({ type: "OP", payload: opMap[key] });
        return;
      }

      if (key === "%") {
        e.preventDefault();
        dispatch({ type: "PERCENT" });
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="App">
      <header className="calc-page">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>

        <div className="calc-shell" role="application" aria-label="Calculator">
          <div className="calc-header">
            <div className="calc-title">{title}</div>
            <div className="calc-subtitle">Basic arithmetic</div>
          </div>

          <div className="calc-display" aria-live="polite" aria-label="Display">
            {calcState.display}
          </div>

          <div className="calc-grid" role="group" aria-label="Calculator buttons">
            <CalcButton variant="muted" onClick={() => dispatch({ type: "CLEAR" })}>
              AC
            </CalcButton>
            <CalcButton variant="muted" onClick={() => dispatch({ type: "TOGGLE_SIGN" })}>
              +/−
            </CalcButton>
            <CalcButton variant="muted" onClick={() => dispatch({ type: "PERCENT" })}>
              %
            </CalcButton>
            <CalcButton variant="op" onClick={() => dispatch({ type: "OP", payload: "÷" })}>
              ÷
            </CalcButton>

            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "7" })}>7</CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "8" })}>8</CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "9" })}>9</CalcButton>
            <CalcButton variant="op" onClick={() => dispatch({ type: "OP", payload: "×" })}>
              ×
            </CalcButton>

            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "4" })}>4</CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "5" })}>5</CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "6" })}>6</CalcButton>
            <CalcButton variant="op" onClick={() => dispatch({ type: "OP", payload: "−" })}>
              −
            </CalcButton>

            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "1" })}>1</CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "2" })}>2</CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DIGIT", payload: "3" })}>3</CalcButton>
            <CalcButton variant="op" onClick={() => dispatch({ type: "OP", payload: "+" })}>
              +
            </CalcButton>

            <CalcButton className="span-2" onClick={() => dispatch({ type: "DIGIT", payload: "0" })}>
              0
            </CalcButton>
            <CalcButton onClick={() => dispatch({ type: "DOT" })}>.</CalcButton>
            <CalcButton variant="equals" onClick={() => dispatch({ type: "EQUALS" })}>
              =
            </CalcButton>
          </div>

          <div className="calc-help">
            Keyboard: 0-9, +, -, *, /, Enter, ., %
          </div>
        </div>
      </header>
    </div>
  );
}

/**
 * Small presentational component for calculator buttons.
 * Kept local to App to avoid premature component sprawl.
 */
function CalcButton({ children, onClick, variant, className }) {
  const cls = ["calc-btn", variant ? `calc-btn--${variant}` : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export default App;

