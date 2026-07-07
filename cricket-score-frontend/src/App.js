// src/App.js
import React, { useState } from 'react';
import { TEAMS, CITIES } from './constants';
import { THEME } from './theme';
import './App.css';

// Grab your deployed API URL from the environment (or fallback)
const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://t20-score-predictor-8ege.onrender.com';

// Free-tier hosts (like Render's free plan) spin down after inactivity and
// can take 30-60s to wake back up on the first request. Give the request
// plenty of room before we call it unreachable.
const REQUEST_TIMEOUT_MS = 55000;

// Fields that are numeric inputs. Their form state is kept as a *string*
// (not a number) for as long as the user is editing, and is only coerced to
// a number via toNum() for validation/submission. This sidesteps the classic
// controlled <input type="number"> bug: if the state is a number and every
// keystroke goes through Number(value), typing into a field that already
// displays "0" can leave the DOM and React's value tracker out of sync,
// producing "05" instead of "5" (confirmed by driving the real input).
// Keeping the raw string in state until submit time avoids that desync.
const NUMERIC_FIELDS = ['current_score', 'overs', 'wickets'];

// Hints shown via the placeholder attribute so the field still communicates
// a sensible starting point without pre-filling the value itself.
const NUMERIC_PLACEHOLDERS = {
  current_score: '0',
  overs: '5',
  wickets: '0',
};

const toNum = (v) => (v === '' || v === undefined ? 0 : Number(v));

// A small CSS-drawn stumps + ball motif, rendered in grayscale only. No
// photos, no team logos, just shapes, so this stays copyright-safe wherever
// the app is shared.
function StumpsMotif() {
  return (
    <svg
      className="stumps-motif"
      viewBox="0 0 120 70"
      role="img"
      aria-label="Cricket stumps and ball"
    >
      <ellipse cx="60" cy="66" rx="50" ry="4" className="stumps-shadow" />
      <rect x="18" y="14" width="6" height="48" rx="0" className="stump" />
      <rect x="57" y="10" width="6" height="52" rx="0" className="stump" />
      <rect x="96" y="14" width="6" height="48" rx="0" className="stump" />
      <rect x="14" y="8" width="16" height="5" rx="0" className="bail" />
      <rect x="53" y="4" width="16" height="5" rx="0" className="bail" />
      <rect x="90" y="8" width="16" height="5" rx="0" className="bail" />
      <circle cx="100" cy="46" r="9" className="ball" />
      <path d="M96 39 Q100 46 96 53" className="ball-seam" />
      <path d="M104 39 Q100 46 104 53" className="ball-seam" />
    </svg>
  );
}

export default function App() {
  const [form, setForm] = useState({
    batting_team: TEAMS[0],
    bowling_team: TEAMS[1],
    city: CITIES[0],
    // Numeric fields start genuinely empty rather than pre-filled with "0"
    // (or "5" for overs). A pre-filled value is what actually causes the
    // reported bug: clicking into a field that already shows "0" places the
    // cursor after the existing character (confirmed by driving the real
    // input), so the first keystroke appends instead of replacing, giving
    // "05" rather than "5". Starting empty removes anything to append to.
    // Placeholders (see JSX below) still hint the old defaults.
    current_score: '',
    overs: '',
    wickets: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResult(null);
    setApiError(null);

    if (!NUMERIC_FIELDS.includes(name)) {
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // Allow empty (mid-edit) and partial decimals ("1", "1.", "1.5", ".5").
    // Reject anything that isn't a plain non-negative number-in-progress -
    // in particular a lone "." (no digits at all), which Number() would
    // turn into NaN and silently break every downstream comparison.
    if (value === '' || /^(\d+\.?\d*|\.\d+)$/.test(value)) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Belt-and-braces: if a numeric field ever does hold a value when it
  // regains focus (e.g. the user tabs back into it to correct a number),
  // select the existing text so typing replaces it instead of appending.
  const selectOnFocus = (e) => e.target.select();

  const currentScore = toNum(form.current_score);
  const overs = toNum(form.overs);
  const wickets = toNum(form.wickets);

  // Validation guards
  const errors = [];
  if (overs < 0 || overs > 20) errors.push('Overs must be between 0 and 20');
  if (currentScore < 0) errors.push('Current score cannot be negative');
  else if (currentScore > overs * 36)
    errors.push('Current score too high for overs');
  if (wickets < 0 || wickets > 10)
    errors.push('Wickets must be between 0 and 10');
  if (form.batting_team === form.bowling_team)
    errors.push('Batting and bowling teams must differ');

  const isValid = errors.length === 0;

  const predict = async () => {
    if (!isValid) return;
    setLoading(true);
    setResult(null);
    setApiError(null);

    const balls_left = 120 - overs * 6;
    const wickets_left = 10 - wickets;
    const current_run_rate = overs ? currentScore / overs : 0;
    const payload = {
      batting_team: form.batting_team,
      bowling_team: form.bowling_team,
      city: form.city,
      current_score: currentScore,
      overs,
      wickets,
      balls_left,
      wickets_left,
      current_run_rate,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        setApiError(
          `The prediction server responded with an error (status ${res.status}). Please try again shortly.`
        );
        return;
      }

      const data = await res.json();
      if (typeof data.predicted_score === 'undefined') {
        setApiError('The server responded, but no prediction was returned.');
        return;
      }
      setResult(data.predicted_score);
    } catch (err) {
      if (err.name === 'AbortError') {
        setApiError(
          "No response after 55 seconds. This app's backend runs on a free hosting tier that falls asleep after inactivity - it can take up to a minute to wake up. Please try again."
        );
      } else {
        setApiError(
          'Could not reach the prediction server. It may be asleep (free hosting spins down when idle) or temporarily offline - please try again in a moment.'
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="terminal">
        <div className="title-bar">
          <div className="title-bar-dots" aria-hidden="true">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="title-bar-label">
            t20-predictor <span className="title-bar-mode">[{THEME}]</span>
          </div>
        </div>

        <div className="terminal-body">
          <StumpsMotif />
          <h1 className="heading">
            T20 Score Predictor<span className="cursor">_</span>
          </h1>
          <p className="subtitle">
            {'// T20 cricket · live win-projection model'}
          </p>

          <div className="divider" aria-hidden="true" />

          {errors.length > 0 && (
            <div className="errors" role="alert">
              {errors.map((e, i) => (
                <div key={i}>[!] {e}</div>
              ))}
            </div>
          )}

          {['batting_team', 'bowling_team', 'city'].map((field) => (
            <div className="form-group" key={field}>
              <label htmlFor={field}>&gt; {field.replace('_', ' ').toUpperCase()}</label>
              <select
                id={field}
                name={field}
                value={form[field]}
                onChange={handleChange}
              >
                {(field === 'city' ? CITIES : TEAMS).map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="divider" aria-hidden="true" />

          {['current_score', 'overs', 'wickets'].map((field) => (
            <div className="form-group" key={field}>
              <label htmlFor={field}>&gt; {field.replace('_', ' ').toUpperCase()}</label>
              <input
                id={field}
                type="number"
                name={field}
                value={form[field]}
                onChange={handleChange}
                onFocus={selectOnFocus}
                placeholder={NUMERIC_PLACEHOLDERS[field]}
                min="0"
                max={field === 'overs' ? 20 : field === 'wickets' ? 10 : overs * 36}
                step={field === 'overs' ? 0.1 : 1}
                inputMode="decimal"
              />
            </div>
          ))}

          <button onClick={predict} disabled={!isValid || loading}>
            {loading ? <span className="spinner" /> : '[ PREDICT SCORE ]'}
          </button>

          {loading && (
            <div className="waking-note">
              &gt; waking server... free-tier hosts can take up to a minute to
              respond after being idle.
            </div>
          )}

          {apiError && (
            <div className="api-error" role="alert">
              <strong>[ERROR] Prediction unavailable.</strong>
              <div>{apiError}</div>
              <button className="retry-button" onClick={predict}>
                [ retry ]
              </button>
            </div>
          )}

          {result !== null && (
            <div className="result">
              &gt; predicted score: <strong>{result}</strong>
              <span className="cursor">_</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
