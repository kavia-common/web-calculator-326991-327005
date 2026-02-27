const MAX_DISPLAY_LENGTH = 18;

/**
 * CalculatorEngine is a small, deterministic state machine for a basic calculator.
 *
 * Contract:
 * - Inputs: tokens describing user intent (digits, dot, operators, commands).
 * - Outputs: a new immutable-ish state object + derived display string.
 * - Errors: never throws for normal user input; invalid actions are ignored.
 * - Side effects: none (pure logic; caller owns state storage).
 *
 * Invariants:
 * - `display` is always a non-empty string.
 * - `operator` is one of '+', '−', '×', '÷' or null.
 */
export class CalculatorEngine {
  /**
   * Create an initial calculator state.
   */
  static initialState() {
    return {
      display: "0",
      accumulator: null, // number | null
      operator: null, // string | null
      awaitingNext: false, // when true, next digit starts a new entry
      error: null, // string | null (e.g., "DIV_BY_ZERO")
    };
  }

  /**
   * PUBLIC_INTERFACE
   * Apply a single calculator action and return the next state.
   *
   * @param {object} state - current calculator state
   * @param {object} action - { type: string, payload?: any }
   * Types:
   * - DIGIT payload: "0"-"9"
   * - DOT
   * - OP payload: "+", "−", "×", "÷"
   * - EQUALS
   * - CLEAR (all clear)
   * - TOGGLE_SIGN
   * - PERCENT
   *
   * @returns {object} nextState
   */
  // PUBLIC_INTERFACE
  static reduce(state, action) {
    const safe = CalculatorEngine._sanitizeState(state);

    // If we're in an error state, only CLEAR should reset (others ignored).
    if (safe.error && action.type !== "CLEAR") {
      return safe;
    }

    switch (action.type) {
      case "DIGIT":
        return CalculatorEngine._inputDigit(safe, action.payload);
      case "DOT":
        return CalculatorEngine._inputDot(safe);
      case "OP":
        return CalculatorEngine._inputOperator(safe, action.payload);
      case "EQUALS":
        return CalculatorEngine._equals(safe);
      case "CLEAR":
        return CalculatorEngine.initialState();
      case "TOGGLE_SIGN":
        return CalculatorEngine._toggleSign(safe);
      case "PERCENT":
        return CalculatorEngine._percent(safe);
      default:
        return safe;
    }
  }

  static _sanitizeState(state) {
    const base = CalculatorEngine.initialState();
    return {
      ...base,
      ...(state || {}),
      display: typeof state?.display === "string" && state.display.length > 0 ? state.display : "0",
    };
  }

  static _formatNumber(num) {
    if (!Number.isFinite(num)) return "Error";
    // Keep it simple and predictable (no scientific unless required by JS).
    const s = String(num);
    if (s.length <= MAX_DISPLAY_LENGTH) return s;
    // Trim to fit; fall back to exponential for very long numbers.
    const exp = num.toExponential(10);
    return exp.length <= MAX_DISPLAY_LENGTH ? exp : num.toExponential(6);
  }

  static _parseDisplay(display) {
    // Handle "-0" and "0." etc.
    const n = Number(display);
    if (Number.isNaN(n)) return 0;
    return n;
  }

  static _inputDigit(state, digit) {
    if (digit === undefined || digit === null) return state;
    const d = String(digit);
    if (!/^[0-9]$/.test(d)) return state;

    if (state.awaitingNext) {
      return { ...state, display: d, awaitingNext: false };
    }

    if (state.display === "0") {
      return { ...state, display: d };
    }

    if (state.display.length >= MAX_DISPLAY_LENGTH) return state;
    return { ...state, display: state.display + d };
  }

  static _inputDot(state) {
    if (state.awaitingNext) {
      return { ...state, display: "0.", awaitingNext: false };
    }
    if (state.display.includes(".")) return state;
    if (state.display.length >= MAX_DISPLAY_LENGTH) return state;
    return { ...state, display: state.display + "." };
  }

  static _toggleSign(state) {
    if (state.display === "0") return state;
    if (state.display.startsWith("-")) {
      return { ...state, display: state.display.slice(1) };
    }
    if (state.display.length + 1 > MAX_DISPLAY_LENGTH) return state;
    return { ...state, display: "-" + state.display };
  }

  static _percent(state) {
    const current = CalculatorEngine._parseDisplay(state.display);
    const pct = current / 100;
    return { ...state, display: CalculatorEngine._formatNumber(pct) };
  }

  static _inputOperator(state, operator) {
    const op = String(operator);
    if (!["+", "−", "×", "÷"].includes(op)) return state;

    const current = CalculatorEngine._parseDisplay(state.display);

    // If operator pressed repeatedly, just update the operator.
    if (state.awaitingNext && state.accumulator !== null) {
      return { ...state, operator: op };
    }

    // If we already have an accumulator and operator, compute intermediate result.
    if (state.accumulator !== null && state.operator) {
      const computed = CalculatorEngine._compute(state.accumulator, current, state.operator);
      if (computed.error) return { ...state, error: computed.error, display: "Error" };
      return {
        ...state,
        accumulator: computed.value,
        operator: op,
        display: CalculatorEngine._formatNumber(computed.value),
        awaitingNext: true,
      };
    }

    return {
      ...state,
      accumulator: current,
      operator: op,
      awaitingNext: true,
    };
  }

  static _equals(state) {
    if (state.accumulator === null || !state.operator) return state;

    const current = CalculatorEngine._parseDisplay(state.display);
    const computed = CalculatorEngine._compute(state.accumulator, current, state.operator);

    if (computed.error) {
      return { ...state, error: computed.error, display: "Error", accumulator: null, operator: null, awaitingNext: false };
    }

    return {
      ...state,
      display: CalculatorEngine._formatNumber(computed.value),
      accumulator: null,
      operator: null,
      awaitingNext: true,
    };
  }

  static _compute(a, b, operator) {
    switch (operator) {
      case "+":
        return { value: a + b, error: null };
      case "−":
        return { value: a - b, error: null };
      case "×":
        return { value: a * b, error: null };
      case "÷":
        if (b === 0) return { value: 0, error: "DIV_BY_ZERO" };
        return { value: a / b, error: null };
      default:
        return { value: b, error: null };
    }
  }
}

