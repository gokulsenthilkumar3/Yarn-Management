import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

describe('LoginPage', () => {
    it('should render login form', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        // Check for email input
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

        // Check for password input
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

        // Check for login button
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have a link to register page', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        const registerLink = screen.getByText(/don't have an account/i);
        expect(registerLink).toBeInTheDocument();
    });
});
