// src/theme.js
//
// Picks a visual theme (and per-team flag-style accent colors) based on
// whatever team names currently live in constants.js. This is a genuine
// conditional, not a hardcoded choice: if TEAMS is ever swapped out for IPL
// franchise names, detectTheme() below will notice and switch to the "ipl"
// theme on its own, no code changes needed elsewhere.
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

// Approximate national-flag color pairs/triples, used for a subtle accent
// stripe tied to whichever team is selected. Not official branding, just a
// couple of hex swatches evoking each flag.
export const INTERNATIONAL_TEAM_COLORS = {
  Afghanistan: ['#0f7b3e', '#ffffff', '#000000'],
  Australia: ['#00247d', '#ffcd00'],
  Bangladesh: ['#006a4e', '#f42a41'],
  England: ['#ce1124', '#ffffff'],
  India: ['#ff9933', '#ffffff', '#138808'],
  'New Zealand': ['#00247d', '#ffffff', '#cc142b'],
  Pakistan: ['#01411c', '#ffffff'],
  'South Africa': ['#007a4d', '#ffb81c', '#de3831'],
  'Sri Lanka': ['#ffb81c', '#8d153a', '#00534e'],
  'West Indies': ['#7b0041', '#ffcc00', '#00a651'],
};

// Placeholder franchise colors, only used if TEAMS ever becomes IPL data.
export const IPL_TEAM_COLORS = {
  'Mumbai Indians': ['#004ba0', '#d1ab65'],
  'Chennai Super Kings': ['#fdb913', '#0081cb'],
  'Royal Challengers Bangalore': ['#2b2a29', '#da1818'],
  'Royal Challengers Bengaluru': ['#2b2a29', '#da1818'],
  'Kolkata Knight Riders': ['#3a225d', '#d4af37'],
  'Delhi Capitals': ['#17479e', '#e83a5f'],
  'Punjab Kings': ['#a71930', '#c0c0c0'],
  'Rajasthan Royals': ['#254aa5', '#ea1a85'],
  'Sunrisers Hyderabad': ['#f7a721', '#000000'],
  'Gujarat Titans': ['#1b2133', '#b0a462'],
  'Lucknow Super Giants': ['#00a1e4', '#003366'],
};

const FALLBACK_COLORS = ['#3b82f6', '#2563eb'];

export function getTeamColors(teamName) {
  const table = THEME === 'ipl' ? IPL_TEAM_COLORS : INTERNATIONAL_TEAM_COLORS;
  return table[teamName] || FALLBACK_COLORS;
}
