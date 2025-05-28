import { useState, useEffect } from function bubbleSort(arr: number[]): number[] {
  let n = arr.length;
  let swapped: boolean;
  do {
    swapped = false;
    for (let i = 0; i < n - 1; i++) {
      if (arr[i] > arr[i + 1]) {
        // Swap the elements
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
    }
    n--; // Reduce the range of comparison
  } while (swapped);
  return arr;
}

// Example usage:
const array = [64, 34, 25, 12, 22, 11, 90];
console.log("Sorted array:", bubbleSort(array));
;

interface VideoDetails {
  title: string;
  description: string;
  publishDate: string;
  channelName: string;
  channelId: string;
  channelUrl: string;
  viewCount: string;
  likeCount: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    standard?: string;
    maxres?: string;
  };
  duration: string;
  tags: string[];
  parsedHashtags: string[];
}

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [copied, setCopied] = useState('');

  // Clear copied status after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied('');
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const extractVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Extract hashtags from description
  const extractHashtags = (description: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = description.match(hashtagRegex);
    return matches ? matches : [];
  };

  const fetchVideoDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVideoDetails(null);

    const videoId = extractVideoId(url);

    if (!videoId) {
      setError('Invalid YouTube URL. Please provide a valid YouTube video link.।');
      setLoading(false);
      return;
    }

    try {
      // Fetch the video meta data from public endpoints
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();

      if (!data || data.error) {
        throw new Error('An error occurred while retrieving the details.');
      }

      // Now try to get the description and tags using a CORS proxy
      let description = 'Details are not available.।';
      let tags: string[] = [];

      try {
        // Use a different method - fetch from a CORS proxy
        const corsProxyUrl = `https://corsproxy.io/?https://www.youtube.com/watch?v=${videoId}`;
        const videoPageResponse = await fetch(corsProxyUrl);
        const videoPageHtml = await videoPageResponse.text();

        // Extract description using regex
        const descriptionMatch = videoPageHtml.match(/"description":{"simpleText":"([^"]*)"/);
        if (descriptionMatch?.[1]) {
          description = descriptionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }

        // Extract keywords/tags
        const keywordsMatch = videoPageHtml.match(/"keywords":\[(.*?)\]/);
        if (keywordsMatch?.[1]) {
          // Parse the JSON array of keywords
          const keywordsStr = `[${keywordsMatch[1]}]`;
          try {
            const keywordsArr = JSON.parse(keywordsStr);
            tags = keywordsArr.filter((tag: string) => typeof tag === 'string');
          } catch (e) {
            // If JSON parsing fails, try a simpler split method
            tags = keywordsMatch[1].split(',')
              .map((tag) => tag.trim().replace(/"/g, ''))
              .filter((tag) => tag.length > 0);
          }
        }
      } catch (err) {
        console.error('Error fetching video page content:', err);
        // Continue with basic info if description fetch fails
      }

      // Extract hashtags from the description
      const hashtags = extractHashtags(description);

      // Create the video details object
      const thumbnailBase = `https://i.ytimg.com/vi/${videoId}`;

      const videoDetailsObj: VideoDetails = {
        title: data.title || `YouTube Video (${videoId})`,
        description: description,
        publishDate: new Date().toLocaleDateString(),
        channelName: data.author_name || 'Unknown channel.',
        channelId: 'unknown',
        channelUrl: data.author_url || `https://www.youtube.com/watch?v=${videoId}`,
        viewCount: 'N/A',
        likeCount: 'N/A',
        thumbnails: {
          default: `${thumbnailBase}/default.jpg`,
          medium: `${thumbnailBase}/mqdefault.jpg`,
          high: `${thumbnailBase}/hqdefault.jpg`,
          standard: `${thumbnailBase}/sddefault.jpg`,
          maxres: `${thumbnailBase}/maxresdefault.jpg`,
        },
        duration: 'N/A',
        tags: tags,
        parsedHashtags: hashtags,
      };

      setVideoDetails(videoDetailsObj);

      // Try another method for description
      if (description === 'Details are not available.') {
        try {
          const invidioResponse = await fetch(`https://invidious.snopyta.org/api/v1/videos/${videoId}`);
          const invidioData = await invidioResponse.json();

          if (invidioData?.description) {
            videoDetailsObj.description = invidioData.description;
            setVideoDetails({ ...videoDetailsObj });
          }
        } catch (err) {
          console.error('Error fetching from Invidious API:', err);
        }
      }

    } catch (err) {
      console.error('Error fetching video details:', err);
      setError('An error occurred while retrieving the video details. Please try again after some time.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <svg className="w-10 h-10 mr-3 text-youtube" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YT Thumbnail Downloader 4K
          </h1>
          <p className="text-lg text-gray-600">YouTube Enter the video link and download the thumbnail in 4K quality.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={fetchVideoDetails} className="space-y-4">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video link (Download thumbnail)
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="youtube-url"
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm py-3 px-4 border focus:ring-red-500 focus:border-red-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-r-md shadow-sm text-white bg-youtube hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                       Thumbnail is loading...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="mr-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M12 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                       Download thumbnail
                    </span>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {videoDetails && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/5">
                  <div className="rounded-lg overflow-hidden shadow-md relative">
                    <img
                      src={videoDetails.thumbnails.high || videoDetails.thumbnails.medium}
                      alt={videoDetails.title}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-70 rounded-full p-3">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 012.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <a
                      href={`https://www.youtube.com/watch?v=${extractVideoId(url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-youtube hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube Open the video.
                    </a>
                  </div>
                </div>

                <div className="md:w-3/5">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 group">
                    {videoDetails.title}
                    <button
                      onClick={() => copyToClipboard(videoDetails.title, 'title')}
                      className="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy title"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {copied === 'title' && <span className="ml-2 text-xs text-green-600">Copied!</span>}
                  </h2>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span className="mr-4 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {videoDetails.publishDate}
                    </span>
                    {videoDetails.duration !== 'N/A' && (
                      <span className="mr-4 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {videoDetails.duration}
                      </span>
                    )}
                    {videoDetails.viewCount !== 'N/A' && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {videoDetails.viewCount}Views
                      </span>
                    )}
                  </div>

                  <div className="mb-4 bg-gray-50 p-3 rounded-md flex items-center">
                    <a
                      href={videoDetails.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                      <div className="bg-red-100 text-youtube rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        {videoDetails.channelName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{videoDetails.channelName}</p>
                        <p className="text-xs text-gray-500">View channel</p>
                      </div>
                    </a>
                  </div>

                  {videoDetails.likeCount !== 'N/A' && (
                    <div className="mb-4 flex items-center">
                      <div className="bg-gray-50 px-4 py-2 rounded-md flex items-center">
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <p className="text-gray-700 font-medium">{videoDetails.likeCount} Like</p>
                      </div>
                    </div>
                  )}

                  {videoDetails.parsedHashtags && videoDetails.parsedHashtags.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Hashtag:</h3>
                      <div className="flex flex-wrap gap-2">
                        {videoDetails.parsedHashtags.map((tag) => (
                          <span
                            key={`hashtag-${tag}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {videoDetails.tags && videoDetails.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tag</h3>
                        <button
                          onClick={() => copyToClipboard(videoDetails.tags.join(', '), 'tags')}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                           Copy all tags
                        </button>
                      </div>
                      {copied === 'tags' && <div className="text-xs text-green-600 mb-2">All tags have been copied!</div>}
                      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
                        {videoDetails.tags.map((tag) => (
                          <span
                            key={`tag-${tag}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Description:</h3>
                  <button
                    onClick={() => copyToClipboard(videoDetails.description, 'description')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy full description
                  </button>
                </div>
                {copied === 'description' && <div className="text-xs text-green-600 mb-2">Description copied!</div>}
                <div className="bg-gray-50 p-4 rounded-md max-h-80 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-line">{videoDetails.description}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Download thumbnails in various qualities (up to 4K):</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(videoDetails.thumbnails)
                    .filter(([_, url]) => url) // Filter out null/undefined thumbnail URLs
                    .map(([key, url]) => (
                    <div key={key} className="bg-gray-50 rounded-md p-3 hover:shadow-md transition-shadow">
                      <p className="text-xs text-gray-500 mb-1 capitalize">
                        {key === 'maxres' ? '4K Quality' :
                         key === 'standard' ? 'HD Quality' :
                         key === 'high' ? 'High Quality' :
                         key === 'medium' ? 'Medium Quality' : 'Basic Quality'}
                      </p>
                      <div className="relative group">
                        <img src={url} alt={`${key} thumbnail`} className="w-full h-auto rounded" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-transform"
                          >
                            View Full Size
                          </a>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <a
                          href={url}
                          download={`youtube-thumbnail-${key}-${extractVideoId(url)}.jpg`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Thumbnail
                        </a>
                        <button
                          onClick={() => copyToClipboard(url, `thumbnail-${key}`)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          URL Copy
                        </button>
                      </div>
                      {copied === `thumbnail-${key}` && <div className="text-xs text-green-600 mt-1">URL copied!</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>This tool is for downloading thumbnails from YouTube videos.</p>
        <p className="mt-1">Note: A 4K quality thumbnail will only be available if it exists in the video.</p>
      </footer>
    </div>
  );
}

export default App;
