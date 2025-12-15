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
                // Return HTTPS directly if possible, else use proxy
                const isHttps = targetUrl.startsWith('https://');
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

                try {
                    // Try direct if HTTPS
                    if (isHttps) {
                        const maxTime = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
                        const res = await Promise.race([fetch(targetUrl), maxTime]);
                        if (res.ok) return res.json();
                    }
                } catch (e) {
                    console.log("Direct fetch failed, trying proxy...", e);
                }

                // Fallback to proxy (solves Mixed Content and CORS)
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error('Falha no Proxy');
                return res.json();
            };

            const data = await fetchWithProxy(url);
            const items = Array.isArray(data) ? data : (data.results || []); // Handle array or { results: [] }

            if (items.length === 0) throw new Error('Nuvem vazia');

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
                url,
                count: newMovies.length,
                date: new Date().toLocaleDateString()
            };

            setClouds(prev => [...prev, newCloud]);
            return newMovies.length;

        } catch (error) {
            console.error("Erro na nuvem:", error);
            throw error;
        }
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
        <MovieContext.Provider value={{ movies, clouds, addMovie, updateMovie, addMovies, importCloud, removeCloud }}>
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
