require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const StudyMaterial = require('./models/StudyMaterial');
const Summary = require('./models/Summary');
const Flashcard = require('./models/Flashcard');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const StudyPlan = require('./models/StudyPlan');
const Progress = require('./models/Progress');
const connectDB = require('./config/database');

async function seedData() {
  await connectDB();

  console.log('[Seed] Seeding comprehensive academic data for AI Study Buddy...');

  // Demo user credentials
  const demoEmail = 'alex@university.edu';
  let user = await User.findOne({ email: demoEmail });

  if (user) {
    console.log(`[Seed] Found existing demo user: ${demoEmail}`);
    // Clear user's existing records to ensure fresh consistent data
    await Promise.all([
      Subject.deleteMany({ userId: user._id }),
      StudyMaterial.deleteMany({ userId: user._id }),
      Summary.deleteMany({ userId: user._id }),
      Flashcard.deleteMany({ userId: user._id }),
      Quiz.deleteMany({ userId: user._id }),
      QuizAttempt.deleteMany({ userId: user._id }),
      StudyPlan.deleteMany({ userId: user._id }),
      Progress.deleteMany({ userId: user._id }),
    ]);
  } else {
    user = new User({
      name: 'Alex Johnson',
      email: demoEmail,
      password: 'password123',
      role: 'student',
    });
    await user.save();
    console.log(`[Seed] Created demo user: ${demoEmail}`);
  }

  const userId = user._id;

  // 1. Create Core Subjects requested by user
  const subjectsData = [
    {
      userId,
      name: 'Computer Science',
      description: 'Core computing concepts, algorithms, data structures, and discrete mathematics.',
      color: '#4f46e5',
      icon: '💻',
    },
    {
      userId,
      name: 'Artificial Intelligence',
      description: 'Machine learning foundations, neural networks, optimization, and search strategies.',
      color: '#7c3aed',
      icon: '🧠',
    },
    {
      userId,
      name: 'Mathematics',
      description: 'Calculus, linear algebra, discrete math, probability and statistical foundations.',
      color: '#0284c7',
      icon: '📐',
    },
    {
      userId,
      name: 'Database Management',
      description: 'Relational design, normalization, ACID transactions, SQL and NoSQL architectures.',
      color: '#059669',
      icon: '🗄️',
    },
    {
      userId,
      name: 'Node.js',
      description: 'Asynchronous event loop, Express.js web APIs, non-blocking I/O and microservices.',
      color: '#16a34a',
      icon: '⚡',
    },
    {
      userId,
      name: 'MongoDB',
      description: 'Document database model, Mongoose ODM, aggregation pipelines and indexing strategies.',
      color: '#0d9488',
      icon: '🍃',
    },
  ];

  const createdSubjects = await Subject.insertMany(subjectsData);
  console.log(`[Seed] Created ${createdSubjects.length} subjects.`);

  // 2. Create Comprehensive Study Materials
  const materialsData = [
    {
      userId,
      title: 'Asymptotic Analysis & Big O Complexity of Graph Algorithms',
      subject: 'Computer Science',
      fileType: 'notes',
      content: `Asymptotic notations formalize algorithm efficiency independent of specific hardware:
- Big O (O): Upper bound characterizing the worst-case growth rate.
- Breadth-First Search (BFS): Explores nodes level-by-level using a queue. Time complexity is O(V + E), space complexity is O(V). Computes shortest paths in unweighted graphs.
- Depth-First Search (DFS): Explores branches deeply using recursion or a stack. Time complexity is O(V + E). Used in topological sorting and cycle detection.
- Dijkstra's Algorithm: Finds single-source shortest paths in graphs with non-negative edge weights using a priority queue (min-heap) in O((V + E) log V) time.`,
    },
    {
      userId,
      title: 'Supervised Learning, Neural Networks, and Gradient Descent',
      subject: 'Artificial Intelligence',
      fileType: 'notes',
      content: `Supervised machine learning trains algorithms to learn mapping functions from input features to target labels:
- Cost/Loss Function: Quantifies the discrepancy between model predictions and true ground-truth targets (e.g., Mean Squared Error for regression, Cross-Entropy Loss for classification).
- Gradient Descent: Optimization algorithm that iteratively updates model weights in the direction opposite to the gradient of the loss function. Learning rate governs step size.
- Backpropagation: Efficient application of the multivariable calculus chain rule to compute partial derivatives of the loss function with respect to every weight in a deep neural network.`,
    },
    {
      userId,
      title: 'Relational Database Transactions and ACID Guarantees',
      subject: 'Database Management',
      fileType: 'notes',
      content: `A transaction is a single logical unit of work within a database management system. To maintain integrity, transactions must satisfy ACID properties:
- Atomicity: "All or nothing" execution. If any operation within the transaction fails, the entire transaction is rolled back.
- Consistency: The database must transition from one valid state to another valid state, preserving all integrity constraints and foreign keys.
- Isolation: Concurrent transactions execute without interfering with one another. Isolation levels include Read Uncommitted, Read Committed, Repeatable Read, and Serializable.
- Durability: Once a transaction commits, its modifications are permanently recorded in non-volatile storage, surviving system crashes via Write-Ahead Logging (WAL).`,
    },
    {
      userId,
      title: 'Node.js Event Loop, Worker Threads, and Non-Blocking I/O',
      subject: 'Node.js',
      fileType: 'notes',
      content: `Node.js is a single-threaded runtime built on Google Chrome's V8 engine that uses an event-driven, non-blocking I/O model:
- Event Loop: Continuously checks for and processes incoming events across specific phases: Timers (setTimeout, setInterval), Pending Callbacks, Poll (I/O events), Check (setImmediate), and Close callbacks.
- Non-blocking I/O: Offloads file system operations, DNS lookups, and network calls to libuv's background thread pool (default 4 threads).
- Worker Threads: Allows running CPU-intensive operations (cryptography, image processing) in parallel without stalling the main event loop thread.`,
    },
    {
      userId,
      title: 'MongoDB Aggregation Framework and Compound Indexing',
      subject: 'MongoDB',
      fileType: 'notes',
      content: `MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like BSON documents:
- Aggregation Pipeline: Multi-stage transformation pipeline consisting of stages such as $match, $group, $sort, $project, $lookup, and $unwind.
- Compound Indexes: An index on multiple fields, e.g., { subject: 1, createdAt: -1 }. Follows the ESR (Equality, Sort, Range) rule to optimize query performance.
- Replica Sets: High availability architecture providing automated failover and data redundancy across primary and secondary nodes.`,
    },
    {
      userId,
      title: 'Linear Algebra: Eigenvalues, Matrix Decompositions, and SVD',
      subject: 'Mathematics',
      fileType: 'notes',
      content: `Linear algebra is fundamental to data science and machine learning:
- Eigenvectors and Eigenvalues: For a square matrix A, non-zero vector v satisfies Av = λv. Represents directions where linear transformations only cause scaling.
- Singular Value Decomposition (SVD): Factorizes any m x n matrix into U * Σ * V^T. Essential for dimensionality reduction and Principal Component Analysis (PCA).
- Matrix Inverses: A square matrix has an inverse if and only if its determinant is non-zero (non-singular).`,
    },
  ];

  const createdMaterials = await StudyMaterial.insertMany(materialsData);
  console.log(`[Seed] Created ${createdMaterials.length} study materials.`);

  // 3. Create Structured AI Summaries
  const summariesData = [
    {
      userId,
      materialId: createdMaterials[0]._id,
      summary: `### Academic Summary: Graph Algorithms & Asymptotic Complexity
Asymptotic notation evaluates algorithmic scaling independent of system hardware. BFS explores neighbor nodes layer-by-layer in O(V + E) time, ideal for shortest paths in unweighted graphs. DFS navigates depth-first via recursion, powering topological sorting. Dijkstra's algorithm uses a priority queue to compute shortest paths with non-negative edge weights in O((V + E) log V).`,
      shortSummary: 'Overview of graph traversal algorithms (BFS, DFS) and Dijkstra shortest path algorithm with their respective Big O time and space complexities.',
      importantPoints: [
        'BFS uses a FIFO queue with O(V + E) time and O(V) space complexity for unweighted shortest paths',
        'DFS uses a LIFO stack or recursion with O(V + E) time for cycle detection and topological sorting',
        'Dijkstra algorithm requires non-negative weights and achieves O((V + E) log V) with a min-heap',
        'Big O specifies asymptotic upper bounds characterizing worst-case growth rates',
      ],
      keyTerms: [
        { term: 'Asymptotic Analysis', definition: 'Evaluating mathematical performance scaling of algorithms as input size approaches infinity.' },
        { term: 'Min-Heap', definition: 'A complete binary tree where the key at root is the minimum among all keys, allowing O(1) minimum retrieval and O(log n) removal.' },
        { term: 'Topological Sort', definition: 'Linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge uv, u comes before v.' },
      ],
      mainConcepts: [
        'Breadth-First vs Depth-First Search exploration strategies',
        'Priority queues for greedy shortest path determination',
        'Graph representation tradeoffs: adjacency matrix vs adjacency list',
      ],
      keyPoints: [
        'BFS runs in O(V + E) using a queue',
        'DFS runs in O(V + E) using a stack',
        'Dijkstra runs in O((V + E) log V) with a min-heap',
      ],
    },
    {
      userId,
      materialId: createdMaterials[2]._id,
      summary: `### Academic Summary: Relational Transactions and ACID Guarantees
Database transactions wrap related operations into single atomic units of work. ACID compliance guarantees that transactions either execute entirely or rollback completely (Atomicity), preserve structural invariants and constraints (Consistency), isolate concurrent operations from dirty reads (Isolation), and permanently commit data surviving power failures via Write-Ahead Logging (Durability).`,
      shortSummary: 'A transaction is an indivisible unit of work governed by ACID properties to maintain relational database integrity under concurrent access and system crashes.',
      importantPoints: [
        'Atomicity enforces all-or-nothing execution, rolling back changes if any step fails',
        'Consistency preserves integrity constraints, triggers, and foreign keys across state changes',
        'Isolation prevents dirty reads, non-repeatable reads, and phantom reads through isolation levels',
        'Durability ensures committed data survives unexpected power losses via Write-Ahead Logging (WAL)',
      ],
      keyTerms: [
        { term: 'ACID', definition: 'Atomicity, Consistency, Isolation, and Durability - the fundamental guarantees of transactional databases.' },
        { term: 'Write-Ahead Logging (WAL)', definition: 'A family of techniques for providing atomicity and durability by writing changes to non-volatile logs before database pages.' },
        { term: 'Serializable', definition: 'The highest isolation level, executing transactions with equivalent results to strictly sequential execution.' },
      ],
      mainConcepts: [
        'Transaction lifecycle: Begin, Execute, Commit, Rollback',
        'Concurrency anomalies: Dirty reads, non-repeatable reads, phantom reads',
        'Crash recovery mechanisms and checkpointing',
      ],
      keyPoints: [
        'Atomicity guarantees all-or-nothing completion via rollback logs',
        'Consistency maintains relational constraints and validation invariants',
        'Isolation levels range from Read Committed to strict Serializability',
        'Durability guarantees persistent commits using Write-Ahead Logging',
      ],
    },
  ];

  await Summary.insertMany(summariesData);
  console.log(`[Seed] Created ${summariesData.length} structured AI summaries.`);

  // 4. Create Flashcards with Study Tracking
  const flashcardsData = [
    {
      userId,
      materialId: createdMaterials[0]._id,
      question: "What is the time complexity of Dijkstra's algorithm implemented with a min-heap?",
      answer: "O((V + E) log V), where V is the number of vertices and E is the number of edges.",
      isStudied: true,
      studyCount: 2,
      studiedAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      userId,
      materialId: createdMaterials[0]._id,
      question: 'What is the primary difference in data structures used between BFS and DFS?',
      answer: 'BFS uses a FIFO (First-In, First-Out) Queue to explore nodes level-by-level, while DFS uses a LIFO (Last-In, First-Out) Stack or call stack via recursion.',
      isStudied: true,
      studyCount: 1,
      studiedAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      userId,
      materialId: createdMaterials[1]._id,
      question: 'What is Backpropagation in deep learning neural networks?',
      answer: 'Backpropagation is the efficient application of the multivariable calculus chain rule to compute partial derivatives of the loss function with respect to every weight, guiding gradient descent updates.',
      isStudied: true,
      studyCount: 3,
      studiedAt: new Date(Date.now() - 3600000 * 8),
    },
    {
      userId,
      materialId: createdMaterials[2]._id,
      question: 'What does each letter in the ACID acronym stand for in database management?',
      answer: 'Atomicity (all or nothing), Consistency (preserves database rules), Isolation (independent concurrent execution), and Durability (committed data survives crashes).',
      isStudied: false,
      studyCount: 0,
    },
    {
      userId,
      materialId: createdMaterials[3]._id,
      question: 'What are the main phases of the Node.js Event Loop?',
      answer: 'Timers (setTimeout/setInterval) -> Pending Callbacks -> Idle/Prepare -> Poll (I/O events) -> Check (setImmediate) -> Close Callbacks.',
      isStudied: false,
      studyCount: 0,
    },
    {
      userId,
      materialId: createdMaterials[4]._id,
      question: 'What is the ESR rule for creating compound indexes in MongoDB?',
      answer: 'The ESR rule states that compound index keys should be ordered by: Equality fields first, followed by Sort fields, and finally Range filter fields.',
      isStudied: true,
      studyCount: 1,
      studiedAt: new Date(),
    },
  ];

  await Flashcard.insertMany(flashcardsData);
  console.log(`[Seed] Created ${flashcardsData.length} flashcards (4 studied, 2 to review).`);

  // 5. Create Quizzes and Quiz Attempts
  const quiz1 = new Quiz({
    userId,
    materialId: createdMaterials[0]._id,
    title: 'Quiz: Graph Algorithms & Asymptotic Complexity',
    subject: 'Computer Science',
    questions: [
      {
        question: "What is the time complexity of Dijkstra's algorithm with a binary min-heap?",
        options: ['O(V^2)', 'O((V + E) log V)', 'O(V + E)', 'O(E log E)'],
        answer: 'O((V + E) log V)',
      },
      {
        question: 'Which traversal algorithm is preferred for finding the shortest path in an unweighted graph?',
        options: ['Breadth-First Search (BFS)', 'Depth-First Search (DFS)', 'Bellman-Ford', 'Floyd-Warshall'],
        answer: 'Breadth-First Search (BFS)',
      },
      {
        question: 'Which asymptotic notation specifies the strict mathematical upper bound of an algorithm?',
        options: ['Big O notation', 'Big Omega notation', 'Big Theta notation', 'Little o notation'],
        answer: 'Big O notation',
      },
      {
        question: 'Which of the following problems can be resolved using Depth-First Search (DFS)?',
        options: ['Topological sorting and cycle detection', 'Minimum spanning tree on directed graphs', 'All-pairs shortest paths', 'PageRank convergence'],
        answer: 'Topological sorting and cycle detection',
      },
      {
        question: 'Can Dijkstra algorithm correctly handle negative edge weights?',
        options: ['No, negative weights may produce incorrect shortest paths', 'Yes, by inverting signs', 'Yes, unconditionally', 'Only in complete graphs'],
        answer: 'No, negative weights may produce incorrect shortest paths',
      },
    ],
    lastAttempt: {
      score: 4,
      totalQuestions: 5,
      percentage: 80,
      submittedAt: new Date(Date.now() - 3600000 * 3),
    },
  });

  const quiz2 = new Quiz({
    userId,
    materialId: createdMaterials[2]._id,
    title: 'Quiz: Database Transactions & ACID Principles',
    subject: 'Database Management',
    questions: [
      {
        question: 'Which property guarantees that either all operations succeed or all are rolled back?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        answer: 'Atomicity',
      },
      {
        question: 'What technique ensures durability of committed transactions across system power failure?',
        options: ['Write-Ahead Logging (WAL)', 'Dirty Reads', 'Garbage Collection', 'Two-Phase Locking'],
        answer: 'Write-Ahead Logging (WAL)',
      },
      {
        question: 'Which transaction isolation level prevents dirty reads, non-repeatable reads, and phantom reads?',
        options: ['Serializable', 'Repeatable Read', 'Read Committed', 'Read Uncommitted'],
        answer: 'Serializable',
      },
    ],
    lastAttempt: {
      score: 3,
      totalQuestions: 3,
      percentage: 100,
      submittedAt: new Date(Date.now() - 3600000 * 24),
    },
  });

  await quiz1.save();
  await quiz2.save();
  console.log(`[Seed] Created 2 AI quizzes.`);

  // Create Quiz Attempt Records for MongoDB history
  const attempt1 = new QuizAttempt({
    userId,
    quizId: quiz1._id,
    score: 4,
    totalQuestions: 5,
    wrong: 1,
    percentage: 80,
    answersReview: [
      {
        question: "What is the time complexity of Dijkstra's algorithm with a binary min-heap?",
        userAnswer: 'O((V + E) log V)',
        correctAnswer: 'O((V + E) log V)',
        isCorrect: true,
      },
      {
        question: 'Which traversal algorithm is preferred for finding the shortest path in an unweighted graph?',
        userAnswer: 'Breadth-First Search (BFS)',
        correctAnswer: 'Breadth-First Search (BFS)',
        isCorrect: true,
      },
      {
        question: 'Which asymptotic notation specifies the strict mathematical upper bound of an algorithm?',
        userAnswer: 'Big O notation',
        correctAnswer: 'Big O notation',
        isCorrect: true,
      },
      {
        question: 'Which of the following problems can be resolved using Depth-First Search (DFS)?',
        userAnswer: 'Topological sorting and cycle detection',
        correctAnswer: 'Topological sorting and cycle detection',
        isCorrect: true,
      },
      {
        question: 'Can Dijkstra algorithm correctly handle negative edge weights?',
        userAnswer: 'Yes, unconditionally',
        correctAnswer: 'No, negative weights may produce incorrect shortest paths',
        isCorrect: false,
      },
    ],
    submittedAt: new Date(Date.now() - 3600000 * 3),
  });

  const attempt2 = new QuizAttempt({
    userId,
    quizId: quiz2._id,
    score: 3,
    totalQuestions: 3,
    wrong: 0,
    percentage: 100,
    answersReview: [
      {
        question: 'Which property guarantees that either all operations succeed or all are rolled back?',
        userAnswer: 'Atomicity',
        correctAnswer: 'Atomicity',
        isCorrect: true,
      },
      {
        question: 'What technique ensures durability of committed transactions across system power failure?',
        userAnswer: 'Write-Ahead Logging (WAL)',
        correctAnswer: 'Write-Ahead Logging (WAL)',
        isCorrect: true,
      },
      {
        question: 'Which transaction isolation level prevents dirty reads, non-repeatable reads, and phantom reads?',
        userAnswer: 'Serializable',
        correctAnswer: 'Serializable',
        isCorrect: true,
      },
    ],
    submittedAt: new Date(Date.now() - 3600000 * 24),
  });

  await attempt1.save();
  await attempt2.save();
  console.log(`[Seed] Created 2 QuizAttempt history records.`);

  // 6. Create Study Plans & Today's Study Tasks
  const today = new Date();
  const examDate1 = new Date();
  examDate1.setDate(examDate1.getDate() + 14);

  const studyPlansData = [
    {
      userId,
      subject: 'Computer Science',
      topic: 'Full Term Exam Roadmap: Algorithms & Complexity',
      date: examDate1,
      startTime: '09:00 AM',
      duration: '2 hours/day',
      examDate: examDate1,
      availableTime: '2 hours/day',
      isCompleted: false,
      studyPlan: {
        title: 'Computer Science 14-Day Exam Roadmap',
        overview: 'Structured review schedule prioritizing graph algorithms, recurrence relations, and dynamic programming.',
        schedule: [
          {
            day: 'Day 1 - 3',
            title: 'Graph Traversal & Shortest Paths',
            duration: '2 hours/day',
            topics: ['BFS/DFS implementation', 'Dijkstra and Bellman-Ford algorithms'],
            recommendedActions: 'Complete flashcard deck and practice coding shortest path algorithms',
          },
          {
            day: 'Day 4 - 7',
            title: 'Divide-and-Conquer & Dynamic Programming',
            duration: '2 hours/day',
            topics: ['Master Theorem for recurrences', 'Knapsack and Longest Common Subsequence'],
            recommendedActions: 'Generate custom AI quiz to verify recurrence solving',
          },
          {
            day: 'Day 8 - 14',
            title: 'Mock Exams & Review',
            duration: '2 hours/day',
            topics: ['P vs NP concepts', 'Comprehensive practice exams'],
            recommendedActions: 'Engage with AI Study Buddy on difficult problem sets',
          },
        ],
      },
    },
    // Today's Study Tasks
    {
      userId,
      subject: 'Database Management',
      topic: 'Review ACID properties and isolation level anomalies',
      date: today,
      startTime: '10:00 AM',
      duration: '1 hour',
      examDate: today,
      availableTime: '1 hour',
      isCompleted: true,
      completedAt: new Date(Date.now() - 3600000 * 2),
      studyPlan: {
        title: 'Review ACID properties and isolation level anomalies',
        schedule: [{ day: 'Session 1', title: 'ACID Review', duration: '1 hour', topics: ['ACID', 'WAL'], recommendedActions: 'Self-test with quiz' }],
      },
    },
    {
      userId,
      subject: 'Node.js',
      topic: 'Deep dive into Libuv thread pool and Event Loop phases',
      date: today,
      startTime: '02:30 PM',
      duration: '1.5 hours',
      examDate: today,
      availableTime: '1.5 hours',
      isCompleted: false,
      studyPlan: {
        title: 'Deep dive into Libuv thread pool and Event Loop phases',
        schedule: [{ day: 'Session 2', title: 'Event Loop', duration: '1.5 hours', topics: ['Event Loop', 'Libuv'], recommendedActions: 'Practice explaining phases' }],
      },
    },
    {
      userId,
      subject: 'MongoDB',
      topic: 'Practice Aggregation Pipelines ($group, $match, $lookup)',
      date: today,
      startTime: '05:00 PM',
      duration: '1 hour',
      examDate: today,
      availableTime: '1 hour',
      isCompleted: false,
      studyPlan: {
        title: 'Practice Aggregation Pipelines ($group, $match, $lookup)',
        schedule: [{ day: 'Session 3', title: 'Aggregation Pipelines', duration: '1 hour', topics: ['Aggregation', 'Indexing'], recommendedActions: 'Run live queries' }],
      },
    },
  ];

  await StudyPlan.insertMany(studyPlansData);
  console.log(`[Seed] Created ${studyPlansData.length} study plans and tasks.`);

  // 7. Seed Progress Snapshot
  const progressDoc = new Progress({
    userId,
    totalMaterials: createdMaterials.length,
    totalSubjects: createdSubjects.length,
    totalSummaries: summariesData.length,
    flashcardsStudied: 4,
    quizzesTaken: 2,
    averageQuizScore: 90,
    studyPlanTasks: 4,
    completedTasks: 1,
    overallProgress: 75,
    lastUpdated: new Date(),
  });

  await progressDoc.save();
  console.log(`[Seed] Initialized Progress metrics document.`);

  console.log('\n======================================================');
  console.log('✅ AI STUDY BUDDY DATABASE SEEDED SUCCESSFULLY!');
  console.log(`   Demo Account:  alex@university.edu`);
  console.log(`   Password:      password123`);
  console.log(`   Subjects:      ${createdSubjects.length} (CS, AI, Math, DBMS, Node.js, MongoDB)`);
  console.log(`   Materials:     ${createdMaterials.length}`);
  console.log(`   Flashcards:    ${flashcardsData.length} (4 Studied)`);
  console.log(`   Quiz Attempts: 2 (Average: 90%)`);
  console.log(`   Study Tasks:   4 (1 Completed today)`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = seedData;
