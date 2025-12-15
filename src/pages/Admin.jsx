import React, { useState } from 'react';
import { useMovies } from '../context/MovieContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Search, DownloadCloud, Loader2 } from 'lucide-react';

const TMDB_API_KEY = "70f37390ba1316b495743e24196beb71";

const Admin = () => {
    const { movies, addMovie, updateMovie, addMovies } = useMovies();
    const navigate = useNavigate();

    const [editingId, setEditingId] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        cover: '',
        backdrop: '',
        description: '',
        year: new Date().getFullYear().toString(),
        videoUrl: '',
        type: 'movie',
        category: ''
    });

    // Reset form to default state
    const resetForm = () => {
        setFormData({
            title: '',
            cover: '',
            backdrop: '',
            description: '',
            year: new Date().getFullYear().toString(),
            videoUrl: '',
            type: 'movie',
            category: ''
        });
        setEditingId(null);
    };

    // Populate form for editing
    const handleEditClick = (movie) => {
        setFormData({
            title: movie.title,
            cover: movie.cover,
            backdrop: movie.backdrop || '',
            description: movie.description || '',
            year: movie.year || '',
            videoUrl: movie.videoUrl || '',
            type: movie.type || 'movie',
            category: movie.category || ''
        });
        setEditingId(movie.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const importPopularContent = async () => {
        if (!confirm("Isso importará cerca de 60 títulos populares do TMDB. Deseja continuar?")) return;

        setIsImporting(true);
        try {
            const pagesToFetch = [1, 2, 3]; // Fetch top 3 pages (60 items)
            let allItems = [];

            for (const page of pagesToFetch) {
                const response = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`);
                const data = await response.json();
                if (data.results) {
                    allItems = [...allItems, ...data.results];
                }
            }

            const formattedItems = allItems.map(item => {
                const type = item.media_type === 'tv' ? 'series' : 'movie';
                const title = item.title || item.name;
                const date = item.release_date || item.first_air_date || '';
                const year = date ? date.split('-')[0] : '';

                return {
                    title: title,
                    description: item.overview || 'Sem descrição.',
                    cover: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
                    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
                    year: year,
                    type: type,
                    category: 'Em Alta', // Default category for imports
                    videoUrl: '' // Empty by default
                };
            }).filter(item => item.cover && item.backdrop); // Only keep items with images

            const count = addMovies(formattedItems);
            alert(`${count} novos títulos importados com sucesso!`);

        } catch (error) {
            console.error("Erro na importação:", error);
            alert("Erro ao importar conteúdo.");
        } finally {
            setIsImporting(false);
        }
    };

    const searchTMDB = async () => {
        if (!formData.title) {
            alert("Digite um título para buscar.");
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(formData.title)}&language=pt-BR`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const bestMatch = data.results[0]; // Takes the first result

                const type = bestMatch.media_type === 'tv' ? 'series' : 'movie';
                const title = bestMatch.title || bestMatch.name;
                const date = bestMatch.release_date || bestMatch.first_air_date || '';
                const year = date ? date.split('-')[0] : '';

                setFormData(prev => ({
                    ...prev,
                    title: title,
                    description: bestMatch.overview,
                    cover: bestMatch.poster_path ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}` : prev.cover,
                    backdrop: bestMatch.backdrop_path ? `https://image.tmdb.org/t/p/original${bestMatch.backdrop_path}` : prev.backdrop,
                    year: year,
                    type: type
                }));
            } else {
                alert("Nenhum resultado encontrado.");
            }
        } catch (error) {
            console.error("Erro ao buscar no TMDB:", error);
            alert("Erro ao buscar. Verifique sua chave API.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.cover || !formData.backdrop) {
            alert("Por favor, preencha os campos obrigatórios.");
            return;
        }

        if (editingId) {
            updateMovie(editingId, formData);
            alert("Conteúdo atualizado com sucesso!");
        } else {
            addMovie(formData);
            alert("Conteúdo adicionado com sucesso!");
        }

        resetForm();
    };

    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="min-h-screen bg-[#141414] text-white p-6 md:p-12">
            <div className="flex justify-between items-center mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                    <ChevronLeft /> Voltar para Home
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 sticky top-4">
                        <h1 className="text-2xl font-bold mb-6 text-center text-red-600">
                            {editingId ? 'Editar Conteúdo' : 'Adicionar Novo Conteúdo'}
                        </h1>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Título *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                        placeholder="Digite o título..."
                                    />
                                    <button
                                        type="button"
                                        onClick={searchTMDB}
                                        disabled={isSearching}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded flex items-center justify-center transition disabled:opacity-50"
                                        title="Buscar dados automaticamente"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Tipo</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                    >
                                        <option value="movie">Filme</option>
                                        <option value="series">Série</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Categoria</label>
                                    <input
                                        type="text"
                                        name="category"
                                        list="categories"
                                        placeholder="Ex: Top 10"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                    />
                                    <datalist id="categories">
                                        <option value="Ação" />
                                        <option value="Aventura" />
                                        <option value="Comédia" />
                                        <option value="Terror" />
                                        <option value="Ficção Científica" />
                                        <option value="Romance" />
                                        <option value="Drama" />
                                        <option value="Animação" />
                                        <option value="Recomendados" />
                                        <option value="Em Alta" />
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">URL da Capa *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="cover"
                                        value={formData.cover}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                    />
                                    {formData.cover && <img src={formData.cover} alt="Preview" className="h-10 w-7 object-cover rounded border border-gray-600" />}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">URL do Fundo *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="backdrop"
                                        value={formData.backdrop}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                    />
                                    {formData.backdrop && <img src={formData.backdrop} alt="Preview" className="h-10 w-16 object-cover rounded border border-gray-600" />}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">URL do Vídeo</label>
                                <input
                                    type="text"
                                    name="videoUrl"
                                    value={formData.videoUrl}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Ano</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Sinopse</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full bg-gray-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
                                ></textarea>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className={`flex-1 font-bold py-3 rounded transition duration-200 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    {editingId ? 'Atualizar' : 'Salvar'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition duration-200"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-200">Conteúdo Cadastrado ({movies.length})</h2>
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-800 text-white rounded p-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {movies.filter(movie => movie.title.toLowerCase().includes(searchTerm.toLowerCase())).map(movie => (
                                <div key={movie.id} className="relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition">
                                    <div className="aspect-[2/3] w-full relative">
                                        <img src={movie.cover} alt={movie.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shadow-sm ${movie.type === 'series' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                                                {movie.type === 'series' ? 'Série' : 'Filme'}
                                            </span>
                                            {movie.category && (
                                                <span className="text-[10px] bg-gray-800/80 backdrop-blur-sm text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                                                    {movie.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(movie)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transform hover:scale-110 transition"
                                                title="Editar"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                                        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                            <span>{movie.year}</span>
                                        </div>
                                    </div>
                                    {editingId === movie.id && (
                                        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-lg"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
