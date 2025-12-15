import React, { useState, useEffect } from 'react';
import { useMovies } from '../context/MovieContext';
import MovieRow from '../components/MovieRow';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { api } from '../services/api';
import { Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper to format TMDB data
const formatTMDB = (results, type) => {
    return results.map(item => ({
        id: item.id,
        title: item.title || item.name,
        cover: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
        description: item.overview,
        type: item.media_type || type // Use media_type if available (search results), else default
    })).filter(item => item.cover);
};

const ContentPage = ({ type }) => {
    const { movies } = useMovies();
    const [apiContent, setApiContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [categoryPages, setCategoryPages] = useState({}); // Track page number per category

    // Filter & Search State
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Infinite Scroll Observer
    const observer = React.useRef();

    // Load More Handler (Memoized for use in ref)
    const handleLoadMore = React.useCallback(async () => {
        if (!activeCategory || activeCategory === "Todos" || !categoryPages[activeCategory] || loadingMore) return;

        setLoadingMore(true);
        const { id, page } = categoryPages[activeCategory];
        const nextPage = page + 1;

        try {
            let newData = null;
            if (type === 'movie') {
                newData = await api.getMoviesByGenre(id, nextPage);
            } else {
                newData = await api.getSeriesByGenre(id, nextPage);
            }

            if (newData && newData.results) {
                const newItems = formatTMDB(newData.results, type === 'movie' ? 'movie' : 'series');

                // Update Content
                setApiContent(prev => ({
                    ...prev,
                    [activeCategory]: [...prev[activeCategory], ...newItems]
                }));

                // Update Page Count
                setCategoryPages(prev => ({
                    ...prev,
                    [activeCategory]: { ...prev[activeCategory], page: nextPage }
                }));
            }
        } catch (error) {
            console.error("Error loading more:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [activeCategory, categoryPages, loadingMore, type]);

    const lastMovieElementRef = React.useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                handleLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, handleLoadMore]);


    // Initial Load (Page 1 only)
    useEffect(() => {
        const loadGenreContent = async () => {
            setLoading(true);
            const content = {};
            const initialPages = {};

            try {
                if (type === 'movie') {
                    const genres = [
                        { id: 28, name: 'Ação' },
                        { id: 12, name: 'Aventura' },
                        { id: 35, name: 'Comédia' },
                        { id: 27, name: 'Terror' },
                        { id: 10749, name: 'Romance' },
                        { id: 878, name: 'Ficção Científica' },
                        { id: 18, name: 'Drama' },
                        { id: 14, name: 'Fantasia' },
                        { id: 16, name: 'Animação' }
                    ];

                    for (const genre of genres) {
                        const data = await api.getMoviesByGenre(genre.id, 1);
                        if (data && data.results) {
                            content[genre.name] = formatTMDB(data.results, 'movie');
                            initialPages[genre.name] = { id: genre.id, page: 1 };
                        }
                    }
                } else if (type === 'series') {
                    const genres = [
                        { id: 10759, name: 'Ação e Aventura' },
                        { id: 35, name: 'Comédia' },
                        { id: 18, name: 'Drama' },
                        { id: 10765, name: 'Sci-Fi & Fantasy' },
                        { id: 16, name: 'Animação' },
                        { id: 80, name: 'Crime' },
                        { id: 9648, name: 'Mistério' }
                    ];

                    for (const genre of genres) {
                        const data = await api.getSeriesByGenre(genre.id, 1);
                        if (data && data.results) {
                            content[genre.name] = formatTMDB(data.results, 'series');
                            initialPages[genre.name] = { id: genre.id, page: 1 };
                        }
                    }
                }
                setApiContent(content);
                setCategoryPages(initialPages);
            } catch (error) {
                console.error("Error fetching content:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGenreContent();
    }, [type]);

    // Handle Search
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // 1. Local Search
                const localResults = movies.filter(item =>
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    (type === 'movie' ? (item.type === 'movie' || !item.type) : item.type === 'series')
                );

                // 2. API Search
                const apiData = await api.search(searchQuery);
                const apiResults = apiData?.results ? formatTMDB(apiData.results, type) : [];

                // Filter API results to match current page type (movie/series) if explicit
                // Note: multi-search returns mixed, so we filter by media_type if possible
                const filteredApiResults = apiResults.filter(item =>
                    type === 'movie' ? item.type === 'movie' : item.type === 'tv' || item.type === 'series'
                );

                setSearchResults([...localResults, ...filteredApiResults]);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, movies, type]);


    // Local Content (filtered by type)
    const localContent = movies.filter(item =>
        type === 'movie' ? (item.type === 'movie' || !item.type) : item.type === 'series'
    );

    // Merge logic
    const mergedContent = { ...apiContent };

    localContent.forEach(item => {
        if (item.category && mergedContent[item.category]) {
            mergedContent[item.category] = [item, ...mergedContent[item.category]];
        }
    });

    // Helper to get all items for Hero (flattened)
    const allItems = [...localContent, ...Object.values(apiContent).flat()];

    // Get Categories for Filters
    const categories = ["Todos", ...Object.keys(mergedContent)];

    return (
        <div className="bg-[#141414] min-h-screen pb-10 overflow-hidden">
            <Navbar onSearch={setSearchQuery} searchQuery={searchQuery} />

            {/* Hero Section (Hidden if searching) */}
            {!searchQuery && <Hero items={allItems.slice(0, 10)} />}

            {loading && allItems.length === 0 && (
                <div className="h-[20vh] w-full bg-black flex items-center justify-center">
                    <Loader2 className="animate-spin text-red-600" />
                </div>
            )}

            <div className={`relative z-40 space-y-4 px-4 md:px-10 ${searchQuery ? 'mt-32 md:mt-24' : '-mt-10'}`}>

                {/* Filter Bar (Horizontal Scroll) - Search removed */}
                <div className="mb-6">
                    <div className="overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex gap-2">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeCategory === category
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-black/40 text-gray-300 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Rendering */}

                {/* 1. Search Results */}
                {searchQuery ? (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Resultados para "{searchQuery}"</h2>
                        {isSearching ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-600" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {searchResults.map(item => (
                                    <Link to={`/watch/${item.type || (type === 'series' ? 'series' : 'movie')}/${item.id}`} key={item.id}>
                                        <div className="relative group bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105 duration-300 h-full">
                                            <div className="aspect-[2/3]">
                                                <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-lg">Nenhum resultado encontrado.</p>
                        )}
                    </div>
                ) : (
                    /* 2. Standard Category View */
                    <div className="space-y-8">
                        {activeCategory === "Todos" ? (
                            // Show ALL categories
                            Object.keys(mergedContent).map(category => (
                                mergedContent[category].length > 0 &&
                                <MovieRow key={category} title={category} movies={mergedContent[category]} />
                            ))
                        ) : (
                            // Show SINGLE category (Grid View for better filter experience)
                            mergedContent[activeCategory] && (
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold text-white border-l-4 border-red-600 pl-4">{activeCategory}</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {mergedContent[activeCategory].map((item, index) => {
                                            const isLastElement = mergedContent[activeCategory].length === index + 1;
                                            return (
                                                <div
                                                    ref={isLastElement ? lastMovieElementRef : null}
                                                    key={`${item.id}-${index}`}
                                                    className="h-full"
                                                >
                                                    <Link to={`/watch/${item.type || (type === 'series' ? 'series' : 'movie')}/${item.id}`}>
                                                        <div className="relative group bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105 duration-300 h-full">
                                                            <div className="aspect-[2/3]">
                                                                <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Loading Spinner for Infinite Scroll */}
                                    {loadingMore && (
                                        <div className="flex justify-center mt-8 py-4">
                                            <Loader2 className="animate-spin text-red-600 w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}


                {!loading && allItems.length === 0 && !searchQuery && (
                    <p className="text-white text-center mt-20 text-xl opacity-50">Nenhum conteúdo encontrado.</p>
                )}
            </div>
        </div>
    );
};

export default ContentPage;
