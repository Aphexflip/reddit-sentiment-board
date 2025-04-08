require('dotenv').config();
const express = require('express');
const snoowrap = require('snoowrap');
const Sentiment = require('sentiment');
const cors = require('cors');

const app = express();
const sentiment = new Sentiment();
app.use(cors());

const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN
});

const sentimentCategories = {
  positive: [],
  slightlyPositive: [],
  negative: [],
  scared: [],
};

function classifyComment(text, score) {
  const lower = text.toLowerCase();
  if (
    lower.includes('panic') ||
    lower.includes('crash') ||
    lower.includes('scared') ||
    lower.includes('sell') ||
    lower.includes('help') ||
    lower.includes('omg') ||
    lower.includes('bagholder')
  ) {
    return 'scared';
  }
  if (score > 3) return 'positive';
  if (score > 0) return 'slightlyPositive';
  return 'negative';
}

async function fetchAndCategorizeComments() {
  try {
    const subreddit = await reddit.getSubreddit('wallstreetbets');
    const comments = await subreddit.getNewComments({ limit: 50 });

    Object.keys(sentimentCategories).forEach(k => sentimentCategories[k] = []);

    comments.forEach(comment => {
      const result = sentiment.analyze(comment.body);
      const category = classifyComment(comment.body, result.score);
      sentimentCategories[category].push({
        body: comment.body,
        ups: comment.ups,
        downs: comment.downs,
      });
    });

    Object.keys(sentimentCategories).forEach(k => {
      sentimentCategories[k].sort((a, b) => b.ups - a.ups);
      sentimentCategories[k] = sentimentCategories[k].slice(0, 5);
    });
  } catch (err) {
    console.error('Error fetching comments:', err.message);
  }
}

setInterval(fetchAndCategorizeComments, 5000);

app.get('/api/comments', (req, res) => {
  res.json(sentimentCategories);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Reddit Sentiment API running on http://localhost:${PORT}`);
});
