import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onSearch, searchQuery }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="fixed w-full z-50 px-4 py-4 md:px-10 bg-gradient-to-b from-black/90 to-transparent">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link to="/">
                        <h1 className="text-red-600 text-3xl font-bold tracking-tighter cursor-pointer">SEPFLIX</h1>
                    </Link>

                    {/* Desktop Menu */}
                    <ul className="hidden md:flex gap-6 text-gray-300 text-sm font-medium">
                        <Link to="/"><li className="hover:text-white cursor-pointer transition">Início</li></Link>
                        <Link to="/filmes"><li className="hover:text-white cursor-pointer transition">Filmes</li></Link>
                        <Link to="/series"><li className="hover:text-white cursor-pointer transition">Séries</li></Link>
                        {user && (
                            <Link to="/admin"><li className="hover:text-white cursor-pointer transition flex items-center gap-1"><Settings className="w-3 h-3" /> Admin</li></Link>
                        )}
                    </ul>
                </div>

                <div className="flex items-center gap-4 text-white">
                    {onSearch ? (
                        <div className="relative hidden md:block">
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={searchQuery || ''}
                                onChange={(e) => onSearch(e.target.value)}
                                className="bg-black/50 border border-gray-600 text-white rounded-full px-4 py-1 pb-1.5 focus:outline-none focus:border-red-600 transition w-48 lg:w-64"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                    ) : (
                        <Search className="w-5 h-5 cursor-pointer hover:text-gray-300" />
                    )}

                    <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300" />

                    {user ? (
                        <div className="hidden md:flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center cursor-pointer" title={user.name}>
                                <User className="w-5 h-5" />
                            </div>
                            <button onClick={handleLogout} className="text-sm font-bold hover:text-red-500 flex items-center gap-1">
                                <LogOut className="w-4 h-4" /> Sair
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:block">
                            <Link to="/login">
                                <button className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm font-bold transition">Entrar</button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-white" onClick={toggleMenu}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-black/95 text-center py-4 flex flex-col gap-4 border-t border-gray-800 animate-fadeIn">
                    <Link to="/" onClick={toggleMenu} className="hover:text-red-500">Início</Link>
                    <Link to="/filmes" onClick={toggleMenu} className="hover:text-red-500">Filmes</Link>
                    <Link to="/series" onClick={toggleMenu} className="hover:text-red-500">Séries</Link>
                    {user && <Link to="/admin" onClick={toggleMenu} className="hover:text-red-500">Admin</Link>}

                    <div className="pt-2 border-t border-gray-800 w-full flex justify-center">
                        {user ? (
                            <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2">
                                <LogOut size={18} /> Sair
                            </button>
                        ) : (
                            <Link to="/login" onClick={toggleMenu} className="text-white font-bold bg-red-600 px-6 py-2 rounded">
                                Entrar
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
