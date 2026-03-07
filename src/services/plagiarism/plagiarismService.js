import axios from 'axios';

/**
 * Plagiarism Detection Service
 *
 * Real detection via TF-IDF cosine similarity + sentence-level matching
 * against all articles stored in MongoDB.
 *
 * Optional external providers: set PLAGIARISM_PROVIDER=copyscape|quetext
 */

class PlagiarismService {
  constructor () {
    this.provider      = process.env.PLAGIARISM_PROVIDER || 'internal';
    this.copyscapeKey  = process.env.COPYSCAPE_API_KEY;
    this.copyscapeUser = process.env.COPYSCAPE_USERNAME;
    this.quetextKey    = process.env.QUETEXT_API_KEY;
  }

  // ── Public entry point ─────────────────────────────────────────────────
  async checkPlagiarism (content, title = '', excludeId = null) {
    const plainText = this.stripHtml(content);
    if (!plainText || plainText.length < 50) {
      throw new Error('Content must be at least 50 characters for plagiarism check.');
    }
    switch (this.provider) {
      case 'copyscape': return await this.checkWithCopyscape(plainText, title);
      case 'quetext':   return await this.checkWithQuetext(plainText, title);
      default:          return await this.checkInternalSimilarity(plainText, title, excludeId);
    }
  }

  // ── Real internal engine (TF-IDF + sentence matching vs MongoDB) ───────
  async checkInternalSimilarity (plainText, title, excludeId) {
    const Article = (await import('../../models/Article.js')).default;

    const query = {};
    if (excludeId) query._id = { $ne: excludeId };

    const existingArticles = await Article.find(query)
      .select('_id title content')
      .limit(300)
      .lean();

    if (existingArticles.length === 0) {
      return this._buildResult(0, this.countWords(plainText), [], 'Internal Similarity Engine', {
        articlesChecked: 0,
        message: 'No existing articles to compare against.'
      });
    }

    const submittedTokens   = this.tokenize(plainText);
    const submittedSentences = this.splitSentences(plainText);
    const matches = [];

    for (const article of existingArticles) {
      const articleText = this.stripHtml(article.content || '');
      if (!articleText || articleText.length < 50) continue;

      const articleTokens    = this.tokenize(articleText);
      const articleSentences = this.splitSentences(articleText);

      const cosineSim     = this.cosineSimilarity(submittedTokens, articleTokens);
      const sentenceResult = this.matchSentences(submittedSentences, articleSentences, submittedTokens.length);
      const similarity     = Math.max(cosineSim * 100, sentenceResult.percentage);

      if (similarity >= 5) {
        matches.push({
          articleId: article._id,
          url: `/articles/${article._id}`,
          title: article.title || 'Untitled',
          matchPercentage: Math.round(similarity * 10) / 10,
          matchedWords: Math.round(submittedTokens.length * similarity / 100),
          textSnippet: sentenceResult.snippet || ''
        });
      }
    }

    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    const topMatches = matches.slice(0, 10);

    let overallScore = 0;
    if (topMatches.length > 0) {
      const weights    = topMatches.map((_, i) => 1 / (i + 1));
      const weightSum  = weights.reduce((s, w) => s + w, 0);
      const weightedAvg = topMatches.reduce((s, m, i) => s + m.matchPercentage * weights[i], 0) / weightSum;
      overallScore = Math.min(Math.max(weightedAvg, topMatches[0].matchPercentage), 100);
    }

    return this._buildResult(
      Math.round(overallScore * 10) / 10,
      this.countWords(plainText),
      topMatches,
      'Internal Similarity Engine',
      { articlesChecked: existingArticles.length, algorithm: 'TF-IDF Cosine Similarity + Sentence n-gram Matching' }
    );
  }

  // ── TF-IDF helpers ─────────────────────────────────────────────────────
  computeTF (tokens) {
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const len = tokens.length || 1;
    for (const t in tf) tf[t] /= len;
    return tf;
  }

  cosineSimilarity (tokens1, tokens2) {
    if (!tokens1.length || !tokens2.length) return 0;
    const tf1 = this.computeTF(tokens1);
    const tf2 = this.computeTF(tokens2);
    const vocab = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
    let dot = 0, mag1 = 0, mag2 = 0;
    for (const term of vocab) {
      const v1 = tf1[term] || 0, v2 = tf2[term] || 0;
      dot += v1 * v2; mag1 += v1 * v1; mag2 += v2 * v2;
    }
    if (!mag1 || !mag2) return 0;
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  // ── Sentence-level matching ────────────────────────────────────────────
  matchSentences (sentences1, sentences2, totalWords) {
    let matchedWords = 0, snippet = '';
    for (const s1 of sentences1) {
      const words1 = s1.split(/\s+/);
      if (words1.length < 8) continue;
      const t1 = this.tokenize(s1);
      for (const s2 of sentences2) {
        if (s2.split(/\s+/).length < 8) continue;
        if (this.cosineSimilarity(t1, this.tokenize(s2)) >= 0.82) {
          matchedWords += words1.length;
          if (!snippet) snippet = s1.length > 160 ? s1.substring(0, 160) + '…' : s1;
          break;
        }
      }
    }
    return { percentage: totalWords > 0 ? (matchedWords / totalWords) * 100 : 0, snippet };
  }

  // ── External providers ─────────────────────────────────────────────────
  async checkWithCopyscape (content, title) {
    if (!this.copyscapeKey || !this.copyscapeUser)
      throw new Error('Copyscape credentials not configured.');
    const response = await axios.post('https://www.copyscape.com/api/', null, {
      params: { u: this.copyscapeUser, k: this.copyscapeKey, o: 'csearch', t: title, e: 'UTF-8', c: content.substring(0, 25000) }
    });
    const result  = response.data;
    const matches = (result.result || []).map(m => ({
      url: m.url || '', title: m.title || '', matchPercentage: m.percentmatched || 0,
      matchedWords: m.minwordsmatched || 0, textSnippet: m.textsnippet || ''
    }));
    const score = matches.length
      ? Math.min(matches.reduce((s, m) => s + m.matchPercentage, 0) / matches.length, 100) : 0;
    return this._buildResult(score, this.countWords(content), matches, 'Copyscape', { raw: result });
  }

  async checkWithQuetext (content, title) {
    if (!this.quetextKey) throw new Error('QUETEXT_API_KEY not configured.');
    const response = await axios.post('https://www.quetext.com/api/v1/check',
      { text: content, title },
      { headers: { Authorization: `Bearer ${this.quetextKey}`, 'Content-Type': 'application/json' } }
    );
    const result  = response.data;
    const matches = (result.matches || []).map(m => ({
      url: m.url || '', title: m.title || 'Untitled Source',
      matchPercentage: m.percentage || 0, matchedWords: m.matched_words || 0, textSnippet: m.snippet || ''
    }));
    return this._buildResult(result.plagiarism_percentage || 0, this.countWords(content), matches, 'Quetext', { raw: result });
  }

  // ── Text utilities ─────────────────────────────────────────────────────
  stripHtml (html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  }

  splitSentences (text) {
    return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 20);
  }

  tokenize (text) {
    if (!text) return [];
    const stop = new Set([
      'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
      'is','are','was','were','be','been','have','has','had','do','does','did','will',
      'would','could','should','may','might','this','that','these','those','it','its',
      'i','we','you','he','she','they','their','our','your','his','her','my','about',
      'as','into','through','during','before','after','above','below','up','down','out',
      'off','over','under','again','further','then','once','also','can','each','both',
      'all','any','most','other','some','such','no','nor','not','only','own','same',
      'so','than','too','very','just','because','if','while','although','however'
    ]);
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stop.has(w));
  }

  countWords (text) {
    if (!text) return 0;
    return this.stripHtml(text).split(/\s+/).filter(w => w.length > 0).length;
  }

  // ── Score helpers ──────────────────────────────────────────────────────
  isAcceptableScore (score, threshold = 30) { return score <= threshold; }

  getRecommendation (score) {
    if (score < 10) return { status: 'excellent', message: 'Excellent — content is highly original.', action: 'ready_to_publish' };
    if (score < 20) return { status: 'good',      message: 'Good — minor similarities within acceptable range.', action: 'ready_to_publish' };
    if (score < 35) return { status: 'moderate',  message: 'Moderate similarity found. Review flagged sections before publishing.', action: 'review_recommended' };
    return           { status: 'high',     message: 'High similarity to existing content. Significant revision required.', action: 'revision_required' };
  }

  generateReport (checkResult) {
    const recommendation = this.getRecommendation(checkResult.score);
    return {
      ...checkResult,
      recommendation,
      summary: {
        originalityScore: Math.round((100 - checkResult.score) * 10) / 10,
        plagiarismScore:  checkResult.score,
        totalSources:     checkResult.matchedSources.length,
        status:           recommendation.status
      }
    };
  }

  _buildResult (score, wordCount, matchedSources, provider, details = {}) {
    return { checked: true, score, wordCount, matchedSources, checkedAt: new Date(), provider, details };
  }
}

export default new PlagiarismService();
