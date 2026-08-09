import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineStar, HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi';
import { customerAPI } from '../../services/api';

const categories = ['All', 'Hospital', 'Clinic', 'Salon', 'Restaurant', 'Office', 'Laboratory'];

const NearbyPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchNearby();
  }, []);

  const fetchNearby = async () => {
    try {
      const response = await customerAPI.getNearby();
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch nearby businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || business.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Nearby Services
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Find and book services around you
        </p>
      </div>

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-primary text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredBusinesses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineLocationMarker className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No Results Found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBusinesses.map((business) => (
            <div
              key={business._id || business.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineLocationMarker className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {business.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{business.category}</p>
                  </div>
                </div>
                {business.phone && (
                  <button className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <HiOutlinePhone className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {business.rating}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {business.distance
                    ? (business.distance / 1000).toFixed(1) + ' km'
                    : business.address || 'Distance unavailable'}
                </span>
              </div>

              <button className="w-full py-2.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default NearbyPage;
