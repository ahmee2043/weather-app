import React, { useState } from 'react';

export default function WeatherPage() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const API_KEY = '44fc8810a3792671c3f9a6ecba08207d';
  const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
  const GEOCODING_BASE_URL = 'http://api.openweathermap.org/geo/1.0/direct';

  const fetchWeather = async (cityNameOverride = city) => {
    setWeather(null);
    setError(null);
    setSuggestions([]);
    setActiveIndex(2);
    setLoading(true);
    try {
      const url = `${BASE_URL}?q=${cityNameOverride}&appid=${API_KEY}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'City not found or API error.');
      }
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCitySuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    try {
      const url = `${GEOCODING_BASE_URL}?q=${query}&limit=5&appid=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const uniqueSuggestions = Array.from(new Set(
        data.map(item => {
          let suggestion = item.name;
          if (item.state) suggestion += `, ${item.state}`;
          suggestion += `, ${item.country}`;
          return suggestion;
        })
      ));
      setSuggestions(uniqueSuggestions);
      setActiveIndex(-1);
    } catch (err) {
      console.error("Error fetching city suggestions:", err);
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setActiveIndex(-1);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const newTimeout = setTimeout(() => {
      fetchCitySuggestions(value);
    }, 500);
    setDebounceTimeout(newTimeout);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex !== -1 && suggestions[activeIndex]) {
          handleSuggestionClick(suggestions[activeIndex]);
        } else {
          handleSubmit(e);
        }
      } else if (e.key === 'Escape') {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city.trim());
    } else {
      setError('Please enter a city name.');
    }
  };

  const handleSuggestionClick = (selectedSuggestion) => {
    const cityNameOnly = selectedSuggestion.split(',')[0].trim();
    setCity(cityNameOnly);
    setSuggestions([]);
    setActiveIndex(-1);
    fetchWeather(cityNameOnly);
  };

  const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return '';
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-inter">
      <div className="bg-slate-800 bg-opacity-90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md border-opacity-30">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-6 drop-shadow-sm">
          Weather App
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6 relative">
          <input
            type="text"
            value={city}
            onChange={handleCityInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter city name"
            className="placeholder:text-slate-400 text-white flex-grow p-3 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition duration-200 shadow-sm"
            aria-autocomplete="list"
            aria-controls="suggestions-list"
            aria-activedescendant={activeIndex !== -1 ? `suggestion-${activeIndex}` : undefined}
          />
          <button
            type="submit"
            className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-md shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Search Weather'}
          </button>

          {suggestions.length > 0 && (
            <ul
              id="suggestions-list"
              role="listbox"
              className="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg top-full left-0"
            >
              {suggestions.map((sugg, index) => (
                <li
                  key={index}
                  id={`suggestion-${index}`}
                  role="option"
                  className={`p-3 cursor-pointer text-white text-left transition-colors duration-150 ${
                    index === activeIndex ? 'bg-slate-600' : 'hover:bg-slate-600'
                  }`}
                  onClick={() => handleSuggestionClick(sugg)}
                >
                  {sugg}
                </li>
              ))}
            </ul>
          )}
        </form>

        {loading && (
          <p className="text-center text-blue-400 text-lg">
            Loading weather data...
          </p>
        )}

        {error && (
          <p className="text-center text-red-400 text-lg font-medium p-3 bg-red-600 rounded-md border border-red-600">
            Error: {error}
          </p>
        )}

        {weather && (
          <div className="text-center bg-slate-800 bg-opacity-70 rounded-lg p-5 shadow-inner mt-6 border border-slate-600">
            <h2 className="text-3xl font-semibold text-white mb-2">
              {weather.name}, {weather.sys.country}
            </h2>
            {weather.weather && weather.weather.length > 0 && (
              <>
                <img
                  src={getWeatherIconUrl(weather.weather[0].icon)}
                  alt={weather.weather[0].description}
                  className="mx-auto w-24 h-24 drop-shadow-md"
                />
                <p className="text-2xl text-gray-400 capitalize mb-2">
                  {weather.weather[0].description}
                </p>
              </>
            )}
            <p className="text-5xl font-bold text-blue-400 mb-4">
              {Math.round(weather.main.temp)}°C
            </p>
            <div className="flex justify-around text-gray-400 text-lg">
              <div>
                <p>Humidity:</p>
                <p className="font-medium">{weather.main.humidity}%</p>
              </div>
              <div>
                <p>Wind Speed:</p>
                <p className="font-medium">{Math.round(weather.wind.speed * 3.6)} km/h</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
