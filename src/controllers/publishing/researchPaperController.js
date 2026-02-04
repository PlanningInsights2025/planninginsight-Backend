import ResearchPaper from '../../models/ResearchPaper.js'

// Create a new research paper
export const createResearchPaper = async (req, res) => {
  try {
    console.log('📝 Creating research paper...')
    console.log('User:', req.user)
    console.log('Request body:', req.body)
    
    const userId = req.user.userId || req.user.id || req.user._id
    console.log('Extracted userId:', userId)
    
    const paperData = {
      ...req.body,
      userId: userId,
      lastEditedAt: new Date()
    }

    const paper = new ResearchPaper(paperData)
    await paper.save()

    console.log('✅ Paper saved successfully:', paper._id)

    res.status(201).json({
      success: true,
      message: 'Research paper saved successfully',
      data: { paper }
    })
  } catch (error) {
    console.error('❌ Error creating research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to save research paper',
      error: error.message
    })
  }
}

// Get all research papers for the logged-in user
export const getMyResearchPapers = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id
    const papers = await ResearchPaper.find({ userId: userId })
      .sort({ lastEditedAt: -1 })
      .select('-__v')

    res.json({
      success: true,
      data: { papers, count: papers.length }
    })
  } catch (error) {
    console.error('Error fetching research papers:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research papers',
      error: error.message
    })
  }
}

// Get a single research paper by ID
export const getResearchPaperById = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id
    const paper = await ResearchPaper.findOne({
      _id: req.params.id,
      userId: userId
    })

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found'
      })
    }

    res.json({
      success: true,
      data: { paper }
    })
  } catch (error) {
    console.error('Error fetching research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research paper',
      error: error.message
    })
  }
}

// Update a research paper
export const updateResearchPaper = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      lastEditedAt: new Date()
    }

    const userId = req.user.userId || req.user.id || req.user._id
    const paper = await ResearchPaper.findOneAndUpdate(
      { _id: req.params.id, userId: userId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found'
      })
    }

    res.json({
      success: true,
      message: 'Research paper updated successfully',
      data: { paper }
    })
  } catch (error) {
    console.error('Error updating research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update research paper',
      error: error.message
    })
  }
}

// Delete a research paper
export const deleteResearchPaper = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id
    const paper = await ResearchPaper.findOneAndDelete({
      _id: req.params.id,
      userId: userId
    })

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found'
      })
    }

    res.json({
      success: true,
      message: 'Research paper deleted successfully',
      data: { paper }
    })
  } catch (error) {
    console.error('Error deleting research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete research paper',
      error: error.message
    })
  }
}
