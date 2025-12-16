const API_KEY = "70f37390ba1316b495743e24196beb71";
const BASE_URL = "https://api.themoviedb.org/3";

const fetchFromTMDB = async (endpoint) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}&language=pt-BR`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

export const api = {
    getTrending: async (type = 'all') => {
        return await fetchFromTMDB(`/trending/${type}/week`);
    },
    getMoviesByGenre: async (genreId, page = 1) => {
        return await fetchFromTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`);
    },
    getSeriesByGenre: async (genreId, page = 1) => {
        return await fetchFromTMDB(`/discover/tv?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`);
    },
    getTopRated: async () => {
        return await fetchFromTMDB(`/movie/top_rated`);
    },
    getDetails: async (type, id) => {
        return await fetchFromTMDB(`/${type}/${id}?append_to_response=external_ids`);
    },
    getCast: async (type, id) => {
        return await fetchFromTMDB(`/${type}/${id}/credits`);
    },
    search: async (query) => {
        return await fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
    },
    getSeasonDetails: async (id, seasonNumber) => {
        return await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    }
};
