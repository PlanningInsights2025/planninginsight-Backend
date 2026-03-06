import { google } from 'googleapis'
import fs from 'fs'

const CACHE_TTL_MS = 30 * 1000
const cache = new Map()

const PERIOD_RANGE_MAP = {
  '24h': { startDate: '1daysAgo', endDate: 'today' },
  '7d': { startDate: '7daysAgo', endDate: 'today' },
  '30d': { startDate: '30daysAgo', endDate: 'today' },
  '90d': { startDate: '90daysAgo', endDate: 'today' }
}

const emptyRealtime = {
  activeUsers: 0,
  pageViews: 0,
  eventCount: 0,
  devices: [],
  countries: []
}

const emptyOverview = {
  period: '7d',
  totals: {
    users: 0,
    newUsers: 0,
    sessions: 0,
    pageViews: 0,
    eventCount: 0
  },
  trends: [],
  topPages: [],
  channels: [],
  devices: [],
  countries: []
}

const parseServiceAccount = () => {
  const raw = process.env.GA_SERVICE_ACCOUNT_KEY
  const encoded = process.env.GA_SERVICE_ACCOUNT_KEY_BASE64
  const credentialsFile = process.env.GA_SERVICE_ACCOUNT_FILE
  const serviceEmail = process.env.GA_SERVICE_ACCOUNT_EMAIL
  const privateKeyFromEnv = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY
  let parsed

  if (credentialsFile && fs.existsSync(credentialsFile)) {
    const fromFile = fs.readFileSync(credentialsFile, 'utf-8')
    parsed = JSON.parse(fromFile)
  } else if (encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    parsed = JSON.parse(decoded)
  } else if (raw) {
    parsed = JSON.parse(raw)
  } else if (serviceEmail && privateKeyFromEnv) {
    parsed = {
      client_email: serviceEmail,
      private_key: privateKeyFromEnv
    }
  } else {
    throw new Error('GA service account key not configured')
  }

  if (parsed?.private_key) {
    parsed.private_key = String(parsed.private_key)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\r\n/g, '\n')
  }

  const normalizedKey = String(parsed?.private_key || '')
  const keyLooksValid = normalizedKey.includes('BEGIN PRIVATE KEY') &&
    normalizedKey.includes('END PRIVATE KEY') &&
    normalizedKey.length > 200

  if (!keyLooksValid) {
    throw new Error('GA service account private key appears invalid or truncated')
  }

  return parsed
}

const getAnalyticsClient = () => {
  const credentials = parseServiceAccount()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  })

  return google.analyticsdata({ version: 'v1beta', auth })
}

const getPropertyId = () => {
  const propertyId = process.env.GA_PROPERTY_ID

  if (!propertyId) {
    throw new Error('GA_PROPERTY_ID is not configured')
  }

  return propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`
}

const getRange = (period = '7d') => PERIOD_RANGE_MAP[period] || PERIOD_RANGE_MAP['7d']

const getCache = (key) => {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }

  return cached.value
}

const setCache = (key, value) => {
  cache.set(key, { timestamp: Date.now(), value })
}

const addStreamDimensionFilter = (requestBody, streamId) => {
  if (!streamId) return requestBody

  return {
    ...requestBody,
    dimensionFilter: {
      filter: {
        fieldName: 'streamId',
        stringFilter: { value: String(streamId), matchType: 'EXACT' }
      }
    }
  }
}

const safeMetricValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const mapRows = (rows = [], dimensionNames = [], metricNames = []) => {
  return rows.map(row => {
    const record = {}

    dimensionNames.forEach((name, index) => {
      record[name] = row.dimensionValues?.[index]?.value || ''
    })

    metricNames.forEach((name, index) => {
      record[name] = safeMetricValue(row.metricValues?.[index]?.value)
    })

    return record
  })
}

const runRealtimeReport = async (analyticsClient, property, requestBody, streamId) => {
  try {
    return await analyticsClient.properties.runRealtimeReport({
      property,
      requestBody: addStreamDimensionFilter(requestBody, streamId)
    })
  } catch (error) {
    if (!streamId) throw error

    return analyticsClient.properties.runRealtimeReport({
      property,
      requestBody
    })
  }
}

const runOverviewReport = async (analyticsClient, property, requestBody, streamId) => {
  try {
    return await analyticsClient.properties.runReport({
      property,
      requestBody: addStreamDimensionFilter(requestBody, streamId)
    })
  } catch (error) {
    if (!streamId) throw error

    return analyticsClient.properties.runReport({
      property,
      requestBody
    })
  }
}

export const isGoogleAnalyticsConfigured = () => {
  const hasFile = Boolean(process.env.GA_SERVICE_ACCOUNT_FILE && fs.existsSync(process.env.GA_SERVICE_ACCOUNT_FILE))
  const hasInlineJson = Boolean(process.env.GA_SERVICE_ACCOUNT_KEY)
  const hasBase64 = Boolean(process.env.GA_SERVICE_ACCOUNT_KEY_BASE64)
  const hasEmailAndKey = Boolean(process.env.GA_SERVICE_ACCOUNT_EMAIL && process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY)

  return Boolean(
    process.env.GA_PROPERTY_ID &&
    (hasFile || hasInlineJson || hasBase64 || hasEmailAndKey)
  )
}

export const getRealtimeWebsiteAnalytics = async ({ streamId = process.env.GA_PUBLIC_STREAM_ID } = {}) => {
  const cacheKey = `realtime:${streamId || 'all'}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  if (!isGoogleAnalyticsConfigured()) {
    const fallback = { configured: false, ...emptyRealtime }
    setCache(cacheKey, fallback)
    return fallback
  }

  try {
    const analyticsClient = getAnalyticsClient()
    const property = getPropertyId()

    const [totalsResponse, devicesResponse, countriesResponse] = await Promise.all([
      runRealtimeReport(
        analyticsClient,
        property,
        {
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'eventCount' }]
        },
        streamId
      ),
      runRealtimeReport(
        analyticsClient,
        property,
        {
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 5
        },
        streamId
      ),
      runRealtimeReport(
        analyticsClient,
        property,
        {
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 5
        },
        streamId
      )
    ])

    const totals = totalsResponse.data.rows?.[0]
    const realtimeData = {
      configured: true,
      activeUsers: safeMetricValue(totals?.metricValues?.[0]?.value),
      pageViews: safeMetricValue(totals?.metricValues?.[1]?.value),
      eventCount: safeMetricValue(totals?.metricValues?.[2]?.value),
      devices: mapRows(devicesResponse.data.rows, ['deviceCategory'], ['activeUsers']),
      countries: mapRows(countriesResponse.data.rows, ['country'], ['activeUsers'])
    }

    setCache(cacheKey, realtimeData)
    return realtimeData
  } catch (error) {
    console.error('GA realtime analytics fallback triggered:', error.message)
    const fallback = { configured: false, ...emptyRealtime }
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getOverviewWebsiteAnalytics = async ({
  period = '7d',
  streamId = process.env.GA_PUBLIC_STREAM_ID
} = {}) => {
  const cacheKey = `overview:${period}:${streamId || 'all'}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  if (!isGoogleAnalyticsConfigured()) {
    const fallback = {
      configured: false,
      ...emptyOverview,
      period
    }
    setCache(cacheKey, fallback)
    return fallback
  }

  try {
    const analyticsClient = getAnalyticsClient()
    const property = getPropertyId()
    const { startDate, endDate } = getRange(period)

    const [totalsReport, trendsReport, pagesReport, channelReport, deviceReport, countryReport] = await Promise.all([
      runOverviewReport(
        analyticsClient,
        property,
        {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'eventCount' }
          ]
        }
        // no streamId filter — session-based metrics aggregate correctly at property level
      ),
      runOverviewReport(
        analyticsClient,
        property,
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
          limit: 120
        }
        // no streamId filter — sessionDefault/date groupings fail with stream filters
      ),
      runOverviewReport(
        analyticsClient,
        property,
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10
        }
        // no streamId filter for consistency
      ),
      runOverviewReport(
        analyticsClient,
        property,
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10
        }
        // no streamId filter — sessionDefaultChannelGroup is session-scoped
      ),
      runOverviewReport(
        analyticsClient,
        property,
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 10
        }
      ),
      runOverviewReport(
        analyticsClient,
        property,
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 10
        }
      )
    ])

    const totals = totalsReport.data.rows?.[0]

    const overview = {
      configured: true,
      period,
      totals: {
        users: safeMetricValue(totals?.metricValues?.[0]?.value),
        newUsers: safeMetricValue(totals?.metricValues?.[1]?.value),
        sessions: safeMetricValue(totals?.metricValues?.[2]?.value),
        pageViews: safeMetricValue(totals?.metricValues?.[3]?.value),
        eventCount: safeMetricValue(totals?.metricValues?.[4]?.value)
      },
      trends: mapRows(trendsReport.data.rows, ['date'], ['activeUsers', 'sessions', 'screenPageViews']),
      topPages: mapRows(pagesReport.data.rows, ['pagePath'], ['screenPageViews', 'activeUsers']),
      channels: mapRows(channelReport.data.rows, ['sessionDefaultChannelGroup'], ['sessions', 'activeUsers']),
      devices: mapRows(deviceReport.data.rows, ['deviceCategory'], ['activeUsers']),
      countries: mapRows(countryReport.data.rows, ['country'], ['activeUsers'])
    }

    setCache(cacheKey, overview)
    return overview
  } catch (error) {
    console.error('GA overview analytics fallback triggered:', error.message)
    const fallback = {
      configured: false,
      ...emptyOverview,
      period
    }
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getCombinedAnalytics = async ({
  period = '7d',
  streamId = process.env.GA_PUBLIC_STREAM_ID
} = {}) => {
  const [realtime, overview] = await Promise.all([
    getRealtimeWebsiteAnalytics({ streamId }),
    getOverviewWebsiteAnalytics({ period, streamId })
  ])

  const userGrowth = (overview.trends || []).map(item => ({
    _id: item.date,
    count: item.activeUsers
  }))

  const websiteAnalytics = {
    realtime,
    overview,
    configured: realtime.configured || overview.configured
  }

  return {
    website: websiteAnalytics,
    userGrowth,
    jobApplications: [],
    popularCategories: []
  }
}
