import axios from 'axios';

/**
 * Plagiarism Detection Service
 * Supports multiple plagiarism detection providers
 */

class PlagiarismService {
  constructor() {
    this.provider = process.env.PLAGIARISM_PROVIDER || 'mock';
    this.copyscapeKey = process.env.COPYSCAPE_API_KEY;
    this.copyscapeUsername = process.env.COPYSCAPE_USERNAME;
    this.quetextKey = process.env.QUETEXT_API_KEY;
  }

  /**
   * Check content for plagiarism
   * @param {string} content - Content to check
   * @param {string} title - Title of the content
   * @returns {Promise<Object>} Plagiarism report
   */
  async checkPlagiarism(content, title = '') {
    try {
      // Remove HTML tags for checking
      const plainText = this.stripHtml(content);
      
      // Validate content
      if (!plainText || plainText.length < 100) {
        throw new Error('Content must be at least 100 characters');
      }

      // Route to appropriate provider
      switch (this.provider) {
        case 'copyscape':
          return await this.checkWithCopyscape(plainText, title);
        case 'quetext':
          return await this.checkWithQuetext(plainText, title);
        case 'mock':
        default:
          return await this.mockPlagiarismCheck(plainText);
      }
    } catch (error) {
      console.error('Plagiarism check error:', error);
      throw error;
    }
  }

  /**
   * Copyscape API Integration
   */
  async checkWithCopyscape(content, title) {
    if (!this.copyscapeKey || !this.copyscapeUsername) {
      throw new Error('Copyscape API credentials not configured');
    }

    try {
      const response = await axios.post('https://www.copyscape.com/api/', {
        u: this.copyscapeUsername,
        k: this.copyscapeKey,
        o: 'csearch',
        t: title,
        e: 'UTF-8',
        c: content
      });

      const result = response.data;
      
      return {
        checked: true,
        score: this.calculateScoreFromCopyscape(result),
        wordCount: this.countWords(content),
        matchedSources: this.parseCopyscapeResults(result),
        checkedAt: new Date(),
        provider: 'Copyscape',
        details: {
          totalMatches: result.count || 0,
          queryWords: result.querywords || 0
        }
      };
    } catch (error) {
      console.error('Copyscape API error:', error);
      throw new Error('Copyscape plagiarism check failed: ' + error.message);
    }
  }

  /**
   * Quetext API Integration
   */
  async checkWithQuetext(content, title) {
    if (!this.quetextKey) {
      throw new Error('Quetext API key not configured');
    }

    try {
      const response = await axios.post('https://www.quetext.com/api/v1/check', {
        text: content,
        title: title
      }, {
        headers: {
          'Authorization': `Bearer ${this.quetextKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;
      
      return {
        checked: true,
        score: result.plagiarism_percentage || 0,
        wordCount: this.countWords(content),
        matchedSources: this.parseQuetextResults(result),
        checkedAt: new Date(),
        provider: 'Quetext',
        details: result
      };
    } catch (error) {
      console.error('Quetext API error:', error);
      throw new Error('Quetext plagiarism check failed: ' + error.message);
    }
  }

  /**
   * Mock plagiarism check for development/testing
   */
  async mockPlagiarismCheck(content) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const wordCount = this.countWords(content);
    const mockScore = Math.floor(Math.random() * 25) + 5; // 5-30%

    const mockSources = [
      {
        url: 'https://example.com/article1',
        title: 'Similar Article on Urban Planning',
        matchPercentage: Math.floor(Math.random() * 15) + 5,
        matchedWords: Math.floor(wordCount * 0.1)
      },
      {
        url: 'https://example.com/article2',
        title: 'Related Research Paper',
        matchPercentage: Math.floor(Math.random() * 10) + 3,
        matchedWords: Math.floor(wordCount * 0.05)
      }
    ];

    return {
      checked: true,
      score: mockScore,
      wordCount: wordCount,
      matchedSources: mockScore > 20 ? mockSources : [],
      checkedAt: new Date(),
      provider: 'Mock (Development)',
      details: {
        message: 'This is a mock plagiarism check for development purposes',
        algorithm: 'Random generation'
      }
    };
  }

  /**
   * Helper: Calculate plagiarism score from Copyscape results
   */
  calculateScoreFromCopyscape(result) {
    if (!result.count || result.count === 0) return 0;
    
    // Calculate based on percentage of matched content
    const matches = result.result || [];
    let totalMatchedWords = 0;
    
    matches.forEach(match => {
      totalMatchedWords += match.percentmatched || 0;
    });
    
    return Math.min(Math.round(totalMatchedWords / matches.length), 100);
  }

  /**
   * Helper: Parse Copyscape results into standardized format
   */
  parseCopyscapeResults(result) {
    if (!result.result || result.result.length === 0) return [];
    
    return result.result.map(match => ({
      url: match.url,
      title: match.title,
      matchPercentage: match.percentmatched || 0,
      matchedWords: match.minwordsmatched || 0,
      textSnippet: match.textsnippet || ''
    }));
  }

  /**
   * Helper: Parse Quetext results into standardized format
   */
  parseQuetextResults(result) {
    if (!result.matches || result.matches.length === 0) return [];
    
    return result.matches.map(match => ({
      url: match.url,
      title: match.title || 'Untitled Source',
      matchPercentage: match.percentage || 0,
      matchedWords: match.matched_words || 0,
      textSnippet: match.snippet || ''
    }));
  }

  /**
   * Helper: Strip HTML tags from content
   */
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Helper: Count words in text
   */
  countWords(text) {
    if (!text) return 0;
    const plainText = this.stripHtml(text);
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate plagiarism score against threshold
   */
  isAcceptableScore(score, threshold = 30) {
    return score <= threshold;
  }

  /**
   * Get recommendation based on plagiarism score
   */
  getRecommendation(score) {
    if (score < 10) {
      return {
        status: 'excellent',
        message: 'Excellent! Your content appears to be highly original.',
        action: 'ready_to_publish'
      };
    } else if (score < 20) {
      return {
        status: 'good',
        message: 'Good! Minor similarities detected, but within acceptable range.',
        action: 'ready_to_publish'
      };
    } else if (score < 30) {
      return {
        status: 'moderate',
        message: 'Moderate plagiarism detected. Consider revising highlighted sections.',
        action: 'review_recommended'
      };
    } else {
      return {
        status: 'high',
        message: 'High plagiarism detected. Significant revisions required before publication.',
        action: 'revision_required'
      };
    }
  }

  /**
   * Generate detailed plagiarism report
   */
  generateReport(checkResult) {
    const recommendation = this.getRecommendation(checkResult.score);
    
    return {
      ...checkResult,
      recommendation,
      summary: {
        originalityScore: 100 - checkResult.score,
        plagiarismScore: checkResult.score,
        totalSources: checkResult.matchedSources.length,
        status: recommendation.status
      }
    };
  }
}

export default new PlagiarismService();
