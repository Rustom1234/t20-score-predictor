// src/App.js
import React, { useState } from 'react';
import { TEAMS, CITIES } from './constants';
import { THEME, getTeamColors } from './theme';
import './App.css';

// Grab your deployed API URL from the environment (or fallback)
const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://t20-score-predictor-8ege.onrender.com';

// Free-tier hosts (like Render's free plan) spin down after inactivity and
// can take 30-60s to wake back up on the first request. Give the request
// plenty of room before we call it unreachable.
const REQUEST_TIMEOUT_MS = 55000;

// A small CSS-drawn stumps + ball motif. No photos, no team logos, just
// shapes, so this stays copyright-safe wherever the app is shared.
function StumpsMotif() {
  return (
    <svg
      className="stumps-motif"
      viewBox="0 0 120 70"
      role="img"
      aria-label="Cricket stumps and ball"
    >
      <ellipse cx="60" cy="66" rx="50" ry="4" className="stumps-shadow" />
      <rect x="18" y="14" width="6" height="48" rx="3" className="stump" />
      <rect x="57" y="10" width="6" height="52" rx="3" className="stump" />
      <rect x="96" y="14" width="6" height="48" rx="3" className="stump" />
      <rect x="14" y="8" width="16" height="5" rx="2" className="bail" />
      <rect x="53" y="4" width="16" height="5" rx="2" className="bail" />
      <rect x="90" y="8" width="16" height="5" rx="2" className="bail" />
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
    current_score: 0,
    overs: 5,
    wickets: 0,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResult(null);
    setApiError(null);
    setForm((prev) => ({
      ...prev,
      [name]: ['batting_team', 'bowling_team', 'city'].includes(name)
        ? value
        : Number(value),
    }));
  };

  // Validation guards
  const errors = [];
  if (form.overs < 0 || form.overs > 20) errors.push('Overs must be between 0 and 20');
  if (form.current_score < 0) errors.push('Current score cannot be negative');
  else if (form.current_score > form.overs * 36)
    errors.push('Current score too high for overs');
  if (form.wickets < 0 || form.wickets > 10)
    errors.push('Wickets must be between 0 and 10');
  if (form.batting_team === form.bowling_team)
    errors.push('Batting and bowling teams must differ');

  const isValid = errors.length === 0;

  const predict = async () => {
    if (!isValid) return;
    setLoading(true);
    setResult(null);
    setApiError(null);

    const balls_left = 120 - form.overs * 6;
    const wickets_left = 10 - form.wickets;
    const current_run_rate = form.overs ? form.current_score / form.overs : 0;
    const payload = { ...form, balls_left, wickets_left, current_run_rate };

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

  const accentColors = getTeamColors(form.batting_team);
  const accentStyle = {
    '--flag-color-1': accentColors[0],
    '--flag-color-2': accentColors[1] || accentColors[0],
    '--flag-color-3': accentColors[2] || accentColors[1] || accentColors[0],
  };

  return (
    <div className={`page theme-${THEME}`}>
      <div className="pitch-backdrop" aria-hidden="true" />
      <div className="floodlight floodlight-left" aria-hidden="true" />
      <div className="floodlight floodlight-right" aria-hidden="true" />

      <div className="container" style={accentStyle}>
        <div className="flag-stripe" />
        <StumpsMotif />
        <h1 className="gradient-text">T20 Score Predictor</h1>
        <p className="subtitle">
          International T20 cricket &middot; live win-projection model
        </p>

        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e, i) => (
              <div key={i}>&bull; {e}</div>
            ))}
          </div>
        )}

        {['batting_team', 'bowling_team', 'city'].map((field) => (
          <div className="form-group" key={field}>
            <label>{field.replace('_', ' ').toUpperCase()}</label>
            <select name={field} value={form[field]} onChange={handleChange}>
              {(field === 'city' ? CITIES : TEAMS).map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}

        {['current_score', 'overs', 'wickets'].map((field) => (
          <div className="form-group" key={field}>
            <label>{field.replace('_', ' ').toUpperCase()}</label>
            <input
              type="number"
              name={field}
              value={form[field]}
              onChange={handleChange}
              min="0"
              max={
                field === 'overs'
                  ? 20
                  : field === 'wickets'
                  ? 10
                  : form.overs * 36
              }
              step={field === 'overs' ? 0.1 : 1}
            />
          </div>
        ))}

        <button onClick={predict} disabled={!isValid || loading}>
          {loading ? <span className="spinner" /> : 'Predict Score'}
        </button>

        {loading && (
          <div className="waking-note">
            The server may need to wake up from sleep - this can take up to a
            minute on first request.
          </div>
        )}

        {apiError && (
          <div className="api-error" role="alert">
            <strong>Prediction unavailable.</strong>
            <div>{apiError}</div>
            <button className="retry-button" onClick={predict}>
              Try again
            </button>
          </div>
        )}

        {result !== null && (
          <div className="result">Predicted Score: {result}</div>
        )}
      </div>
    </div>
  );
}
