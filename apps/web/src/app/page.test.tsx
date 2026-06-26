import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderWithProviders } from '~/test/render';
import ChatPage from './page';

describe('ChatPage', () => {
  it('renders the empty state with starter suggestions', () => {
    const { getByRole } = renderWithProviders(<ChatPage />);
    expect(
      getByRole('heading', { name: /how can i help/i }),
    ).toBeInTheDocument();
    expect(
      getByRole('button', { name: /what projects are in this portfolio/i }),
    ).toBeInTheDocument();
    expect(
      getByRole('textbox', { name: /message the assistant/i }),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<ChatPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
