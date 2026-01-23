/**
 * Email Service
 * Handles sending emails using nodemailer
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
let transporter = null;

// Only create transporter if credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('✓ Email transporter configured successfully');
  } catch (error) {
    console.warn('⚠ Email transporter configuration failed:', error.message);
    transporter = null;
  }
} else {
  console.log('⚠ Email service not configured (SMTP credentials missing). Emails will be logged only.');
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // If email is not configured, log instead of sending
    if (!transporter || !process.env.SMTP_USER) {
      console.log('Email would be sent (transporter not configured):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html.substring(0, 100)}...`);
      return { success: true, message: 'Email logged (not configured)' };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error, just log it to prevent system failures
    return { success: false, error: error.message };
  }
};

/**
 * Send forum-related emails
 */

export const sendForumApprovalEmail = async (userEmail, forumTitle) => {
  const html = `
    <h2>Forum Approved!</h2>
    <p>Great news! Your forum "<strong>${forumTitle}</strong>" has been approved by our admin team.</p>
    <p>Your forum is now live and community members can start discussions.</p>
    <p>Thank you for contributing to the Planning Insights community!</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Your Forum "${forumTitle}" Has Been Approved`,
    html
  });
};

export const sendForumRejectionEmail = async (userEmail, forumTitle, reason) => {
  const html = `
    <h2>Forum Application Update</h2>
    <p>Thank you for submitting your forum "<strong>${forumTitle}</strong>".</p>
    <p>Unfortunately, we cannot approve it at this time for the following reason:</p>
    <blockquote style="border-left: 4px solid #ef4444; padding-left: 1rem; color: #64748b;">
      ${reason}
    </blockquote>
    <p>You're welcome to create a new forum or join existing forums on our platform.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Update on Your Forum Submission "${forumTitle}"`,
    html
  });
};

export const sendNewQuestionEmail = async (userEmail, forumTitle, questionTitle, questionUrl) => {
  const html = `
    <h2>New Question in ${forumTitle}</h2>
    <p>A new question has been posted in a forum you're following:</p>
    <h3>${questionTitle}</h3>
    <p><a href="${questionUrl}" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; display: inline-block;">View Question</a></p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `New Question in ${forumTitle}`,
    html
  });
};

export const sendNewAnswerEmail = async (userEmail, questionTitle, answerPreview, questionUrl) => {
  const html = `
    <h2>New Answer to Your Question</h2>
    <p>Someone answered your question: "<strong>${questionTitle}</strong>"</p>
    <div style="background: #f8fafc; padding: 1rem; border-left: 4px solid #3b82f6; margin: 1rem 0;">
      ${answerPreview}
    </div>
    <p><a href="${questionUrl}" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; display: inline-block;">View Answer</a></p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `New Answer to Your Question`,
    html
  });
};

export const sendBestAnswerEmail = async (userEmail, questionTitle, questionUrl) => {
  const html = `
    <h2>🎉 Your Answer Was Marked as Best!</h2>
    <p>Congratulations! Your answer to "<strong>${questionTitle}</strong>" has been marked as the best answer.</p>
    <p>Thank you for providing valuable insights to the community!</p>
    <p><a href="${questionUrl}" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; display: inline-block;">View Question</a></p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: '🎉 Your Answer Was Marked as Best!',
    html
  });
};

export const sendFlagResolutionEmail = async (userEmail, contentType, action, adminNotes) => {
  const html = `
    <h2>Content Flag Resolution</h2>
    <p>Your flagged ${contentType} has been reviewed by our moderation team.</p>
    <p><strong>Action Taken:</strong> ${action === 'remove' ? 'Content Removed' : 'Flag Dismissed'}</p>
    ${adminNotes ? `
      <p><strong>Admin Notes:</strong></p>
      <blockquote style="border-left: 4px solid #3b82f6; padding-left: 1rem; color: #64748b;">
        ${adminNotes}
      </blockquote>
    ` : ''}
    ${action === 'remove' ? `
      <p>You have 3 days to appeal this decision if you believe it was made in error.</p>
    ` : ''}
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Content Flag Resolution',
    html
  });
};

export const sendAppealDecisionEmail = async (userEmail, decision, adminNotes) => {
  const html = `
    <h2>Appeal Decision</h2>
    <p>Your appeal has been reviewed. The decision is: <strong>${decision === 'uphold' ? 'Upheld' : 'Overturned'}</strong></p>
    ${decision === 'uphold' ? `
      <p>After careful review, we have decided to uphold the original moderation action.</p>
    ` : `
      <p>After careful review, we have overturned the original decision. Your content has been restored.</p>
    `}
    ${adminNotes ? `
      <p><strong>Admin Notes:</strong></p>
      <blockquote style="border-left: 4px solid #3b82f6; padding-left: 1rem; color: #64748b;">
        ${adminNotes}
      </blockquote>
    ` : ''}
    <p>This decision is final.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Appeal Decision',
    html
  });
};

export default {
  sendEmail,
  sendForumApprovalEmail,
  sendForumRejectionEmail,
  sendNewQuestionEmail,
  sendNewAnswerEmail,
  sendBestAnswerEmail,
  sendFlagResolutionEmail,
  sendAppealDecisionEmail
};
