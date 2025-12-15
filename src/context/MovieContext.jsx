import React, { createContext, useState, useContext } from 'react';
import { MOVIE_DATA as INITIAL_DATA } from '../data/movies';

const MovieContext = createContext();

export const MovieProvider = ({ children }) => {
    const [movies, setMovies] = useState(INITIAL_DATA);

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
        <MovieContext.Provider value={{ movies, addMovie, updateMovie, addMovies }}>
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
