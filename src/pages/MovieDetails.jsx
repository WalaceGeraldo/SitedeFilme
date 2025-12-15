import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Info, ArrowLeft, X, Loader2 } from 'lucide-react';
import { useMovies } from '../context/MovieContext';
import TorrentPlayer from '../components/TorrentPlayer';
import { api } from '../services/api';

const MovieDetails = () => {
    const { id, type } = useParams(); // type is optional (movie/series)
    const { movies } = useMovies();
    const [isPlaying, setIsPlaying] = useState(false);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMovie = async () => {
            setLoading(true);

            // 1. Try Local Content first
            const localMovie = movies.find((m) => m.id === parseInt(id));
            if (localMovie) {
                setMovie(localMovie);
                setLoading(false);
                return;
            }

            // 2. Fallback to API
            // Default to 'movie' if type is missing (backwards compatibility)
            const mediaType = type || 'movie';

            try {
                const data = await api.getDetails(mediaType, id);
                if (data) {
                    // Fetch trailer (videos)
                    const videosUrl = `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=70f37390ba1316b495743e24196beb71&language=pt-BR`;
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
                        isExternal: true // Flag to indicate it's from API
                    };
                    setMovie(formattedMovie);
                }
            } catch (error) {
                console.error("Error loading movie:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMovie();
    }, [id, type, movies]);

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

    const handleWatch = () => {
        if (movie.videoUrl) {
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
            <div className="relative z-10 p-4 md:p-10 pt-20 md:pt-32 flex flex-col justify-end h-full min-h-[70vh]">
                <Link to="/" className="absolute top-6 left-4 md:left-10 flex items-center gap-2 text-gray-300 hover:text-white transition group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" /> Voltar
                </Link>

                <div className="max-w-2xl space-y-6 mt-10 md:mt-0">
                    <h1 className="text-5xl md:text-7xl font-bold drop-shadow-xl">{movie.title}</h1>
                    <div className="flex items-center gap-4 text-gray-300 text-sm md:text-base">
                        <span className="text-green-400 font-bold">98% relevante</span>
                        <span>{movie.year}</span>
                        <span className="border border-gray-500 px-1 rounded text-xs text-gray-400">12+</span>
                        <span>2h 15m</span>
                        <span className="border border-gray-500 px-1 rounded text-xs text-gray-400">HD</span>
                    </div>
                    <p className="text-lg text-gray-200 drop-shadow-md leading-relaxed">
                        {movie.description}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <button
                            onClick={handleWatch}
                            className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-opacity-80 transition text-lg"
                        >
                            <Play className="fill-black w-6 h-6" /> {movie.isExternal ? 'Ver Trailer' : 'Assistir'}
                        </button>
                        <button className="flex items-center gap-2 bg-gray-600/60 text-white px-8 py-3 rounded font-bold hover:bg-opacity-50 transition backdrop-blur-sm text-lg">
                            <Info className="w-6 h-6" /> Mais Informações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetails;
