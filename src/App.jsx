import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { MovieProvider, useMovies } from './context/MovieContext';
import { AuthProvider } from './context/AuthContext';
import MovieDetails from './pages/MovieDetails';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ContentPage from './pages/ContentPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import MovieRow from './components/MovieRow';
import Hero from './components/Hero';
import { api } from './services/api';

// Helper to format TMDB data
const formatTMDB = (results, type = 'movie') => {
  return results.map(item => ({
    id: item.id,
    title: item.title || item.name,
    cover: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
    description: item.overview,
    type: item.media_type || type // Use returned media_type (trending) or fallback
  })).filter(item => item.cover);
};

// Página Inicial Especializada
const Home = () => {
  const { movies } = useMovies(); // Local movies
  const [trending, setTrending] = useState([]);
  const [action, setAction] = useState([]);
  const [comedy, setComedy] = useState([]);
  const [series, setSeries] = useState([]);
  const [topRated, setTopRated] = useState([]);

  useEffect(() => {
    const loadContent = async () => {
      // 1. Trending (Mix)
      const trendingData = await api.getTrending();
      if (trendingData) setTrending(formatTMDB(trendingData.results));

      // 2. Action Movies
      const actionData = await api.getMoviesByGenre(28); // 28 = Action
      if (actionData) setAction(formatTMDB(actionData.results, 'movie'));

      // 3. Comedy Movies
      const comedyData = await api.getMoviesByGenre(35); // 35 = Comedy
      if (comedyData) setComedy(formatTMDB(comedyData.results, 'movie'));

      // 4. Series (Action/Adventure for variety)
      const seriesData = await api.getSeriesByGenre(10759); // 10759 = Action & Adventure
      if (seriesData) setSeries(formatTMDB(seriesData.results, 'series'));

      // 5. Top Rated
      const topData = await api.getTopRated();
      if (topData) setTopRated(formatTMDB(topData.results, 'movie'));
    };
    loadContent();
  }, []);

  // Filter local movies
  const localRecommended = movies.filter(m => !m.category || m.category === 'Recomendados');

  return (
    <div className="bg-[#141414] min-h-screen pb-10 overflow-hidden">
      <Navbar />
      <Hero items={trending.slice(0, 10)} />
      <div className="-mt-20 relative z-10 space-y-4">
        {/* Local Content First (User's Favorites) */}
        {localRecommended.length > 0 && <MovieRow title="Minha Lista" movies={localRecommended} />}

        {/* API Content */}
        <MovieRow title="Em Alta" movies={trending} />
        <MovieRow title="Séries de Ação" movies={series} />
        <MovieRow title="Filmes de Ação" movies={action} />
        <MovieRow title="Comédias" movies={comedy} />
        <MovieRow title="Aclamados pela Crítica" movies={topRated} />
      </div>
    </div>
  );
};

// App Principal
export default function App() {
  return (
    <AuthProvider>
      <MovieProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/filmes" element={<ContentPage type="movie" />} />
            <Route path="/series" element={<ContentPage type="series" />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/watch/:type/:id" element={<MovieDetails />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </MovieProvider>
    </AuthProvider>
  );
}