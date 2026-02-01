import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, setAccessToken as setToken, clearAccessToken as clearToken } from '../lib/auth';

interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.userId || payload.sub,
                    email: payload.email,
                    name: payload.name || payload.email?.split('@')[0] || 'User',
                    role: payload.role || 'USER'
                });
            } catch (e) {
                console.error('Invalid token', e);
                clearToken();
            }
        }
    }, []);

    const login = (token: string) => {
        setToken(token);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
                id: payload.userId || payload.sub,
                email: payload.email,
                name: payload.name || payload.email?.split('@')[0] || 'User',
                role: payload.role || 'USER'
            });
            // Fetch fresh profile immediately
            refreshProfile();
        } catch (e) {
            console.error('Invalid token on login', e);
        }
    };

    const logout = () => {
        clearToken();
        setUser(null);
        window.location.href = '/login';
    };

    const refreshProfile = async () => {
        try {
            // We need to use http client here but avoiding circular dependency might be tricky if http uses auth context?
            // http uses lib/auth which is pure functions. AuthContext uses lib/auth.
            // But we can't import http here if http imports auth which imports something else...
            // Let's rely on fetch or check http implementation. http imports setAccessToken/getAccessToken from lib/auth. Safe.
            const { http } = await import('../lib/http');
            const { data } = await http.get('/users/me');
            if (data.user) {
                setUser(prev => ({
                    ...prev!,
                    ...data.user
                }));
            }
        } catch (e) {
            console.error('Failed to refresh profile', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            logout,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
