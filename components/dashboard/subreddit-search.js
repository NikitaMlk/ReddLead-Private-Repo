'use client';

import { useState, useEffect, useRef } from 'react';

const POPULAR_SUBREDDITS = [
  { name: 'technology', subscribers: 15000000, description: 'Tech news and discussion' },
  { name: 'programming', subscribers: 5000000, description: 'Programming discussions' },
  { name: 'startups', subscribers: 3000000, description: 'Startup community' },
  { name: 'marketing', subscribers: 1500000, description: 'Marketing strategies' },
  { name: 'smallbusiness', subscribers: 1000000, description: 'Small business owners' },
  { name: 'entrepreneur', subscribers: 800000, description: 'Entrepreneur discussions' },
  { name: 'business', subscribers: 700000, description: 'Business community' },
  { name: 'saas', subscribers: 500000, description: 'Software as a Service' },
  { name: 'webdev', subscribers: 400000, description: 'Web development' },
  { name: 'android', subscribers: 3500000, description: 'Android community' },
  { name: 'ios', subscribers: 900000, description: 'iOS community' },
  { name: 'javascript', subscribers: 800000, description: 'JavaScript discussions' },
  { name: 'reactjs', subscribers: 350000, description: 'React.js community' },
  { name: 'python', subscribers: 1500000, description: 'Python programming' },
  { name: 'machinelearning', subscribers: 600000, description: 'Machine learning discussions' },
  { name: 'artificial', subscribers: 300000, description: 'AI discussions' },
  { name: 'crypto', subscribers: 500000, description: 'Cryptocurrency' },
  { name: 'finance', subscribers: 400000, description: 'Financial discussions' },
  { name: 'stocks', subscribers: 500000, description: 'Stock market discussions' },
  { name: 'passive_income', subscribers: 200000, description: 'Passive income strategies' },
  { name: 'ecommerce', subscribers: 300000, description: 'E-commerce discussions' },
  { name: 'digital_marketing', subscribers: 200000, description: 'Digital marketing tips' },
  { name: 'gaming', subscribers: 4000000, description: 'Gaming community' },
  { name: 'gamedev', subscribers: 300000, description: 'Game development' },
  { name: 'indiegaming', subscribers: 250000, description: 'Indie game developers' },
  { name: 'roblox', subscribers: 500000, description: 'Roblox development' },
  { name: 'unity', subscribers: 300000, description: 'Unity engine' },
  { name: 'unrealengine', subscribers: 200000, description: 'Unreal Engine' },
  { name: 'bitcoin', subscribers: 600000, description: 'Bitcoin discussions' },
  { name: 'ethereum', subscribers: 400000, description: 'Ethereum community' },
  { name: 'defi', subscribers: 200000, description: 'DeFi discussions' },
  { name: 'nft', subscribers: 300000, description: 'NFT community' },
  { name: 'personalfinance', subscribers: 400000, description: 'Personal finance tips' },
  { name: 'taxes', subscribers: 150000, description: 'Tax discussions' },
  { name: 'realestate', subscribers: 400000, description: 'Real estate investing' },
  { name: 'investing', subscribers: 500000, description: 'Investing strategies' },
  { name: 'wealth', subscribers: 100000, description: 'Building wealth' },
  { name: 'career', subscribers: 300000, description: 'Career development' },
  { name: 'resume', subscribers: 150000, description: 'Resume help' },
  { name: 'jobsearch', subscribers: 200000, description: 'Job search tips' },
  { name: 'cscareerquestions', subscribers: 250000, description: 'CS career questions' },
  { name: 'accounting', subscribers: 100000, description: 'Accounting discussions' },
  { name: 'legaladvice', subscribers: 350000, description: 'Legal advice community' },
  { name: 'ycombinator', subscribers: 200000, description: 'Y Combinator alumni' },
  { name: 'indiebusiness', subscribers: 80000, description: 'Indie business owners' },
  { name: 'sideproject', subscribers: 100000, description: 'Side project builders' },
  { name: 'buildinpublic', subscribers: 70000, description: 'Build in public' },
  { name: 'productivity', subscribers: 450000, description: 'Productivity tips' },
  { name: 'getdisciplined', subscribers: 150000, description: 'Discipline advice' },
  { name: 'selfimprovement', subscribers: 200000, description: 'Self improvement' },
  { name: 'codenewbies', subscribers: 120000, description: 'Coding for beginners' },
  { name: 'learnprogramming', subscribers: 250000, description: 'Learn programming' },
  { name: 'compsci', subscribers: 350000, description: 'Computer science' },
  { name: 'algorithms', subscribers: 100000, description: 'Algorithms discussion' },
  { name: 'datascience', subscribers: 300000, description: 'Data science' },
  { name: 'analytics', subscribers: 150000, description: 'Analytics discussions' },
  { name: 'excel', subscribers: 300000, description: 'Excel tips' },
  { name: 'sql', subscribers: 200000, description: 'SQL discussions' },
  { name: 'database', subscribers: 150000, description: 'Database administration' },
  { name: 'aws', subscribers: 250000, description: 'AWS cloud' },
  { name: 'googlecloud', subscribers: 150000, description: 'Google Cloud' },
  { name: 'azure', subscribers: 120000, description: 'Microsoft Azure' },
  { name: 'devops', subscribers: 200000, description: 'DevOps discussions' },
  { name: 'docker', subscribers: 150000, description: 'Docker containers' },
  { name: 'kubernetes', subscribers: 100000, description: 'Kubernetes discussions' },
  { name: 'linux', subscribers: 350000, description: 'Linux community' },
  { name: 'bash', subscribers: 80000, description: 'Bash scripting' },
  { name: 'vim', subscribers: 70000, description: 'Vim editor' },
  { name: 'vscode', subscribers: 100000, description: 'VS Code discussions' },
  { name: 'git', subscribers: 120000, description: 'Git version control' },
  { name: 'github', subscribers: 150000, description: 'GitHub community' },
  { name: 'gitlab', subscribers: 60000, description: 'GitLab discussions' },
  { name: 'netsec', subscribers: 80000, description: 'Network security' },
  { name: 'cybersecurity', subscribers: 200000, description: 'Cybersecurity community' },
  { name: 'hacking', subscribers: 150000, description: 'Ethical hacking' },
  { name: 'iot', subscribers: 100000, description: 'Internet of Things' },
  { name: 'raspberry_pi', subscribers: 200000, description: 'Raspberry Pi projects' },
  { name: 'arduino', subscribers: 150000, description: 'Arduino projects' },
  { name: 'electronics', subscribers: 80000, description: 'Electronics DIY' },
  { name: 'productdesign', subscribers: 60000, description: 'Product design' },
  { name: 'ux', subscribers: 80000, description: 'User experience' },
  { name: 'ui_design', subscribers: 70000, description: 'UI design' },
  { name: 'seo', subscribers: 150000, description: 'SEO optimization' },
  { name: 'content_marketing', subscribers: 60000, description: 'Content marketing' },
  { name: 'emailmarketing', subscribers: 50000, description: 'Email marketing' },
];

export function SubredditSearch({ value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(POPULAR_SUBREDDITS.slice(0, 10));
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const updateResults = (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setResults(POPULAR_SUBREDDITS.slice(0, 10));
    } else {
      const filtered = POPULAR_SUBREDDITS.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 15);
      setResults(filtered);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    updateResults(val);
    setShowDropdown(true);
  };

  const handleSelect = (subreddit) => {
    const current = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
    if (!current.includes(subreddit.name)) {
      const newValue = current.length > 0 ? `${value}, ${subreddit.name}` : subreddit.name;
      onChange(newValue);
    }
    setQuery('');
    setShowDropdown(false);
  };

  useEffect(() => {
    const initialResults = POPULAR_SUBREDDITS.slice(0, 10);
    setResults(initialResults);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          updateResults(query);
          setShowDropdown(true);
        }}
        placeholder={placeholder || 'Search subreddits...'}
        className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:ring-offset-2 focus:ring-offset-[#09090b]"
      />
      
      {showDropdown && (
        <div className="absolute z-[100] top-full mt-1 w-full rounded-md border border-[#27272a] bg-[#18181b] py-1 shadow-xl max-h-[300px] overflow-y-auto">
          <div className="px-3 py-1.5 text-xs text-[#71717a] uppercase tracking-wide sticky top-0 bg-[#18181b] border-b border-[#27272a]">
            {query.length >= 1 ? 'Search Results' : 'Popular Subreddits'}
          </div>
          {results.map((sub) => (
            <div
              key={sub.name}
              onClick={() => handleSelect(sub)}
              className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-[#27272a]"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#f97316] font-medium">r/{sub.name}</span>
                <span className="text-[#71717a]">-</span>
                <span className="text-[#a1a1aa] text-xs">{sub.description}</span>
              </div>
              <span className="text-xs text-[#71717a] whitespace-nowrap ml-2">
                {sub.subscribers >= 1000000 
                  ? `${(sub.subscribers / 1000000).toFixed(1)}M` 
                  : sub.subscribers >= 1000 
                    ? `${(sub.subscribers / 1000).toFixed(0)}K`
                    : sub.subscribers}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}