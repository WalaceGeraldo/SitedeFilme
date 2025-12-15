import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';

const MovieRow = ({ title, movies }) => {
    const rowRef = useRef(null);

    if (!movies || movies.length === 0) return null;

    const handleLeftArrow = () => {
        if (rowRef.current) {
            let x = rowRef.current.scrollLeft - Math.round(window.innerWidth / 2);
            if (x < 0) x = 0;
            rowRef.current.scrollTo({ left: x, behavior: 'smooth' });
        }
    };

    const handleRightArrow = () => {
        if (rowRef.current) {
            let x = rowRef.current.scrollLeft + Math.round(window.innerWidth / 2);
            if (x > rowRef.current.scrollWidth) x = rowRef.current.scrollWidth;
            rowRef.current.scrollTo({ left: x, behavior: 'smooth' });
        }
    };

    return (
        <div className="px-4 md:px-10 my-8 group">
            <h2 className="text-white text-xl font-semibold mb-4 flex items-center cursor-pointer hover:text-blue-500 transition">
                {title} <ChevronRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition" />
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                <div
                    className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 w-[40px] flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition duration-300 hover:bg-black/70 rounded-r-md"
                    onClick={handleLeftArrow}
                >
                    <ChevronLeft className="text-white w-8 h-8" />
                </div>

                {/* Movie List */}
                <div
                    ref={rowRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                >
                    {movies.map((movie, index) => (
                        <Link key={`${movie.id}-${index}`} to={`/watch/${movie.type || 'movie'}/${movie.id}`}>
                            <div className="relative flex-none w-[160px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden cursor-pointer hover:scale-105 transition duration-300 group/item">
                                <img src={movie.cover} alt={movie.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition flex items-center justify-center">
                                    <Play className="w-12 h-12 text-white fill-white bg-red-600 rounded-full p-2 shadow-lg" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Right Arrow */}
                <div
                    className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 w-[40px] flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition duration-300 hover:bg-black/70 rounded-l-md"
                    onClick={handleRightArrow}
                >
                    <ChevronRight className="text-white w-8 h-8" />
                </div>
            </div>
        </div>
    );
};

export default MovieRow;
