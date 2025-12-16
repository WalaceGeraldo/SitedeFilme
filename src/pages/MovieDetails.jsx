import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Info, ArrowLeft, X, Loader2, ChevronDown } from 'lucide-react';
import { useMovies } from '../context/MovieContext';
import TorrentPlayer from '../components/TorrentPlayer';
import { api } from '../services/api';

const MovieDetails = () => {
    const { id, type } = useParams(); // type is optional (movie/series)
    const { movies } = useMovies();
    const [isPlaying, setIsPlaying] = useState(false);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [episodes, setEpisodes] = useState([]);
    const [selectedEpisode, setSelectedEpisode] = useState(null);

    useEffect(() => {
        const loadMovie = async () => {
            setLoading(true);

            if (!id) return;

            // 1. Try Local Content first
            const localMovie = movies.find((m) => m.id === parseInt(id));
            if (localMovie) {
                setMovie(localMovie);
                setLoading(false);
                return;
            }

            // 2. Fallback to API
            // Default to 'movie' if type is missing (backwards compatibility)
            // Map 'series' route param to 'tv' API endpoint
            const apiType = (type === 'series' || type === 'tv') ? 'tv' : 'movie';

            try {
                const data = await api.getDetails(apiType, id);
                if (data) {
                    // Fetch trailer (videos)
                    const videosUrl = `https://api.themoviedb.org/3/${apiType}/${id}/videos?api_key=70f37390ba1316b495743e24196beb71&language=pt-BR`;
                    const videosRes = await fetch(videosUrl);
                    const videosData = await videosRes.json();
                    const trailer = videosData.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')
                        || videosData.results?.[0];

                    const formattedMovie = {
                        id: data.id,
                        title: data.title || data.name,
                        description: data.overview || 'Sem descrição.',
                        cover: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
                        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
                        year: (data.release_date || data.first_air_date || '').split('-')[0],
                        videoUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : '',
                        isExternal: true, // Flag to indicate it's from API
                        numberOfSeasons: data.number_of_seasons || 0
                    };
                    setMovie(formattedMovie);

                    // If it's a series, setup seasons
                    if (apiType === 'tv' || data.number_of_seasons > 0) {
                        const seasonList = Array.from({ length: data.number_of_seasons }, (_, i) => i + 1);
                        setSeasons(seasonList);
                        setSelectedSeason(1);
                    }
                }
            } catch (error) {
                console.error("Error loading movie:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMovie();
    }, [id, type, movies]);

    useEffect(() => {
        if (movie && (type === 'tv' || type === 'series' || movie.numberOfSeasons > 0)) {
            const loadEpisodes = async () => {
                const data = await api.getSeasonDetails(id, selectedSeason);
                if (data && data.episodes) {
                    setEpisodes(data.episodes);
                }
            };
            loadEpisodes();
        }
    }, [id, selectedSeason, movie, type]);

    if (loading) {
        return (
            <div className="h-screen bg-[#141414] flex items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-white bg-[#141414]">
                <h2 className="text-2xl font-bold mb-4">Título não encontrado</h2>
                <Link to="/" className="text-blue-500 hover:underline">Voltar para o início</Link>
            </div>
        );
    }

    const handleWatch = (episode = null) => {
        if (episode) {
            // For simplicity, we serve a placeholder or generic link if API doesn't provide stream
            // Ideally you'd have a provider for episodes.
            // Here we just update the selected episode to highlight it or play logic
            setSelectedEpisode(episode);
            setIsPlaying(true);
            // Note: TMDB doesn't provide episode stream URLs. We'd need another source or simply play the main trailer/video for demo.
        } else if (movie.videoUrl) {
            setIsPlaying(true);
        } else {
            alert("Trailer indisponível no momento.");
        }
    };

    const isTorrent = movie.videoUrl?.startsWith('magnet:') || movie.videoUrl?.endsWith('.torrent');

    return (
        <div className="relative min-h-screen w-full text-white bg-[#141414]">
            {/* Background Image */}
            <div className="absolute top-0 left-0 w-full h-[70vh] md:h-screen z-0">
                <img
                    src={movie.backdrop || movie.cover}
                    alt={movie.title}
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent"></div>
            </div>

            {/* Video Player Modal/Overlay */}
            {isPlaying && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-4 right-4 text-white hover:text-red-500 z-50 p-2"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="w-full h-full md:w-[90%] md:h-[90%] relative bg-black">
                        {isTorrent ? (
                            <TorrentPlayer magnetUri={movie.videoUrl} />
                        ) : (
                            <iframe
                                className="w-full h-full"
                                // If episode selected, could swap URL here if available
                                src={movie.videoUrl}
                                title={movie.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 p-4 md:p-10 pt-20 md:pt-32 flex flex-col h-full min-h-[70vh]">
                <Link to="/" className="absolute top-6 left-4 md:left-10 flex items-center gap-2 text-gray-300 hover:text-white transition group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" /> Voltar
                </Link>

                <div className="max-w-4xl mt-10 md:mt-24">
                    <div className="max-w-2xl space-y-6">
                        <h1 className="text-5xl md:text-7xl font-bold drop-shadow-xl">{movie.title}</h1>
                        <div className="flex items-center gap-4 text-gray-300 text-sm md:text-base">
                            <span className="text-green-400 font-bold">98% relevante</span>
                            <span>{movie.year}</span>
                            <span className="border border-gray-500 px-1 rounded text-xs text-gray-400">12+</span>
                            <span>{movie.numberOfSeasons ? `${movie.numberOfSeasons} Temporadas` : '2h 15m'}</span>
                            <span className="border border-gray-500 px-1 rounded text-xs text-gray-400">HD</span>
                        </div>
                        <p className="text-lg text-gray-200 drop-shadow-md leading-relaxed">
                            {movie.description}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={() => handleWatch()}
                                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-opacity-80 transition text-lg"
                            >
                                <Play className="fill-black w-6 h-6" /> {movie.isExternal ? 'Assistir' : 'Assistir'}
                            </button>
                            <button className="flex items-center gap-2 bg-gray-600/60 text-white px-8 py-3 rounded font-bold hover:bg-opacity-50 transition backdrop-blur-sm text-lg">
                                <Info className="w-6 h-6" /> Mais Informações
                            </button>
                        </div>
                    </div>

                    {/* Seasons & Episodes Section */}
                    {seasons.length > 0 && (
                        <div className="mt-16 space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-semibold">Episódios</h3>
                                <div className="relative">
                                    <select
                                        value={selectedSeason}
                                        onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                                        className="appearance-none bg-[#2f2f2f] border border-gray-600 text-white py-2 pl-4 pr-10 rounded focus:outline-none focus:border-white cursor-pointer font-semibold"
                                    >
                                        {seasons.map(season => (
                                            <option key={season} value={season}>Temporada {season}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {episodes.map((episode) => (
                                    <div
                                        key={episode.id}
                                        onClick={() => handleWatch(episode)}
                                        className="flex gap-4 p-4 rounded-md hover:bg-white/10 transition cursor-pointer group"
                                    >
                                        <div className="relative flex-none w-[150px] aspect-video rounded overflow-hidden bg-gray-800">
                                            {episode.still_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                                    alt={episode.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-gray-800"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-gray-500"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full bg-gray-800">
                                                    <Play className="w-8 h-8 text-gray-500" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                <Play className="w-8 h-8 text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center gap-2">
                                            <h4 className="text-lg font-bold group-hover:text-green-400 transition">
                                                {episode.episode_number}. {episode.name}
                                            </h4>
                                            <p className="text-gray-400 text-sm line-clamp-2">
                                                {episode.overview || "Sem descrição disponível."}
                                            </p>
                                            <span className="text-sm text-gray-500">{episode.runtime ? `${episode.runtime} min` : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetails;
