import React, { useState } from "react";
import {
  Search,
  TrendingUp,
  Hash,
  Zap,
  BarChart3,
  Target,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Heart,
  MessageCircle,
  Users,
  Calendar,
  Eye
} from "lucide-react";

function TrendAnalyzer() {
  const [prompt, setPrompt] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [trends, setTrends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'hashtag-posts'
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Mock Instagram posts data - in a real app, this would come from Instagram API
  const generateMockPosts = (hashtag) => {
    const mockPosts = [
      {
        id: '1',
        username: 'travel_enthusiast',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c77c?w=50&h=50&fit=crop&crop=face',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
        caption: `Amazing sunset views! ${hashtag} #photography #nature`,
        likes: 2834,
        comments: 127,
        timestamp: '2h',
        url: `https://instagram.com/p/sample1`
      },
      {
        id: '2',
        username: 'lifestyle_blogger',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
        caption: `Living my best life with ${hashtag} vibes ✨`,
        likes: 1256,
        comments: 89,
        timestamp: '4h',
        url: `https://instagram.com/p/sample2`
      },
      {
        id: '3',
        username: 'creative_artist',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
        image: 'https://images.unsplash.com/photo-1481662875992-05b0bddfae7c?w=300&h=300&fit=crop',
        caption: `New artwork inspired by ${hashtag} 🎨 #art #creative`,
        likes: 3421,
        comments: 234,
        timestamp: '6h',
        url: `https://instagram.com/p/sample3`
      },
      {
        id: '4',
        username: 'food_lover',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop',
        caption: `Delicious meal of the day! ${hashtag} #foodie #yummy`,
        likes: 892,
        comments: 45,
        timestamp: '8h',
        url: `https://instagram.com/p/sample4`
      },
      {
        id: '5',
        username: 'fitness_guru',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        caption: `Morning workout complete! ${hashtag} #fitness #motivation`,
        likes: 1567,
        comments: 112,
        timestamp: '12h',
        url: `https://instagram.com/p/sample5`
      },
      {
        id: '6',
        username: 'fashion_style',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop',
        caption: `Today's outfit featuring ${hashtag} style 👗 #fashion #ootd`,
        likes: 2103,
        comments: 178,
        timestamp: '1d',
        url: `https://instagram.com/p/sample6`
      }
    ];
    return mockPosts;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTrends([]);
    setKeywords([]);
    setSuggestions([]);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const trendList = Object.entries(data.trends || {}).map(([tag, stats]) => ({
        tag: tag.startsWith('#') ? tag : `#${tag}`,
        ...stats
      }));

      setKeywords(data.keywords || []);
      setTrends(trendList);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to analyze trends. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = async (hashtag) => {
    setSelectedHashtag(hashtag);
    setPostsLoading(true);
    setCurrentView('hashtag-posts');
    
    // Simulate API call delay
    setTimeout(() => {
      const posts = generateMockPosts(hashtag.tag);
      setInstagramPosts(posts);
      setPostsLoading(false);
    }, 1000);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedHashtag(null);
    setInstagramPosts([]);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-yellow-400";
    if (score >= 4) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreGradient = (score) => {
    if (score >= 8) return "from-emerald-500 to-green-600";
    if (score >= 6) return "from-yellow-500 to-orange-500";
    if (score >= 4) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-600";
  };

  const getProgressWidth = (score) => {
    return Math.min((score / 10) * 100, 100);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (currentView === 'hashtag-posts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToMain}
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-200 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Analysis
            </button>
            
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl mr-4">
                <Hash className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{selectedHashtag?.tag}</h1>
                <p className="text-slate-300 mt-1">Top Instagram posts • TF-IDF Score: {selectedHashtag?.score}</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-2xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{formatNumber(selectedHashtag?.volume || 0)}</div>
                <div className="text-slate-300 text-sm">Total Posts</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(selectedHashtag?.score || 0)}`}>
                  {selectedHashtag?.score || 0}
                </div>
                <div className="text-slate-300 text-sm">TF-IDF Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">#{trends.findIndex(t => t.tag === selectedHashtag?.tag) + 1}</div>
                <div className="text-slate-300 text-sm">Trend Rank</div>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {postsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-300">Loading Instagram posts...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instagramPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:scale-105 transition-all duration-300 hover:border-purple-500/50"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-center">
                    <img
                      src={post.avatar}
                      alt={post.username}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white">{post.username}</div>
                      <div className="text-sm text-slate-400">{post.timestamp} ago</div>
                    </div>
                  </div>

                  {/* Post Image */}
                  <div className="aspect-square bg-slate-800">
                    <img
                      src={post.image}
                      alt="Instagram post"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    {/* Engagement */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center text-pink-400">
                        <Heart className="w-4 h-4 mr-1" />
                        <span className="text-sm">{formatNumber(post.likes)}</span>
                      </div>
                      <div className="flex items-center text-blue-400">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">{post.comments}</span>
                      </div>
                    </div>

                    {/* Caption */}
                    <p className="text-slate-200 text-sm mb-4 line-clamp-2">
                      {post.caption}
                    </p>

                    {/* View on Instagram Button */}
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Instagram
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Note about data */}
          <div className="mt-12 bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-start">
              <div className="bg-blue-500/20 rounded-lg p-2 mr-4 flex-shrink-0">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-200 mb-2">Demo Data</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  These are sample Instagram posts for demonstration purposes. In a production app, 
                  this would connect to the Instagram API to fetch real posts with the selected hashtag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl mr-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Hashtrend
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover trending hashtags and optimize your content strategy with AI-powered TF-IDF analysis
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400 mr-3" />
                <label className="text-lg font-semibold text-white">
                  Describe your product or post
                </label>
              </div>

              <div className="relative">
                <textarea
                  placeholder="Tell us about your content, product, or campaign..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-800/50 border-2 border-slate-600 rounded-2xl p-6 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 resize-none text-lg"
                />
                <div className="absolute bottom-4 right-4 text-slate-400 text-sm">
                  {prompt.length}/1000
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                  <span className="text-red-200">{error}</span>
                </div>
              )}

              {trends.length > 0 && (
                <div className="max-w-4xl mx-auto mt-8">
                  <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex items-start">
                      <div className="bg-blue-500/20 rounded-lg p-2 mr-4 flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-blue-200 mb-2">About TF-IDF Analysis</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          This score combines <strong className="text-white">term frequency</strong> (how often the hashtag appears)
                          with <strong className="text-white">inverse document frequency</strong> (how unique it is across posts),
                          giving higher scores to hashtags that are both popular and distinctive.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Analyzing Trends...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6 mr-3" />
                    Analyze Trends
                  </>
                )}
              </button>
            </div>
          </div>

          {(keywords.length > 0 || trends.length > 0 || suggestions.length > 0) && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              {keywords.length > 0 && (
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl mr-4">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Extracted Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-blue-200 px-4 py-2 rounded-full font-medium hover:scale-105 transition-transform duration-200 cursor-default"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {trends.length > 0 && (
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl mr-4">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Top Trending Hashtags</h3>
                    </div>
                    <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                      TF-IDF Analysis • {trends.length} results • Click to view posts
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {trends.map((trend, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleHashtagClick(trend)}
                        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-102 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-purple-500/20 rounded-lg p-2 mr-3">
                              <Hash className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-xl font-bold text-white">{trend.tag}</span>
                            <span className="ml-3 text-sm text-slate-400">Rank #{idx + 1}</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`text-2xl font-bold ${getScoreColor(trend.score)} mr-3`}>{trend.score}</div>
                            <ExternalLink className="w-5 h-5 text-purple-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm font-medium">Volume (TF)</span>
                              <BarChart3 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-blue-400">
                              {trend.volume?.toLocaleString?.() ?? "-"}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Total mentions</div>
                          </div>

                          <div className="bg-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm font-medium">TF-IDF Score</span>
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-3 mb-2">
                              <div
                                className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(trend.score)} transition-all duration-1000`}
                                style={{ width: `${getProgressWidth(trend.score)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-slate-400">Score • Relevance & frequency</div>
                          </div>
                        </div>

                        <div className="text-sm text-purple-300 font-medium">
                          Click to view top Instagram posts →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-4">
                      <Sparkles className="w-6 h-6 text-pink-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Strategy Suggestions</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-slate-200 text-lg pl-2">
                    {suggestions
                      .flatMap((tip) =>
                        tip.split(/\d+\.\s+/).filter(Boolean) // Split by "1. ", "2. ", etc.
                      )
                      .map((tip, idx) => (
                        <li key={idx}>{tip.trim()}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrendAnalyzer;