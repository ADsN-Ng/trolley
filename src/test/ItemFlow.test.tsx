import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { createDemoStore, resetDemoStorage } from '../data/demoStore';
import { setStoreForTests } from '../data';

describe('add and tick item flow', () => {
  beforeEach(() => {
    resetDemoStorage();
    localStorage.clear();
    setStoreForTests(createDemoStore());
  });

  it('lets you open a list, add an item, and tick it off', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /my lists/i })).toBeInTheDocument();
    await user.click(await screen.findByRole('link', { name: /open list/i }));

    expect(await screen.findByText(/add an item/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^name$/i), 'Avocados');
    await user.clear(screen.getByLabelText(/^qty$/i));
    await user.type(screen.getByLabelText(/^qty$/i), '3');
    await user.selectOptions(screen.getByLabelText(/^category$/i), 'Produce');
    await user.click(screen.getByRole('button', { name: /add to list/i }));

    expect(await screen.findByText('Avocados')).toBeInTheDocument();

    const tick = await screen.findByRole('button', { name: /tick off avocados/i });
    await user.click(tick);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark avocados as needed/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/bought by you/i)).toBeInTheDocument();
  });
});
