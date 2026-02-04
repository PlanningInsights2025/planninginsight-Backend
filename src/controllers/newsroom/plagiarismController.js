import plagiarismService from '../../services/plagiarism/plagiarismService.js';

/**
 * Check content for plagiarism
 */
export const checkPlagiarism = async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for plagiarism check'
      });
    }

    console.log('=== PLAGIARISM CHECK STARTED ===');
    console.log('Content length:', content.length);
    console.log('Title:', title);
    console.log('User:', req.user?.email);

    // Check plagiarism using the service
    const result = await plagiarismService.checkPlagiarism(content, title);
    
    // Generate detailed report
    const report = plagiarismService.generateReport(result);

    console.log('=== PLAGIARISM CHECK COMPLETED ===');
    console.log('Score:', report.score);
    console.log('Status:', report.recommendation.status);
    console.log('Sources found:', report.matchedSources.length);

    res.status(200).json({
      success: true,
      message: 'Plagiarism check completed successfully',
      data: report
    });
  } catch (error) {
    console.error('Plagiarism check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Plagiarism check failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get plagiarism check history for a user
 */
export const getPlagiarismHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    
    // Get all articles by this user with plagiarism reports
    const Article = (await import('../../models/Article.js')).default;
    
    const articles = await Article.find({
      author: userId,
      'plagiarismReport.checked': true
    })
    .select('title plagiarismReport createdAt')
    .sort({ createdAt: -1 })
    .limit(20);

    res.status(200).json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    console.error('Get plagiarism history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plagiarism history'
    });
  }
};

/**
 * Get plagiarism statistics for admin
 */
export const getPlagiarismStats = async (req, res) => {
  try {
    const Article = (await import('../../models/Article.js')).default;
    
    // Get statistics
    const totalChecked = await Article.countDocuments({ 'plagiarismReport.checked': true });
    const highPlagiarism = await Article.countDocuments({ 'plagiarismReport.score': { $gte: 30 } });
    const moderatePlagiarism = await Article.countDocuments({ 
      'plagiarismReport.score': { $gte: 20, $lt: 30 } 
    });
    const lowPlagiarism = await Article.countDocuments({ 'plagiarismReport.score': { $lt: 20 } });

    // Get recent checks
    const recentChecks = await Article.find({ 'plagiarismReport.checked': true })
      .select('title author plagiarismReport createdAt')
      .populate('author', 'email profile')
      .sort({ 'plagiarismReport.checkedAt': -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalChecked,
          highPlagiarism,
          moderatePlagiarism,
          lowPlagiarism,
          acceptableRate: totalChecked > 0 
            ? Math.round(((lowPlagiarism + moderatePlagiarism) / totalChecked) * 100) 
            : 0
        },
        recentChecks
      }
    });
  } catch (error) {
    console.error('Get plagiarism stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plagiarism statistics'
    });
  }
};
