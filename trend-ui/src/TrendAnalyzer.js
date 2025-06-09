import React, { useState } from "react";
import axios from "axios";

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
      const response = await axios.post("http://localhost:5000/analyze", {
        prompt,
      });

      setKeywords(response.data.keywords || []);
      setTrends(response.data.trends || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Hashtag Trend Analyzer</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Describe your product or post..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          cols={50}
          style={{ marginBottom: "1rem" }}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Trends"}
        </button>
      </form>

      {keywords.length > 0 && (
        <>
          <h3>🔑 Keywords:</h3>
          <p>{keywords.join(", ")}</p>
        </>
      )}

      {trends.length > 0 && (
        <>
          <h3>📈 Top Trends:</h3>
          <ul>
            {trends.map((t, idx) => (
              <li key={idx}>
                #{t.tag} — vol: {t.volume}, vel: {t.velocity}, score: {t.score}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default TrendAnalyzer;
