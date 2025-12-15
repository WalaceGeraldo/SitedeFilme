import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check localStorage on mount
        const storedUser = localStorage.getItem('sepflix_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        // Simple mock authentication
        if (email === 'admin@sepflix.com' && password === '123456') {
            const userData = { email, name: 'Admin', role: 'admin' };
            setUser(userData);
            localStorage.setItem('sepflix_user', JSON.stringify(userData));
            return true;
        }

        // Check registered users in localStorage
        const users = JSON.parse(localStorage.getItem('sepflix_users_db') || '[]');
        const foundUser = users.find(u => u.email === email && u.password === password);

        if (foundUser) {
            const userData = { email: foundUser.email, name: foundUser.name, role: 'user' };
            setUser(userData);
            localStorage.setItem('sepflix_user', JSON.stringify(userData));
            return true;
        }

        return false;
    };

    const register = (email, password, name) => {
        const newUser = { email, password, name, role: 'user' };

        // Save to "database"
        const users = JSON.parse(localStorage.getItem('sepflix_users_db') || '[]');
        users.push(newUser);
        localStorage.setItem('sepflix_users_db', JSON.stringify(users));

        // Auto login
        const userData = { email, name, role: 'user' };
        setUser(userData);
        localStorage.setItem('sepflix_user', JSON.stringify(userData));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sepflix_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
