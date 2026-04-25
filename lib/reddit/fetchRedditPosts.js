const REDDIT_API_BASE = 'https://www.reddit.com';
const REDDIT_SEARCH_BASE = 'https://www.reddit.com';
const USER_AGENT = 'RedditSignal/1.0 (by /u/redditsignal)';

export async function searchSubreddits(query) {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${REDDIT_SEARCH_BASE}/search.json?q=${encodeURIComponent(query)}&type=sr&limit=10`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const communities = data.data?.children || [];

    return communities
      .filter(item => item.data?.subreddit_type !== 'private')
      .map(item => ({
        name: item.data.display_name,
        subscribers: item.data.subscribers || 0,
        description: item.data.description?.substring(0, 100) || '',
      }))
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 10);
  } catch (error) {
    console.error('Subreddit search error:', error);
    return [];
  }
}

export async function fetchRedditPosts(subreddit, limit = 30) {
  const url = `${REDDIT_API_BASE}/r/${subreddit}/new.json?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Reddit posts: ${response.status}`);
  }

  const data = await response.json();
  const posts = data.data.children.map(child => child.data);

  return posts.map(post => ({
    reddit_post_id: post.id,
    title: post.title,
    url: `https://reddit.com${post.permalink}`,
    subreddit: post.subreddit,
    author: post.author,
    content_snippet: post.selftext?.substring(0, 500) || '',
    full_json: post,
    timestamp: new Date(post.created_utc * 1000).toISOString(),
  }));
}

export function matchKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  const matches = [];
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }
  
  return matches;
}