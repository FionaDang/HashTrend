import React, { useState } from "react";
import { Search, TrendingUp, Hash, Zap, BarChart3, Target, Sparkles } from "lucide-react";

function TrendAnalyzer() {
  const [prompt, setPrompt] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setTrends([]);
  setKeywords([]);

  try {
    const response = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    setKeywords(data.keywords || []);
    setTrends(data.trends || []);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    setLoading(false);
  }
};


  const getScoreColor = (score) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 80) return "text-yellow-400";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreGradient = (score) => {
    if (score >= 90) return "from-emerald-500 to-green-600";
    if (score >= 80) return "from-yellow-500 to-orange-500";
    if (score >= 70) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
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
            Discover trending hashtags and optimize your content strategy with AI-powered insights
          </p>
        </div>

        {/* Main Form */}
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
                  placeholder="Tell us about your content, product, or campaign. The more details you provide, the better our AI can analyze trending opportunities..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-800/50 border-2 border-slate-600 rounded-2xl p-6 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 resize-none text-lg"
                />
                <div className="absolute bottom-4 right-4 text-slate-400 text-sm">
                  {prompt.length}/1000
                </div>
              </div>
              
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

          {/* Results Section */}
          {(keywords.length > 0 || trends.length > 0) && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              
              {/* Keywords Section */}
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

              {/* Trends Section */}
              {trends.length > 0 && (
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="flex items-center mb-8">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl mr-4">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Top Trending Hashtags</h3>
                  </div>
                  
                  <div className="grid gap-6">
                    {trends.map((trend, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-102"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Hash className="w-5 h-5 text-purple-400 mr-2" />
                            <span className="text-xl font-bold text-white">
                              {trend.tag}
                            </span>
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(trend.score)}`}>
                            {trend.score}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm font-medium">Volume</span>
                              <BarChart3 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-blue-400">
                              {trend.volume.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="bg-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm font-medium">Velocity</span>
                              <Zap className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="text-2xl font-bold text-yellow-400">
                              {trend.velocity}%
                            </div>
                          </div>
                          
                          <div className="bg-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm font-medium">Trend Score</span>
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-3 mb-2">
                              <div
                                className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(trend.score)} transition-all duration-1000`}
                                style={{ width: `${trend.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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