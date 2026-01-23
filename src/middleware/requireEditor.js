/**
 * Middleware to verify if user has Chief Editor role
 */
export const requireChiefEditor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (req.user.role !== 'chiefeditor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Chief Editor role required.'
      })
    }
    
    next()
  } catch (error) {
    console.error('Chief Editor middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message
    })
  }
}

/**
 * Middleware to verify if user has Editor role
 */
export const requireEditor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (req.user.role !== 'editor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Editor role required.'
      })
    }
    
    next()
  } catch (error) {
    console.error('Editor middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message
    })
  }
}

/**
 * Middleware to verify if user has either Chief Editor or Editor role
 */
export const requireEditorOrChiefEditor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (!['editor', 'chiefeditor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Editor or Chief Editor role required.'
      })
    }
    
    next()
  } catch (error) {
    console.error('Editor authorization middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message
    })
  }
}
