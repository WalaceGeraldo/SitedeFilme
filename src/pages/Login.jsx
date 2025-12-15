import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubscribe = () => {
        console.log("Subscribe clicked");
        alert('Funcionalidade de assinatura simulada! Em um app real, isso levaria ao checkout.');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const success = login(email, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Credenciais inválidas. Tente admin@sepflix.com / 123456');
        }
    };

    return (
        <div className="min-h-screen bg-black/90 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')] bg-cover bg-center flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60"></div>

            <Link to="/" className="fixed top-8 left-8 z-[100] flex items-center gap-2 text-white hover:text-gray-300 transition cursor-pointer no-underline group">
                <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition" />
                <span className="text-red-600 text-4xl font-bold tracking-tighter">SEPFLIX</span>
            </Link>

            <button
                onClick={handleSubscribe}
                className="fixed top-8 right-8 z-[100] bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition shadow-lg cursor-pointer"
            >
                Assine Agora
            </button>

            <div className="relative z-10 bg-black/75 p-12 rounded w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-8">Entrar</h1>

                {error && (
                    <div className="bg-orange-500 p-3 rounded text-white text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="email"
                            placeholder="Email ou número de telefone"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#333] text-white rounded p-4 focus:outline-none focus:bg-[#454545] border-none"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#333] text-white rounded p-4 focus:outline-none focus:bg-[#454545] border-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded transition duration-200"
                    >
                        Entrar
                    </button>
                </form>

                <div className="mt-8 text-gray-400 text-sm">
                    <p>Novo por aqui? <span onClick={handleSubscribe} className="text-white hover:underline cursor-pointer">Assine agora. (Simulação)</span></p>
                    <div className="text-xs mt-4">
                        Esta página é protegida pelo Google reCAPTCHA para garantir que você não é um robô.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
