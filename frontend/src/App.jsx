import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Header from './components/Header.jsx';
import Filters from './components/Filters.jsx';
import KpiRow from './components/KpiRow.jsx';
import AqiOverviewGrid from './components/AqiOverviewGrid.jsx';
import AqiTrendChart from './components/AqiTrendChart.jsx';
import PollutantBarChart from './components/PollutantBarChart.jsx';
import CategoryDonut from './components/CategoryDonut.jsx';
import CityRankingTable from './components/CityRankingTable.jsx';
import ForecastChart from './components/ForecastChart.jsx';
import AlertBanner from './components/AlertBanner.jsx';

import AqiGauge from './components/AqiGauge.jsx';
import PlainEnglishInsights from './components/PlainEnglishInsights.jsx';
import ActivityAdvisor from './components/ActivityAdvisor.jsx';
import MaskAdvisor from './components/MaskAdvisor.jsx';
import WhoComparison from './components/WhoComparison.jsx';
import TodayVsYesterday from './components/TodayVsYesterday.jsx';
import HourlyPattern from './components/HourlyPattern.jsx';
import WeeklyPattern from './components/WeeklyPattern.jsx';
import HourlyHeatmap from './components/HourlyHeatmap.jsx';
import MultiPollutantChart from './components/MultiPollutantChart.jsx';
import CityComparison from './components/CityComparison.jsx';
import DistributionHistogram from './components/DistributionHistogram.jsx';
import ExtremesPanel from './components/ExtremesPanel.jsx';
import StreakCounter from './components/StreakCounter.jsx';
import HealthRiskPanel from './components/HealthRiskPanel.jsx';
import PollutantContributors from './components/PollutantContributors.jsx';

import {
  fetchCities, fetchLatestByCity, fetchSummary, fetchPollutantBreakdown,
  fetchCategoryDistribution, fetchCityRanking, fetchActiveAlerts,
  fetchAqiTrend, fetchForecast, triggerEtl,
  fetchHourlyPattern, fetchWeeklyPattern, fetchHeatmap, fetchMultiPollutant,
  fetchWhoComparison, fetchTodayVsYesterday, fetchDistribution, fetchExtremes,
  fetchStreak, fetchDominantFreq, fetchPlainInsights, fetchDataSource,
} from './services/api.js';

const DEFAULT_FILTERS = { city: 'Delhi', days: 7 };

export default function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [cities, setCities] = useState([]);
  const [latest, setLatest] = useState([]);
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [trend, setTrend] = useState({ data: [] });
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);

  /* new state slices */
  const [hourly, setHourly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [multiPol, setMultiPol] = useState([]);
  const [who, setWho] = useState([]);
  const [tvy, setTvy] = useState(null);
  const [dist, setDist] = useState([]);
  const [extremes, setExtremes] = useState(null);
  const [streak, setStreak] = useState(null);
  const [dominant, setDominant] = useState([]);
  const [insights, setInsights] = useState([]);
  const [dataSource, setDataSource] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setError('');
    const params = { city: filters.city, days: filters.days };
    try {
      const [
        c, l, s, b, d, r, t, f, a,
        hp, wp, hm, mp, w, ty, dh, ex, st, dom, ins, ds,
      ] = await Promise.all([
        fetchCities(),
        fetchLatestByCity(),
        fetchSummary(params),
        fetchPollutantBreakdown(params),
        fetchCategoryDistribution(params),
        fetchCityRanking({ days: filters.days }),
        fetchAqiTrend(params),
        fetchForecast(filters.city, { horizon: 12 }).catch(() => null),
        fetchActiveAlerts().catch(() => []),
        fetchHourlyPattern(params).catch(() => ({ data: [] })),
        fetchWeeklyPattern(params).catch(() => ({ data: [] })),
        fetchHeatmap({ ...params, days: Math.min(filters.days, 14) }).catch(() => ({ data: [] })),
        fetchMultiPollutant(params).catch(() => ({ data: [] })),
        fetchWhoComparison({ city: filters.city }).catch(() => ({ data: [] })),
        fetchTodayVsYesterday({ city: filters.city }).catch(() => null),
        fetchDistribution(params).catch(() => ({ data: [] })),
        fetchExtremes(params).catch(() => null),
        fetchStreak({ city: filters.city }).catch(() => null),
        fetchDominantFreq(params).catch(() => ({ data: [] })),
        fetchPlainInsights({ city: filters.city }).catch(() => ({ insights: [] })),
        fetchDataSource().catch(() => null),
      ]);
      setCities(c);
      setLatest(l);
      setSummary(s);
      setBreakdown(b.data || []);
      setDistribution(d.data || []);
      setRanking(r.data || []);
      setTrend(t);
      setForecast(f);
      setAlerts(a || []);

      setHourly(hp.data || []);
      setWeekly(wp.data || []);
      setHeatmap(hm.data || []);
      setMultiPol(mp.data || []);
      setWho(w.data || []);
      setTvy(ty);
      setDist(dh.data || []);
      setExtremes(ex);
      setStreak(st);
      setDominant(dom.data || []);
      setInsights(ins.insights || []);
      setDataSource(ds);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerEtl();
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setRefreshing(false);
    }
  };

  // `latest` now has one row per city (averaged across that city's stations).
  // Use it for both the gauge headline and the all-cities grid.
  const currentCityRow = useMemo(
    () => latest.find((x) => x.city === filters.city),
    [latest, filters.city]
  );
  const currentAqi = currentCityRow?.aqi_value ?? null;

  return (
    <div className="app">
      <Header
        onRefresh={handleRefresh}
        refreshing={refreshing}
        alertsCount={alerts.length}
        dataSource={dataSource}
      />

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} onAllDismissed={() => setAlerts([])} />
      )}

      <main className="container">
        <section className="hero">
          <h2>
            <span className="gradient">Breathe smart.</span><br />
            Live AQI across India.
          </h2>
          <p>
            Real-time pollution intelligence — track trends, spot hazardous spikes,
            and know what to do <strong>right now</strong>. No expertise needed.
          </p>
        </section>

        <Filters
          cities={cities}
          filters={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        />

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading">Syncing live air data</div>
        ) : (
          <>
            {/* --------- ROW 1 · NORMIE-FIRST: now, advice, change --------- */}
            <div className="bento">
              <div className="card col-5">
                <h3>{filters.city} · right now</h3>
                <AqiGauge value={currentAqi} city={filters.city} />
              </div>
              <div className="card col-4">
                <h3>What this means for you</h3>
                <ActivityAdvisor aqi={currentAqi} />
                <div style={{ height: 12 }} />
                <MaskAdvisor aqi={currentAqi} />
              </div>
              <div className="card col-3">
                <h3>vs yesterday</h3>
                <TodayVsYesterday data={tvy} />
              </div>
            </div>

            {/* --------- ROW 2 · plain insights + streak --------- */}
            <div className="bento">
              <div className="card col-8">
                <h3>Key takeaways · plain English</h3>
                <PlainEnglishInsights insights={insights} />
              </div>
              <div className="card col-4">
                <h3>Current streak</h3>
                <StreakCounter data={streak} />
              </div>
            </div>

            {/* --------- ROW 3 · health risk + WHO comparison --------- */}
            <div className="bento">
              <div className="card col-5">
                <h3>Health risk by group</h3>
                <HealthRiskPanel aqi={currentAqi} />
              </div>
              <div className="card col-7">
                <h3>vs WHO safe limit</h3>
                <WhoComparison data={who} />
              </div>
            </div>

            {/* --------- ROW 4 · KPI strip --------- */}
            <KpiRow summary={summary?.summary} peakHour={summary?.peakHour} city={filters.city} />

            {/* --------- ROW 5 · trend + category mix --------- */}
            <div className="bento">
              <div className="card col-8">
                <h3>{filters.city} · AQI trend · last {filters.days}d</h3>
                <AqiTrendChart data={trend.data || []} />
              </div>
              <div className="card col-4">
                <h3>Category mix</h3>
                <CategoryDonut data={distribution} />
              </div>
            </div>

            {/* --------- ROW 6 · hourly + weekly patterns --------- */}
            <div className="bento">
              <div className="card col-6">
                <h3>Hour of day · when's the air worst?</h3>
                <HourlyPattern data={hourly} />
              </div>
              <div className="card col-6">
                <h3>Day of week pattern</h3>
                <WeeklyPattern data={weekly} />
              </div>
            </div>

            {/* --------- ROW 7 · heatmap --------- */}
            <div className="bento">
              <div className="card col-12">
                <h3>Hour × day heatmap · last {Math.min(filters.days, 14)} days</h3>
                <HourlyHeatmap data={heatmap} />
              </div>
            </div>

            {/* --------- ROW 8 · pollutants overlay + bar --------- */}
            <div className="bento">
              <div className="card col-7">
                <h3>All pollutants over time</h3>
                <MultiPollutantChart data={multiPol} />
              </div>
              <div className="card col-5">
                <h3>Pollutants vs safe limit</h3>
                <PollutantBarChart data={breakdown} />
              </div>
            </div>

            {/* --------- ROW 9 · distribution + main culprits --------- */}
            <div className="bento">
              <div className="card col-7">
                <h3>How often is the air this bad? · histogram</h3>
                <DistributionHistogram data={dist} />
              </div>
              <div className="card col-5">
                <h3>Main pollutant culprits</h3>
                <PollutantContributors data={dominant} />
              </div>
            </div>

            {/* --------- ROW 10 · extremes + ranking --------- */}
            <div className="bento">
              <div className="card col-7">
                <h3>Best & worst hours · last {filters.days}d</h3>
                <ExtremesPanel data={extremes} />
              </div>
              <div className="card col-5">
                <h3>Worst cities right now</h3>
                <CityRankingTable
                  data={ranking}
                  onSelect={(c) => setFilters((f) => ({ ...f, city: c }))}
                />
              </div>
            </div>

            {/* --------- ROW 11 · city comparison --------- */}
            <div className="bento">
              <div className="card col-12">
                <h3>Compare cities</h3>
                <CityComparison cities={cities} defaultA={filters.city} defaultB={filters.city === 'Mumbai' ? 'Delhi' : 'Mumbai'} days={filters.days} />
              </div>
            </div>

            {/* --------- ROW 12 · forecast --------- */}
            <div className="bento">
              <div className="card col-12">
                <h3>{filters.city} · next 12-hour forecast</h3>
                <ForecastChart forecast={forecast} />
              </div>
            </div>

            {/* --------- ROW 13 · all cities --------- */}
            <div className="bento">
              <div className="card col-12">
                <h3>All cities · live snapshot</h3>
                <AqiOverviewGrid
                  latest={latest}
                  onSelect={(c) => setFilters((f) => ({ ...f, city: c }))}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        AQI Dashboard
        <span className="footer-sep">·</span>
        MCA Project, Plag Pro Noida
        <span className="footer-sep">·</span>
        Data: CPCB · OpenAQ · WHO 2021 guidelines
      </footer>
    </div>
  );
}
