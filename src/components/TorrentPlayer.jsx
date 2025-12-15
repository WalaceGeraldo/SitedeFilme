// WebRTC-only client initialized dynamically
let client;

const TorrentPlayer = ({ magnetUri }) => {
    const videoRef = useRef(null);
    const [status, setStatus] = useState('Initializing...');
    const [progress, setProgress] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const initTorrent = async () => {
            if (!magnetUri) return;

            try {
                // Dynamic import to avoid build issues
                if (!client) {
                    const WebTorrent = (await import('webtorrent')).default;
                    client = new WebTorrent();
                }

                if (!mounted) return;

                // Check if duplicate
                const existingTorrent = client.get(magnetUri);
                if (existingTorrent) {
                    streamTorrent(existingTorrent);
                    return;
                }

                setStatus('Connecting to peers...');

                client.add(magnetUri, (torrent) => {
                    if (mounted) {
                        setStatus('Torrent added. Finding video file...');
                        streamTorrent(torrent);
                    }
                });

            } catch (err) {
                console.error("Failed to load WebTorrent:", err);
                if (mounted) setError("Failed to initialize torrent client.");
            }
        };

        initTorrent();

        return () => {
            mounted = false;
            // Cleanup logic if needed (e.g. remove torrent to save memory)
            // if (client) client.remove(magnetUri);
        };
    }, [magnetUri]);

    const streamTorrent = (torrent) => {
        // Find the first video file
        const file = torrent.files.find(file =>
            file.name.endsWith('.mp4') ||
            file.name.endsWith('.webm') ||
            file.name.endsWith('.mkv')
        );

        if (!file) {
            setError('No video file found in this torrent.');
            setStatus('Error: No video file');
            return;
        }

        setStatus(`Found ${file.name}. Buffering...`);

        // Render file to video element
        file.renderTo(videoRef.current, {
            autoplay: true,
            controls: true
        }, (err) => {
            if (err) {
                console.error(err);
                setError('Error rendering video: ' + err.message);
            }
        });

        // Monitor progress
        const interval = setInterval(() => {
            setProgress((torrent.progress * 100).toFixed(1));
            setDownloadSpeed((torrent.downloadSpeed / 1024 / 1024).toFixed(2)); // MB/s

            // Update buffering status
            if (torrent.downloadSpeed > 0 && videoRef.current && videoRef.current.paused) {
                setStatus(`Downloading... ${(torrent.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    };

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black relative flex flex-col">
            <video ref={videoRef} className="w-full h-full flex-1" controls autoPlay></video>

            <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-2 rounded-br">
                <p>{status}</p>
                <p>Progress: {progress}% | Speed: {downloadSpeed} MB/s</p>
            </div>
        </div>
    );
};

export default TorrentPlayer;
