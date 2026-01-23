import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Notification from '../models/Notification.js'
import User from '../models/User.js'

dotenv.config()

/**
 * Script to create sample notifications for testing
 * Usage: node src/scripts/createSampleNotifications.js
 */

const createSampleNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get all users
    const users = await User.find().limit(10)
    
    if (users.length < 2) {
      console.log('Need at least 2 users in database to create sample notifications')
      process.exit(1)
    }

    console.log(`Found ${users.length} users`)

    // Sample notification types and templates
    const notificationTemplates = [
      {
        type: 'connection',
        title: 'New Connection Request',
        getMessage: (sender) => `${sender.profile.firstName} ${sender.profile.lastName} wants to connect with you`,
        link: '/networking-arena?tab=connections&view=requests'
      },
      {
        type: 'connection',
        title: 'Connection Accepted',
        getMessage: (sender) => `${sender.profile.firstName} ${sender.profile.lastName} accepted your connection request`,
        link: '/networking-arena?tab=connections'
      },
      {
        type: 'message',
        title: 'New Message',
        getMessage: (sender) => `${sender.profile.firstName} ${sender.profile.lastName} sent you a message`,
        link: '/networking-arena?messages=true'
      },
      {
        type: 'like',
        title: 'Post Interaction',
        getMessage: (sender) => `${sender.profile.firstName} ${sender.profile.lastName} and others liked your post`,
        link: '/networking-arena?tab=feed'
      },
      {
        type: 'view',
        title: 'Profile View',
        getMessage: () => `Your profile was viewed by 5 people today`,
        link: '/profile'
      },
      {
        type: 'job',
        title: 'Job Opportunity',
        getMessage: () => `New job posting matches your skills: Senior Developer at Tech Corp`,
        link: '/jobs'
      },
      {
        type: 'group',
        title: 'Group Activity',
        getMessage: () => `New discussion in "React Developers" group`,
        link: '/networking-arena?tab=groups'
      },
      {
        type: 'event',
        title: 'Event Reminder',
        getMessage: () => `Tech Conference 2024 starts in 2 days`,
        link: '/networking-arena?tab=events'
      }
    ]

    const notifications = []

    // Create 3-5 notifications for each user
    for (const user of users) {
      const notificationCount = Math.floor(Math.random() * 3) + 3 // 3-5 notifications
      
      for (let i = 0; i < notificationCount; i++) {
        const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)]
        
        // Pick a random sender (different from recipient)
        const potentialSenders = users.filter(u => u._id.toString() !== user._id.toString())
        const sender = template.type === 'view' || template.type === 'system' 
          ? null 
          : potentialSenders[Math.floor(Math.random() * potentialSenders.length)]

        // Random timestamp in the last 3 days
        const createdAt = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
        
        // 70% chance of being unread
        const isRead = Math.random() > 0.7

        notifications.push({
          recipient: user._id,
          sender: sender ? sender._id : null,
          type: template.type,
          title: template.title,
          message: template.getMessage(sender || user),
          link: template.link,
          isRead,
          readAt: isRead ? new Date() : null,
          createdAt
        })
      }
    }

    // Insert all notifications
    await Notification.insertMany(notifications)

    console.log(`✅ Created ${notifications.length} sample notifications`)
    console.log(`📊 Distribution:`)
    
    const distribution = notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1
      return acc
    }, {})
    
    Object.entries(distribution).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })

    const unreadCount = notifications.filter(n => !n.isRead).length
    console.log(`📬 Unread notifications: ${unreadCount}`)

    process.exit(0)
  } catch (error) {
    console.error('Error creating sample notifications:', error)
    process.exit(1)
  }
}

createSampleNotifications()
