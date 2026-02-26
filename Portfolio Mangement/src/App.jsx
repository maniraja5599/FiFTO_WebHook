import React, { useState, useEffect } from 'react'; // Added useEffect for persistence
import { Upload, BarChart3, TrendingUp, TrendingDown, Activity, Save, FolderOpen } from 'lucide-react'; // Added icons for portfolio
import { motion } from 'framer-motion';
import { FileUpload } from './components/FileUpload';
import { processData, aggregateData } from './utils/processData';
import { StrategySelector } from './components/StrategySelector';
import { StatsGrid } from './components/StatsGrid';
import { EquityChart } from './components/EquityChart';
import { MonthlyAnalysis } from './components/MonthlyAnalysis';
import { DayOfWeekAnalysis } from './components/DayOfWeekAnalysis';
import { TradeList } from './components/TradeList';

function App() {
  const [strategies, setStrategies] = useState([]); // List of uploaded file data
  const [data, setData] = useState(null); // Aggregated data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedPortfolios, setSavedPortfolios] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('tradeAnalytics_portfolios');
    if (saved) setSavedPortfolios(JSON.parse(saved));
  }, []);

  // Re-calculate aggregated data whenever 'strategies' changes
  useEffect(() => {
    if (strategies.length > 0) {
      const aggregated = aggregateData(strategies);
      setData(aggregated);
    } else {
      setData(null);
    }
  }, [strategies]);

  useEffect(() => {
    fetch('/injected_portfolio.json')
      .then(res => {
        if (!res.ok) return;
        return res.json();
      })
      .then(portfolio => {
        if (portfolio && portfolio[0] && portfolio[0].strategies) {
          console.log("Loaded injected strategies:", portfolio[0].strategies.length);
          setStrategies(portfolio[0].strategies);
        }
      })
      .catch(err => console.log("Auto-load skipped"));
  }, []);


  const savePortfolio = () => {
    if (!strategies.length) return;
    const name = prompt('Enter a name for this portfolio:');
    if (name) {
      // Save the raw strategies, not just the aggregated view, so selection is preserved?
      // For simplicity, let's save the current 'strategies' state.
      // But loadPortfolio expects 'data'. Let's adjust loadPortfolio to handle strategies if present,
      // or legacy single 'data' object.
      // Actually, let's save the 'strategies' array in the portfolio object.
      const newPortfolio = { name, strategies, date: new Date().toISOString() };
      const updated = [...savedPortfolios, newPortfolio];
      setSavedPortfolios(updated);
      localStorage.setItem('tradeAnalytics_portfolios', JSON.stringify(updated));
      alert('Portfolio saved!');
    }
  };

  const loadPortfolio = (portfolio) => {
    if (portfolio.strategies) {
      setStrategies(portfolio.strategies);
    } else if (portfolio.data) {
      // Handle legacy saved files that didn't have strategies array
      // Wrap it as a single strategy
      setStrategies([{
        id: 'legacy',
        name: 'Legacy Portfolio',
        trades: portfolio.data.trades,
        selected: true
      }]);
    }
  };

  const deletePortfolio = (index, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      const updated = savedPortfolios.filter((_, i) => i !== index);
      setSavedPortfolios(updated);
      localStorage.setItem('tradeAnalytics_portfolios', JSON.stringify(updated));
    }
  };

  const handleUpload = async (files) => {
    setLoading(true);
    setError(null);
    try {
      // strategies is Array of { id, name, trades, selected }
      const newStrategies = await processData(files);

      // Merge with existing or replace?
      // User likely wants to ADD to existing if they upload more, or replace?
      // "Upload" usually implies "Load this". Let's replace for now to be clean, 
      // or we can append. Let's replace to match previous behavior, 
      // but since we support multi-file selection in upload already, 
      // replacing the set with the new batch is standard.
      setStrategies(prev => [...prev, ...newStrategies]);
    } catch (err) {
      console.error(err);
      setError('Failed to process file(s). Please ensure they are valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStrategy = (id) => {
    setStrategies(prev => prev.map(s =>
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              TradeAnalytics
            </h1>
          </div>
          {data && (
            <div className="flex items-center">
              <button
                onClick={savePortfolio}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors mr-2"
              >
                <Save className="w-4 h-4" />
                Save Portfolio
              </button>
              <button
                onClick={() => setData(null)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Upload New File
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {!data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto mt-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Upload Backtest Results</h2>
              <p className="text-slate-400">
                Drag and drop multiple Quantman Excel/CSV files to merge and analyze.
              </p>
            </div>
            <FileUpload onUpload={handleUpload} />

            {/* Saved Portfolios List */}
            {savedPortfolios.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center justify-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Load Saved Portfolio
                </h3>
                <div className="grid gap-3">
                  {savedPortfolios.map((p, index) => (
                    <button
                      key={index}
                      onClick={() => loadPortfolio(p)}
                      className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left group"
                    >
                      <div>
                        <div className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(p.date).toLocaleDateString()} • {p.data.trades.length} Trades
                        </div>
                      </div>
                      <div
                        onClick={(e) => deletePortfolio(index, e)}
                        className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        ×
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-8 text-center text-slate-400 animate-pulse">
                Processing data...
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <StrategySelector
              strategies={strategies}
              onToggle={handleToggleStrategy}
            />

            <StatsGrid stats={data.stats} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Equity Curve
              </h3>
              <EquityChart data={data.stats.equityCurve} />
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden"
              >
                <h3 className="text-lg font-semibold mb-6">Monthly Performance</h3>
                <MonthlyAnalysis data={data.stats.monthlyData} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-6">Day of Week Analysis</h3>
                <DayOfWeekAnalysis data={data.stats.dayOfWeekData} />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TradeList trades={data.trades} />
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
