import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the predictor heading', () => {
  render(<App />);
  const heading = screen.getByText(/T20 Score Predictor/i);
  expect(heading).toBeInTheDocument();
});
