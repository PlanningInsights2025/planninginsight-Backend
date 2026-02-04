import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let userToken = '';
let adminToken = '';
let createdForumId = '';
let createdQuestionId = '';
let createdAnswerId = '';

// Test users (update with your actual credentials)
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'Test@123'
};

const ADMIN_USER = {
  email: 'admin@planning-insights.com',
  password: 'Admin@123'
};

// Helper function to make requests
async function request(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n=== Testing Authentication ===');

  // Login as user
  console.log('\n1. Login as regular user...');
  const userLogin = await request('POST', '/auth/login', TEST_USER);
  if (userLogin.success) {
    userToken = userLogin.data.token;
    console.log('✓ User login successful');
  } else {
    console.log('✗ User login failed:', userLogin.error);
  }

  // Login as admin
  console.log('\n2. Login as admin...');
  const adminLogin = await request('POST', '/auth/login', ADMIN_USER);
  if (adminLogin.success) {
    adminToken = adminLogin.data.token;
    console.log('✓ Admin login successful');
  } else {
    console.log('✗ Admin login failed:', adminLogin.error);
  }
}

async function testForumCreation() {
  console.log('\n=== Testing Forum Creation ===');

  const forumData = {
    title: `Test Forum ${Date.now()}`,
    description: 'This is a test forum for automated testing'
  };

  console.log('\n1. Creating forum as user...');
  const createResult = await request('POST', '/forum/create', forumData, userToken);
  if (createResult.success) {
    createdForumId = createResult.data.data._id;
    console.log('✓ Forum created:', createdForumId);
    console.log('  Status:', createResult.data.data.status);
  } else {
    console.log('✗ Forum creation failed:', createResult.error);
  }
}

async function testForumApproval() {
  console.log('\n=== Testing Forum Approval ===');

  if (!createdForumId) {
    console.log('✗ No forum to approve (creation failed)');
    return;
  }

  console.log('\n1. Getting pending forums...');
  const pending = await request('GET', '/admin/forum/forums/pending', null, adminToken);
  if (pending.success) {
    console.log('✓ Retrieved pending forums:', pending.data.data.length);
  } else {
    console.log('✗ Failed to get pending forums:', pending.error);
  }

  console.log('\n2. Approving forum...');
  const approve = await request('PUT', `/admin/forum/forum/${createdForumId}/approve`, null, adminToken);
  if (approve.success) {
    console.log('✓ Forum approved successfully');
  } else {
    console.log('✗ Forum approval failed:', approve.error);
  }
}

async function testQuestionCreation() {
  console.log('\n=== Testing Question Creation ===');

  if (!createdForumId) {
    console.log('✗ No forum available for question');
    return;
  }

  const questionData = {
    title: 'What are the best practices for sustainable urban development?',
    content: 'I am looking for insights on how to implement sustainable practices in urban planning projects.',
    isAnonymous: false
  };

  console.log('\n1. Creating question...');
  const createResult = await request('POST', `/forum/${createdForumId}/question`, questionData, userToken);
  if (createResult.success) {
    createdQuestionId = createResult.data.data._id;
    console.log('✓ Question created:', createdQuestionId);
  } else {
    console.log('✗ Question creation failed:', createResult.error);
  }

  // Test duplicate detection
  console.log('\n2. Testing duplicate detection...');
  const suggestions = await request('GET', `/forum/question/suggestions?query=sustainable%20urban&forumId=${createdForumId}`);
  if (suggestions.success) {
    console.log('✓ Suggestions retrieved:', suggestions.data.data.length);
  } else {
    console.log('✗ Suggestions failed:', suggestions.error);
  }
}

async function testAnswerCreation() {
  console.log('\n=== Testing Answer Creation ===');

  if (!createdQuestionId) {
    console.log('✗ No question available for answer');
    return;
  }

  const answerData = {
    content: 'Sustainable urban development requires a multi-faceted approach including green infrastructure, public transportation, and community engagement.',
    isAnonymous: false
  };

  console.log('\n1. Creating answer...');
  const createResult = await request('POST', `/forum/question/${createdQuestionId}/answer`, answerData, userToken);
  if (createResult.success) {
    createdAnswerId = createResult.data.data._id;
    console.log('✓ Answer created:', createdAnswerId);
  } else {
    console.log('✗ Answer creation failed:', createResult.error);
  }
}

async function testReactions() {
  console.log('\n=== Testing Reactions ===');

  if (createdQuestionId) {
    console.log('\n1. Reacting to question...');
    const reactQuestion = await request('POST', `/forum/question/${createdQuestionId}/react`, { type: 'like' }, userToken);
    if (reactQuestion.success) {
      console.log('✓ Question reaction successful');
    } else {
      console.log('✗ Question reaction failed:', reactQuestion.error);
    }
  }

  if (createdAnswerId) {
    console.log('\n2. Reacting to answer...');
    const reactAnswer = await request('POST', `/forum/answer/${createdAnswerId}/react`, { type: 'like' }, userToken);
    if (reactAnswer.success) {
      console.log('✓ Answer reaction successful');
    } else {
      console.log('✗ Answer reaction failed:', reactAnswer.error);
    }
  }
}

async function testFollowSystem() {
  console.log('\n=== Testing Follow System ===');

  if (createdForumId) {
    console.log('\n1. Following forum...');
    const followForum = await request('POST', `/forum/${createdForumId}/follow`, null, userToken);
    if (followForum.success) {
      console.log('✓ Forum followed successfully');
    } else {
      console.log('✗ Forum follow failed:', followForum.error);
    }
  }

  if (createdQuestionId) {
    console.log('\n2. Following question...');
    const followQuestion = await request('POST', `/forum/question/${createdQuestionId}/follow`, null, userToken);
    if (followQuestion.success) {
      console.log('✓ Question followed successfully');
    } else {
      console.log('✗ Question follow failed:', followQuestion.error);
    }
  }
}

async function testModeration() {
  console.log('\n=== Testing Moderation ===');

  if (!createdQuestionId) {
    console.log('✗ No content to flag');
    return;
  }

  const flagData = {
    contentType: 'question',
    contentId: createdQuestionId,
    reason: 'other',
    additionalDetails: 'This is a test flag for automated testing'
  };

  console.log('\n1. Flagging content...');
  const flagResult = await request('POST', '/forum/flag', flagData, userToken);
  if (flagResult.success) {
    console.log('✓ Content flagged successfully');
    const flagId = flagResult.data.data._id;

    // Admin views flags
    console.log('\n2. Getting flagged content (admin)...');
    const getFlags = await request('GET', '/admin/forum/flags', null, adminToken);
    if (getFlags.success) {
      console.log('✓ Retrieved flags:', getFlags.data.data.length);
    } else {
      console.log('✗ Failed to get flags:', getFlags.error);
    }

    // Resolve flag
    console.log('\n3. Resolving flag...');
    const resolveData = {
      action: 'dismiss',
      adminNotes: 'Test flag - no action needed'
    };
    const resolve = await request('POST', `/admin/forum/flag/${flagId}/resolve`, resolveData, adminToken);
    if (resolve.success) {
      console.log('✓ Flag resolved successfully');
    } else {
      console.log('✗ Flag resolution failed:', resolve.error);
    }
  } else {
    console.log('✗ Content flagging failed:', flagResult.error);
  }
}

async function testPollSystem() {
  console.log('\n=== Testing Poll System ===');

  const pollData = {
    question: 'Which urban planning topic interests you most?',
    options: [
      'Sustainable Development',
      'Transportation Planning',
      'Housing Policy',
      'Public Spaces'
    ],
    allowMultipleVotes: false,
    forumId: createdForumId,
    isPinned: true
  };

  console.log('\n1. Creating poll (admin)...');
  const createPoll = await request('POST', '/admin/forum/poll/create', pollData, adminToken);
  if (createPoll.success) {
    const pollId = createPoll.data.data._id;
    console.log('✓ Poll created:', pollId);

    // Vote on poll
    console.log('\n2. Voting on poll...');
    const vote = await request('POST', `/forum/poll/${pollId}/vote`, { optionIndexes: [0] }, userToken);
    if (vote.success) {
      console.log('✓ Vote recorded successfully');
    } else {
      console.log('✗ Vote failed:', vote.error);
    }

    // Get analytics
    console.log('\n3. Getting poll analytics...');
    const analytics = await request('GET', `/admin/forum/poll/${pollId}/analytics`, null, adminToken);
    if (analytics.success) {
      console.log('✓ Analytics retrieved');
      console.log('  Total votes:', analytics.data.data.totalVotes);
    } else {
      console.log('✗ Analytics failed:', analytics.error);
    }
  } else {
    console.log('✗ Poll creation failed:', createPoll.error);
  }
}

async function testGetOperations() {
  console.log('\n=== Testing GET Operations ===');

  console.log('\n1. Getting all forums...');
  const forums = await request('GET', '/forum/list');
  if (forums.success) {
    console.log('✓ Forums retrieved:', forums.data.data.length);
  } else {
    console.log('✗ Forums retrieval failed:', forums.error);
  }

  console.log('\n2. Getting trending forums...');
  const trending = await request('GET', '/forum/trending?limit=5');
  if (trending.success) {
    console.log('✓ Trending forums retrieved:', trending.data.data.length);
  } else {
    console.log('✗ Trending forums failed:', trending.error);
  }

  if (createdForumId) {
    console.log('\n3. Getting forum questions...');
    const questions = await request('GET', `/forum/${createdForumId}/questions`);
    if (questions.success) {
      console.log('✓ Questions retrieved:', questions.data.data.length);
    } else {
      console.log('✗ Questions retrieval failed:', questions.error);
    }
  }

  if (createdQuestionId) {
    console.log('\n4. Getting question answers...');
    const answers = await request('GET', `/forum/question/${createdQuestionId}/answers`);
    if (answers.success) {
      console.log('✓ Answers retrieved:', answers.data.data.length);
    } else {
      console.log('✗ Answers retrieval failed:', answers.error);
    }
  }
}

// Main test runner
async function runTests() {
  console.log('=================================================');
  console.log('  DISCUSSION FORUM BACKEND API TEST SUITE');
  console.log('=================================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    await testAuthentication();
    await testForumCreation();
    await testForumApproval();
    await testQuestionCreation();
    await testAnswerCreation();
    await testReactions();
    await testFollowSystem();
    await testModeration();
    await testPollSystem();
    await testGetOperations();

    console.log('\n=================================================');
    console.log('  TEST SUITE COMPLETED');
    console.log('=================================================');
    console.log(`Finished at: ${new Date().toISOString()}`);
    console.log('\nCreated Resources:');
    console.log(`  Forum ID: ${createdForumId || 'N/A'}`);
    console.log(`  Question ID: ${createdQuestionId || 'N/A'}`);
    console.log(`  Answer ID: ${createdAnswerId || 'N/A'}`);
  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
  }
}

// Run the tests
runTests();
