const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/server');

const PORT = 5099;
let server;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('--- Starting AI Study Buddy Automated Comprehensive Test Suite ---');
  server = app.listen(PORT);

  // Wait a moment for DB connection
  await new Promise((r) => setTimeout(r, 1000));

  try {
    // 1. Health Endpoint Test
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthRes.data.status === 'online', 'Health status is "online"');
    assert(healthRes.data.app === 'AI Study Buddy', 'Health app name is "AI Study Buddy"');

    // 2. Auth: Register Student
    const testEmail1 = `student_${Date.now()}@example.com`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Alex Johnson',
      email: testEmail1,
      password: 'password123',
    });
    assert(regRes.status === 201, 'User registration succeeds with HTTP 201');
    assert(regRes.data.success === true, 'Registration reports success: true');
    assert(regRes.data.data.token, 'Registration returns JWT token');
    assert(regRes.data.data.user.role === 'student', 'User role defaults to "student"');
    const token1 = regRes.data.data.token;
    const userId1 = regRes.data.data.user.id;

    // 3. Auth: Duplicate Email Rejection
    const dupRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Duplicate Alex',
      email: testEmail1,
      password: 'password123',
    });
    assert(dupRes.status === 400, 'Duplicate registration correctly rejected with HTTP 400');

    // 4. Auth: Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: testEmail1,
      password: 'password123',
    });
    assert(loginRes.status === 200, 'User login succeeds with HTTP 200');
    assert(loginRes.data.data.token, 'Login returns JWT token');

    // Wrong password login
    const wrongLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: testEmail1,
      password: 'wrongpassword',
    });
    assert(wrongLoginRes.status === 401, 'Wrong password login rejected with HTTP 401');

    // 5. Auth: Get Current Profile
    const meRes = await makeRequest('GET', '/api/auth/me', null, token1);
    assert(meRes.status === 200, 'GET /api/auth/me returns HTTP 200');
    assert(meRes.data.data.user.email === testEmail1, 'Profile returns correct email');

    // 6. Subjects Module: CRUD
    const createSubjRes = await makeRequest(
      'POST',
      '/api/subjects',
      {
        name: 'Cloud Computing',
        description: 'Distributed architectures, virtualization, and containerization',
        icon: '🌐',
        color: '#0284c7',
      },
      token1
    );
    assert(createSubjRes.status === 201, 'Create Subject returns HTTP 201');
    const createdSubj = createSubjRes.data.data;
    assert(createdSubj.name === 'Cloud Computing', 'Subject created with correct name');
    const subjectId = createdSubj._id;

    // Update Subject
    const updateSubjRes = await makeRequest(
      'PUT',
      `/api/subjects/${subjectId}`,
      {
        name: 'Cloud & Distributed Computing',
        description: 'Updated Cloud syllabus',
        icon: '🌐',
        color: '#0284c7',
      },
      token1
    );
    assert(updateSubjRes.status === 200, 'Update Subject returns HTTP 200');
    assert(updateSubjRes.data.data.name === 'Cloud & Distributed Computing', 'Subject name updated');

    // 7. Study Materials: Create
    const createMatRes = await makeRequest(
      'POST',
      '/api/materials',
      {
        title: 'TCP/IP Protocol Suite Overview',
        subject: 'Computer Networks',
        content:
          'TCP/IP is the foundational suite of communication protocols used to interconnect network devices on the internet. It consists of four abstraction layers: Link Layer, Internet Layer (IP), Transport Layer (TCP and UDP), and Application Layer (HTTP, DNS, FTP). TCP provides reliable, ordered, and error-checked delivery of a stream of octets, whereas UDP provides a simpler, connectionless transmission.',
      },
      token1
    );
    assert(createMatRes.status === 201, 'Create Study Material returns HTTP 201');
    const materialId = createMatRes.data.data._id;
    assert(materialId, 'Study material has valid _id');

    // Create a second material linked to DBMS
    const mat2Res = await makeRequest(
      'POST',
      '/api/materials',
      {
        title: 'ACID Transactions & WAL',
        subject: 'Database Management Systems',
        content:
          'A transaction is a single logical unit of work. To maintain integrity, transactions must satisfy ACID properties: Atomicity, Consistency, Isolation, and Durability. Durability is achieved using Write-Ahead Logging.',
      },
      token1
    );
    assert(mat2Res.status === 201, 'Create DBMS Material returns HTTP 201');

    // 8. Study Materials: Get All, Search & Filter
    const allMatRes = await makeRequest('GET', '/api/materials', null, token1);
    assert(allMatRes.status === 200, 'GET /api/materials returns HTTP 200');
    assert(allMatRes.data.data.length >= 2, 'Returns uploaded materials');

    const searchMatRes = await makeRequest('GET', '/api/materials?search=Transactions', null, token1);
    assert(searchMatRes.data.data.length === 1, 'Search query correctly filters materials');

    const filterMatRes = await makeRequest('GET', '/api/materials?subject=Computer%20Networks', null, token1);
    assert(filterMatRes.data.data.length === 1, 'Subject filter correctly narrows materials');

    // 9. User Isolation: Register second user and verify separation
    const testEmail2 = `student2_${Date.now()}@example.com`;
    const regRes2 = await makeRequest('POST', '/api/auth/register', {
      name: 'Maria Garcia',
      email: testEmail2,
      password: 'password456',
    });
    const token2 = regRes2.data.data.token;

    const user2Mats = await makeRequest('GET', '/api/materials', null, token2);
    assert(user2Mats.data.data.length === 0, 'User 2 cannot see User 1 materials');

    const user2AccessRes = await makeRequest('GET', `/api/materials/${materialId}`, null, token2);
    assert(user2AccessRes.status === 404, 'User 2 forbidden from accessing User 1 material by ID');

    // 10. AI Summary: Generate & Save with structured sections
    const sumRes = await makeRequest(
      'POST',
      '/api/summaries',
      {
        materialId,
      },
      token1
    );
    assert(sumRes.status === 201, 'Generate summary returns HTTP 201');
    assert(sumRes.data.data.summary, 'Summary contains generated content');
    const summaryId = sumRes.data.data._id;

    const getSumsRes = await makeRequest('GET', '/api/summaries', null, token1);
    assert(getSumsRes.data.data.length >= 1, 'GET /api/summaries returns list');

    // 11. AI Flashcards: Generate, Save, & Study Tracking
    const fcRes = await makeRequest(
      'POST',
      '/api/flashcards',
      {
        materialId,
        count: 4,
      },
      token1
    );
    assert(fcRes.status === 201, 'Generate flashcards returns HTTP 201');
    assert(fcRes.data.data.length >= 3, 'Returns array of flashcards');
    assert(fcRes.data.data[0].question && fcRes.data.data[0].answer, 'Flashcards have question & answer');
    const firstFcId = fcRes.data.data[0]._id;

    // Toggle flashcard study status
    const studyRes = await makeRequest('PATCH', `/api/flashcards/${firstFcId}/study`, {}, token1);
    assert(studyRes.status === 200, 'Toggle flashcard study status returns HTTP 200');
    assert(studyRes.data.data.isStudied === true, 'Flashcard isStudied toggled to true');
    assert(studyRes.data.data.studyCount >= 1, 'Flashcard studyCount incremented');

    // 12. AI Quiz: Generate, Submit & Retrieve Attempts History
    const quizRes = await makeRequest(
      'POST',
      '/api/quizzes',
      {
        materialId,
        count: 3,
      },
      token1
    );
    assert(quizRes.status === 201, 'Generate quiz returns HTTP 201');
    const quiz = quizRes.data.data;
    assert(quiz.questions.length >= 3, 'Quiz contains generated questions');

    // Submit answers
    const answers = {};
    answers[0] = quiz.questions[0].answer;
    answers[1] = 'Definitely Wrong Answer XYZ';

    const submitRes = await makeRequest(
      'POST',
      `/api/quizzes/${quiz._id}/submit`,
      { answers },
      token1
    );
    assert(submitRes.status === 200, 'Quiz submission returns HTTP 200');
    assert(submitRes.data.data.totalQuestions >= 3, 'Submit response includes total questions');
    assert(submitRes.data.data.correct >= 1, 'Submit correctly recognized right answer');
    assert(typeof submitRes.data.data.percentage === 'number', 'Submit calculated percentage');

    // Verify Quiz Attempts History endpoint
    const historyRes = await makeRequest('GET', '/api/quizzes/attempts/history', null, token1);
    assert(historyRes.status === 200, 'GET /api/quizzes/attempts/history returns HTTP 200');
    assert(historyRes.data.data.length >= 1, 'Quiz attempts history records saved attempt');
    assert(historyRes.data.data[0].score !== undefined, 'Attempt record contains score');

    // 13. AI Study Plan & Tasks: Schedule Task, Get Today Tasks & Toggle
    const planRes = await makeRequest(
      'POST',
      '/api/study-plans',
      {
        subject: 'Computer Networks',
        examDate: '2026-10-15',
        availableTime: '3 hours/day',
        materialIds: [materialId],
      },
      token1
    );
    assert(planRes.status === 201, 'Generate study plan returns HTTP 201');
    const planId = planRes.data.data._id;

    // Schedule a study task for today
    const taskRes = await makeRequest(
      'POST',
      '/api/study-plans',
      {
        subject: 'Database Management Systems',
        topic: 'Review B-Trees & Indexing',
        date: new Date().toISOString(),
        startTime: '10:00 AM',
        duration: '1 hour',
        isTaskOnly: true,
      },
      token1
    );
    assert(taskRes.status === 201, 'Schedule study task returns HTTP 201');
    const taskId = taskRes.data.data._id;

    // Get today's study tasks
    const todayRes = await makeRequest('GET', '/api/study-plans/today', null, token1);
    assert(todayRes.status === 200, 'GET /api/study-plans/today returns HTTP 200');
    assert(todayRes.data.data.length >= 1, "Returns today's scheduled tasks");

    // Toggle study task completion
    const toggleTaskRes = await makeRequest('PATCH', `/api/study-plans/${taskId}/toggle`, {}, token1);
    assert(toggleTaskRes.status === 200, 'Toggle study task completion returns HTTP 200');
    assert(toggleTaskRes.data.data.isCompleted === true, 'Task marked as completed');

    // 14. AI Direct Endpoints: Chat & Explain
    const chatRes = await makeRequest(
      'POST',
      '/api/ai/chat',
      {
        message: 'How does the TCP 3-way handshake work?',
      },
      token1
    );
    assert(chatRes.status === 200, 'AI chat returns HTTP 200');
    assert(chatRes.data.data.reply, 'AI chat returned academic reply');

    const explainRes = await makeRequest(
      'POST',
      '/api/ai/explain',
      {
        topic: 'OSI Model vs TCP/IP Model',
        level: 'undergraduate',
      },
      token1
    );
    assert(explainRes.status === 200, 'AI explain returns HTTP 200');
    assert(explainRes.data.data.explanation, 'AI explain returned explanation');

    // 15. Progress Metrics: Verify 9 MongoDB-backed Metrics
    const progRes = await makeRequest('GET', '/api/progress', null, token1);
    assert(progRes.status === 200, 'GET /api/progress returns HTTP 200');
    const p = progRes.data.data;
    assert(p.totalMaterials >= 2, 'Metric 1: totalMaterials >= 2');
    assert(p.totalSubjects >= 1, 'Metric 2: totalSubjects >= 1');
    assert(p.totalSummaries >= 1, 'Metric 3: totalSummaries >= 1');
    assert(p.flashcardsStudied >= 1, 'Metric 4: flashcardsStudied >= 1');
    assert(p.quizzesTaken >= 1, 'Metric 5: quizzesTaken >= 1');
    assert(typeof p.averageQuizScore === 'number', 'Metric 6: averageQuizScore is a number');
    assert(p.studyPlanTasks >= 1, 'Metric 7: studyPlanTasks >= 1');
    assert(p.completedTasks >= 1, 'Metric 8: completedTasks >= 1');
    assert(p.overallProgress >= 0 && p.overallProgress <= 100, 'Metric 9: overallProgress is between 0% and 100%');
    assert(Array.isArray(p.weeklyChart) && p.weeklyChart.length === 7, 'Weekly activity chart data contains 7 days');

    // Cleanup test data
    await makeRequest('DELETE', `/api/summaries/${summaryId}`, null, token1);
    await makeRequest('DELETE', `/api/study-plans/${planId}`, null, token1);
    await makeRequest('DELETE', `/api/study-plans/${taskId}`, null, token1);

    console.log('\n🎉 ALL 15 AUTOMATED INTEGRATION TESTS (INCLUDING ALL 8 MODULES) PASSED PERFECTLY! 🎉\n');
  } catch (err) {
    console.error('Test suite encountered an error:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests();
