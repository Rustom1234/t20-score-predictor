// src/theme.js
//
// Detects whether the configured teams (constants.js) are national sides or
// IPL franchises. This is a genuine conditional, not a hardcoded choice: if
// TEAMS is ever swapped out for IPL franchise names, detectTheme() below will
// notice and switch to the "ipl" theme on its own, no code changes needed
// elsewhere. The app's visuals are strictly monochrome regardless of which
// theme this resolves to (see App.css) - THEME is only used to label the
// current mode in the UI (e.g. the terminal title bar), never to pick colors.
import { TEAMS } from './constants';

// Known IPL franchise names (covers historical and current naming).
const IPL_FRANCHISES = new Set([
  'Mumbai Indians',
  'Chennai Super Kings',
  'Royal Challengers Bangalore',
  'Royal Challengers Bengaluru',
  'Kolkata Knight Riders',
  'Delhi Capitals',
  'Delhi Daredevils',
  'Punjab Kings',
  'Kings XI Punjab',
  'Rajasthan Royals',
  'Sunrisers Hyderabad',
  'Gujarat Titans',
  'Lucknow Super Giants',
  'Deccan Chargers',
  'Pune Warriors',
  'Gujarat Lions',
  'Rising Pune Supergiant',
]);

// If most of the configured teams are IPL franchises, use the IPL theme.
// Otherwise (the default today, since TEAMS holds national sides) use the
// international theme.
export function detectTheme(teams = TEAMS) {
  if (!teams || teams.length === 0) return 'international';
  const iplMatches = teams.filter((t) => IPL_FRANCHISES.has(t)).length;
  return iplMatches > teams.length / 2 ? 'ipl' : 'international';
}

export const THEME = detectTheme();
