import React, { createContext, useState, useContext } from 'react';
import { MOVIE_DATA as INITIAL_DATA } from '../data/movies';

// Helper to validate and normalize cloud data
const normalizeMovieData = (item) => ({
    id: Date.now() + Math.random(), // Temporary ID generation
    title: item.title || item.name || 'Sem Título',
    cover: item.cover || item.poster || '',
    backdrop: item.backdrop || item.cover || '',
    description: item.description || item.overview || 'Sem descrição.',
    year: item.year || new Date().getFullYear().toString(),
    videoUrl: item.videoUrl || item.magnet || '',
    type: item.type || 'movie',
    category: item.category || 'Nuvem'
});

const MovieContext = createContext();

export const MovieProvider = ({ children }) => {
    // Initialize from localStorage or fallback to default data
    const [movies, setMovies] = useState(() => {
        const savedMovies = localStorage.getItem('my_cine_movies');
        return savedMovies ? JSON.parse(savedMovies) : INITIAL_DATA;
    });

    // Clouds State
    const [clouds, setClouds] = useState(() => {
        const savedClouds = localStorage.getItem('my_cine_clouds');
        return savedClouds ? JSON.parse(savedClouds) : [];
    });

    // Save to localStorage whenever movies change
    React.useEffect(() => {
        localStorage.setItem('my_cine_movies', JSON.stringify(movies));
    }, [movies]);

    // Save Clouds to localStorage
    React.useEffect(() => {
        localStorage.setItem('my_cine_clouds', JSON.stringify(clouds));
    }, [clouds]);

    const importCloud = async (url, name) => {
        try {
            // Helper to fetch with retries/proxy
            const fetchWithProxy = async (targetUrl) => {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

                try {
                    // 1. Try Direct Fetch (if HTTPS)
                    if (targetUrl.startsWith('https://')) {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        try {
                            const res = await fetch(targetUrl, { signal: controller.signal });
                            clearTimeout(timeoutId);
                            if (res.ok) {
                                const text = await res.text();
                                try { return JSON.parse(text); } catch (e) { /* Not JSON */ }
                            }
                        } catch (e) { /* Ignore direct fetch errors */ }
                    }

                    // 2. Try Proxy (allorigins/get returns JSON with 'contents')
                    // Using /get instead of /raw to handle status codes better
                    const res = await fetch(proxyUrl);
                    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

                    const proxyData = await res.json();

                    if (!proxyData.contents) throw new Error('Proxy não retornou conteúdo');

                    // Try to parse the contents as JSON
                    try {
                        return JSON.parse(proxyData.contents);
                    } catch (parseError) {
                        console.error("Conteúdo recebido não é JSON:", proxyData.contents.substring(0, 100));
                        throw new Error('O link não contém um JSON válido (Filmes). Verifique o link.');
                    }

                } catch (e) {
                    console.error("Erro no Proxy:", e);
                    throw e;
                }
            };

            const data = await fetchWithProxy(url);
            return processCloudData(data, name, url);
        } catch (error) {
            console.error("Erro na nuvem:", error);
            throw error;
        }
    };

    const importCloudData = (data, name) => {
        try {
            return processCloudData(data, name, 'Arquivo Local');
        } catch (error) {
            console.error("Erro no arquivo:", error);
            throw error;
        }
    };

    const processCloudData = (data, name, source) => {
        // Normalize data (support array or object with results)
        const items = Array.isArray(data) ? data : (data.results || []);

        if (!items || items.length === 0) throw new Error('Nuvem vazia ou formato incorreto');

        const newMovies = items.map(normalizeMovieData);

        // Add movies
        setMovies(prev => {
            const existingTitles = new Set(prev.map(m => m.title.toLowerCase()));
            const uniqueNew = newMovies.filter(m => !existingTitles.has(m.title.toLowerCase()));
            return [...prev, ...uniqueNew];
        });

        // Add Cloud to list
        const newCloud = {
            id: Date.now(),
            name: name || `Nuvem ${clouds.length + 1}`,
            url: source,
            count: newMovies.length,
            date: new Date().toLocaleDateString()
        };

        setClouds(prev => [...prev, newCloud]);
        return newMovies.length;
    };

    const removeCloud = (id) => {
        setClouds(prev => prev.filter(c => c.id !== id));
        // Optional: We could remove the movies associated with this cloud, but for now we keep them.
        // Implementing removal would require tracking source_id on movies.
    };

    const addMovie = (newMovie) => {
        console.log("Adding movie:", newMovie);
        // Generate a new ID based on the last ID
        const maxId = movies.reduce((max, movie) => (movie.id > max ? movie.id : max), 0);
        const movieWithId = { ...newMovie, id: maxId + 1 };
        setMovies([...movies, movieWithId]);
    };

    const updateMovie = (id, updatedData) => {
        setMovies(movies.map(movie => (movie.id === id ? { ...updatedData, id } : movie)));
    };

    const addMovies = (newMoviesList) => {
        const currentMaxId = movies.reduce((max, movie) => (movie.id > max ? movie.id : max), 0);
        let nextId = currentMaxId + 1;

        const moviesWithIds = newMoviesList.map(movie => ({
            ...movie,
            id: nextId++
        }));

        // Filter out duplicates based on title to be safe
        const existingTitles = new Set(movies.map(m => m.title.toLowerCase()));
        const uniqueNewMovies = moviesWithIds.filter(m => !existingTitles.has(m.title.toLowerCase()));

        if (uniqueNewMovies.length > 0) {
            setMovies([...movies, ...uniqueNewMovies]);
            return uniqueNewMovies.length; // Return count of added movies
        }
        return 0;
    };

    return (
        <MovieContext.Provider value={{ movies, clouds, addMovie, updateMovie, addMovies, importCloud, importCloudData, removeCloud }}>
            {children}
        </MovieContext.Provider>
    );
};

export const useMovies = () => {
    const context = useContext(MovieContext);
    if (!context) {
        throw new Error('useMovies must be used within a MovieProvider');
    }
    return context;
};
