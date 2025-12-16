
const BASE_URL = 'https://torrentio.strem.fun';

export const stremioService = {
    getStreams: async (type, id, addons = []) => {
        if (!addons || addons.length === 0) return [];

        try {
            // type: 'movie' or 'series'
            // id: IMDB ID (tt1234567)
            const endpoint = `/${type}/${id}.json`;
            const promises = addons.map(async (addon) => {
                try {
                    // Fail-safe: Ensure URL doesn't have manifest.json end
                    let baseUrl = addon.url;

                    // Skip Cinemeta (Metadata only, no streams)
                    if (baseUrl.includes('cinemeta')) return [];

                    if (baseUrl.endsWith('/manifest.json')) {
                        baseUrl = baseUrl.replace('/manifest.json', '');
                    }
                    // Ensure no trailing slash
                    baseUrl = baseUrl.replace(/\/+$/, '');

                    const response = await fetch(`${baseUrl}/stream${endpoint}`);
                    if (!response.ok) return [];
                    const data = await response.json();
                    return (data.streams || []).map(stream => ({
                        ...stream,
                        _addonName: addon.name // Tag stream with source
                    }));
                } catch (e) {
                    console.error(`Error fetching from ${addon.name}:`, e);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            return results.flat();
        } catch (error) {
            console.error('Stremio Service Error:', error);
            return [];
        }
    },

    formatStream: (stream) => {
        return {
            title: stream.title || 'Unknown',
            name: stream.name || stream._addonName || 'Stremio Addon',
            infoHash: stream.infoHash,
            fileIdx: stream.fileIdx,
            url: stream.url || (stream.infoHash ? `magnet:?xt=urn:btih:${stream.infoHash}` : null)
        };
    }
};
