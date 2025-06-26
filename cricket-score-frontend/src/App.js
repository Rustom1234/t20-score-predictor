// src/App.js
import React, { useState } from 'react';
import { TEAMS, CITIES } from './constants';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['batting_team', 'bowling_team', 'city'].includes(name)
        ? value
        : Number(value),
    }));
  };

  const errors = [];
  if (form.overs < 0 || form.overs > 20) errors.push('Overs must be between 0 and 20');
  if (form.current_score < 0) errors.push('Current score cannot be negative');
  else if (form.current_score > form.overs * 36) errors.push('Current score too high');
  if (form.wickets < 0 || form.wickets > 10) errors.push('Wickets must be between 0 and 10');
  if (form.batting_team === form.bowling_team) errors.push('Teams must differ');

  const isValid = errors.length === 0;

  const predict = async () => {
    if (!isValid) return;
    setLoading(true);
    setResult(null);

    const balls_left = 120 - form.overs * 6;
    const wickets_left = 10 - form.wickets;
    const current_run_rate = form.overs ? form.current_score / form.overs : 0;
    const payload = { ...form, balls_left, wickets_left, current_run_rate };

    try {
      const res = await fetch('${API_URL}/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { predicted_score } = await res.json();
      setResult(predicted_score);
    } catch {
      alert('Prediction failed — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="gradient-text">Cricket Score Predictor</h1>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((e, i) => (
            <div key={i}>• {e}</div>
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
        {loading ? <span className="spinner"></span> : 'Predict Score'}
      </button>

      {result !== null && <div className="result">Predicted Score: {result}</div>}
    </div>
  );
}
