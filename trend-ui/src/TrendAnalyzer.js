import React, { useState } from "react";
import {
  Search,
  TrendingUp,
  Hash,
  Zap,
  BarChart3,
  Target,
  Sparkles,
  AlertCircle
} from "lucide-react";

function TrendAnalyzer() {
  const [prompt, setPrompt] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [trends, setTrends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
                      TF-IDF Analysis • {trends.length} results
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {trends.map((trend, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-102"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-purple-500/20 rounded-lg p-2 mr-3">
                              <Hash className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-xl font-bold text-white">{trend.tag}</span>
                            <span className="ml-3 text-sm text-slate-400">Rank #{idx + 1}</span>
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(trend.score)}`}>{trend.score}</div>
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
                    {suggestions.map((tip, idx) => (
                      <li key={idx}>{tip.replace(/^\d+\.\s*/, "")}</li>
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
