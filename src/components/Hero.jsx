import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';

const Hero = ({ items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate every 10 seconds
    useEffect(() => {
        if (!items || items.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 10000);

        return () => clearInterval(interval);
    }, [items]);

    if (!items || items.length === 0) {
        return <div className="h-[80vh] w-full bg-black"></div>; // Loading placeholder
    }

    const item = items[currentIndex];

    return (
        <div className="relative h-[80vh] w-full text-white overflow-hidden bg-black">
            {/* Background Image */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute inset-0 bg-black/40 z-10" /> {/* Dark overlay for text readability */}
                <img
                    key={item.id} // Re-render for animation
                    src={item.backdrop || item.cover}
                    alt={item.title}
                    className="w-full h-full object-cover animate-zoomIn"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30 z-10"></div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 w-full p-4 md:p-10 pb-20 space-y-4 z-20">
                <h1 key={`title-${item.id}`} className="text-4xl md:text-6xl font-bold drop-shadow-lg animate-[slideUp_1s_ease-out]">
                    {item.title}
                </h1>

                <p key={`desc-${item.id}`} className="max-w-xl text-gray-200 text-sm md:text-lg drop-shadow-md line-clamp-3 animate-[slideUp_1.2s_ease-out]">
                    {item.description}
                </p>

                <div className="flex gap-4 mt-4 animate-[fadeIn_2s_ease-in-out]">
                    <Link to={`/watch/${item.type || 'movie'}/${item.id}`}>
                        <button className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded font-bold hover:bg-opacity-80 transition cursor-pointer">
                            <Play className="fill-black w-5 h-5" /> Assistir
                        </button>
                    </Link>
                    <Link to={`/watch/${item.type || 'movie'}/${item.id}`}>
                        <button className="flex items-center gap-2 bg-gray-500/70 text-white px-6 py-2 rounded font-bold hover:bg-opacity-50 transition backdrop-blur-sm cursor-pointer">
                            <Info className="w-5 h-5" /> Detalhes
                        </button>
                    </Link>
                </div>
            </div>

            {/* Indicators (Dots) */}
            <div className="absolute bottom-4 right-4 md:right-10 flex gap-2 z-30">
                {items.map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${index === currentIndex ? 'bg-white w-8' : 'bg-gray-500 hover:bg-gray-400'}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Hero;
