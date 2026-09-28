// src/data/defaultCourseMaterials.js - High-Yield Academic Study Materials for Core Courses

const DEFAULT_COURSE_MATERIALS = [
  // --- 1. Computer Science ---
  {
    title: 'Data Structures: Trees, Balanced Trees (AVL & Red-Black), and B-Trees',
    subject: 'Computer Science',
    fileType: 'notes',
    content: `Data structures organize memory for efficient algorithmic search, insertion, and deletion:
1. Binary Search Trees (BST):
   - Invariant: For every node X, keys in left subtree < key(X), and keys in right subtree > key(X).
   - Traversals: In-order traversal yields sorted order. Pre-order is used for cloning, and Post-order is used for subtree deletion.
   - Worst-case time complexity degrades to O(N) when nodes are inserted in sorted sequence, creating a skewed linked list.

2. Balanced Binary Search Trees (AVL Trees):
   - Balance Factor: Defined as Height(Left Subtree) - Height(Right Subtree) in {-1, 0, 1}.
   - Rotations: Rebalances dynamically via Single Rotations (Left-Left, Right-Right) and Double Rotations (Left-Right, Right-Left) in O(1) time.
   - Strict balancing guarantees O(log N) lookup, insertion, and deletion.

3. Red-Black Trees:
   - Self-balancing BST using color bits (Red or Black) on each node.
   - Invariants: Root and leaves (NIL) are black; red nodes cannot have red children; every path from a node to descendant NIL leaves contains equal black nodes (black-height).
   - Used internally in Java TreeMap, C++ std::map, and Linux process schedulers.

4. B-Trees & B+ Trees:
   - Multi-way self-balancing search tree tailored for block-based secondary storage.
   - Nodes contain multiple keys and child pointers aligned to disk block / page boundaries (e.g., 4 KB - 16 KB), minimizing disk I/O seek overhead.`,
  },
  {
    title: 'Algorithm Design: Divide & Conquer, Dynamic Programming, and Greedy Paradigms',
    subject: 'Computer Science',
    fileType: 'notes',
    content: `Algorithmic design paradigms provide structured blueprints for solving computational problems:
1. Divide and Conquer:
   - Breaks problems into independent subproblems, solves recursively, and combines results (e.g., Merge Sort, Quick Sort, Binary Search).
   - Recurrence Analysis: Evaluated using the Master Theorem: T(n) = aT(n/b) + O(n^d). Comparing log_b(a) with d determines whether leaf nodes or root partition work dominates.

2. Dynamic Programming (DP):
   - Applicable when problems exhibit Overlapping Subproblems and Optimal Substructure.
   - Approaches: Top-Down with Memoization (caching recursive states) vs Bottom-Up with Tabulation (iterative table construction).
   - Classic Problems: 0/1 Knapsack problem where dp[i][w] = max(dp[i-1][w], dp[i-1][w - w_i] + v_i), Longest Common Subsequence (LCS), and Matrix Chain Multiplication.

3. Greedy Algorithms:
   - Makes the locally optimal choice at each step with the objective of finding a global optimum.
   - Requires the Greedy Choice Property and Optimal Substructure.
   - Examples: Dijkstra's single-source shortest path, Kruskal & Prim Minimum Spanning Trees (MST), and Huffman Coding data compression.`,
  },

  // --- 2. Artificial Intelligence ---
  {
    title: 'Deep Learning Foundations: Neural Networks, Activation Functions & Backpropagation',
    subject: 'Artificial Intelligence',
    fileType: 'notes',
    content: `Deep learning models approximate complex non-linear functions using interconnected layers of artificial neurons:
1. Artificial Neuron (Perceptron):
   - Computes weighted sum of inputs plus bias: z = W^T * X + b.
   - Passes output through a non-linear activation function: a = f(z). Non-linearity is essential to enable networks to represent multi-layer composition beyond simple linear transformations.

2. Activation Functions:
   - Sigmoid: σ(z) = 1 / (1 + e^-z), maps output to (0, 1). Suffers from vanishing gradient when |z| is large.
   - ReLU (Rectified Linear Unit): f(z) = max(0, z). Computationally efficient, accelerates gradient convergence, but can cause "dying ReLU" if weights update into negative saturation.
   - Softmax: Used in output layer for multi-class classification, converting unnormalized logits into normalized probability distribution over classes.

3. Loss Functions & Optimization:
   - Quantifies discrepancy between prediction and ground truth (Cross-Entropy Loss for classification, Mean Squared Error for regression).
   - Gradient Descent: Iteratively updates weights in opposite direction of loss gradient: W = W - α * (∂L/∂W), where α is learning rate.

4. Backpropagation:
   - Efficient application of the calculus chain rule backwards from loss layer to input layer.
   - Computes partial derivative of error with respect to every weight and bias, allowing automatic differentiation in modern deep learning frameworks.`,
  },
  {
    title: 'Natural Language Processing, Word Embeddings & Transformer Self-Attention',
    subject: 'Artificial Intelligence',
    fileType: 'notes',
    content: `Modern NLP has evolved from statistical n-grams to deep contextual Transformer architectures:
1. Text Representation & Tokenization:
   - Subword tokenization (Byte-Pair Encoding, WordPiece) handles out-of-vocabulary terms efficiently.
   - Dense Embeddings: Word2Vec and GloVe encode semantic proximity into continuous vector spaces where cosine similarity reflects semantic relatedness (e.g., king - man + woman ≈ queen).

2. Limitations of Recurrent Architectures (RNN/LSTM):
   - Sequential recurrence prevents parallel computation across long text sequences on GPUs.
   - Vanishing and exploding gradients hinder capturing dependencies across long context windows.

3. Transformer Architecture & Self-Attention:
   - Replaces recurrence entirely with Multi-Head Attention mechanisms.
   - Scaled Dot-Product Attention:
     Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V
     Where Q (Query), K (Key), and V (Value) are linear projections of input token embeddings.
   - Multi-Head Attention enables attending simultaneously to different representation subspaces (syntax, grammar, entity coreference).
   - Positional Encodings inject sequence order information into permutation-invariant attention matrices.`,
  },

  // --- 3. Mathematics ---
  {
    title: 'Linear Algebra: Vector Spaces, Matrix Decompositions & Singular Value Decomposition (SVD)',
    subject: 'Mathematics',
    fileType: 'notes',
    content: `Linear algebra provides the mathematical language for multi-dimensional data transformations:
1. Vector Spaces & Subspaces:
   - Sets closed under vector addition and scalar multiplication.
   - Linear Independence: A set of vectors {v1, ..., vk} is linearly independent if c1*v1 + ... + ck*vk = 0 implies all ci = 0.
   - Basis: A linearly independent spanning set. Dimension is the cardinality of the basis.

2. Eigenvalues and Eigenvectors:
   - For square matrix A (n x n), non-zero vector v is an eigenvector with eigenvalue λ if:
     A * v = λ * v   <=>   (A - λ * I) * v = 0
   - Characteristic Equation: det(A - λ * I) = 0 yields eigenvalues.
   - Represents invariant directions where the linear operator acts purely as scalar dilation.

3. Singular Value Decomposition (SVD):
   - Factorizes any arbitrary m x n real matrix A into three matrices:
     A = U * Σ * V^T
   - U is an m x m orthogonal matrix (left singular vectors, eigenvectors of A * A^T).
   - Σ is an m x n diagonal matrix containing non-negative singular values ordered by magnitude.
   - V is an n x n orthogonal matrix (right singular vectors, eigenvectors of A^T * A).
   - Core foundation of Principal Component Analysis (PCA), low-rank matrix approximation, and recommendation systems.`,
  },
  {
    title: 'Probability Theory & Statistical Inference for Machine Learning',
    subject: 'Mathematics',
    fileType: 'notes',
    content: `Probability models uncertainty in computational learning algorithms:
1. Probability Axioms & Conditional Probability:
   - Kolmogorov Axioms: P(E) >= 0, P(Sample Space) = 1, and countable additivity for mutually exclusive events.
   - Bayes' Theorem: Inverts conditional probabilities to update beliefs upon observing evidence:
     P(Hypothesis | Evidence) = [ P(Evidence | Hypothesis) * P(Hypothesis) ] / P(Evidence)

2. Random Variables & Distributions:
   - Expectation: E[X] = Σ x * P(x) (discrete) or ∫ x * f(x) dx (continuous). Linearity of expectation holds regardless of independence.
   - Variance: Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2.
   - Gaussian (Normal) Distribution: Governed by mean μ and variance σ^2. Under the Central Limit Theorem, the normalized sum of independent random variables converges to a Gaussian distribution.

3. Parameter Estimation:
   - Maximum Likelihood Estimation (MLE): Chooses parameters θ that maximize the likelihood of observed data: θ_MLE = argmax Σ log P(x_i | θ).
   - Maximum A Posteriori (MAP): Incorporates prior distribution over parameters via Bayesian inference, providing natural regularization.`,
  },

  // --- 4. Database Management ---
  {
    title: 'Relational Database Design, Normalization Forms (1NF to BCNF) & Integrity Constraints',
    subject: 'Database Management',
    fileType: 'notes',
    content: `Relational database theory eliminates data redundancy and prevents update anomalies:
1. Relational Model & Integrity:
   - Relations are sets of tuples (rows) conforming to schema attributes (columns).
   - Entity Integrity: Primary key attributes cannot contain NULL values.
   - Referential Integrity: Foreign keys must either reference an existing primary key or be NULL.

2. Functional Dependencies:
   - X -> Y states that whenever two tuples agree on attribute set X, they must agree on attribute set Y.
   - Candidate Key: Minimal set of attributes that uniquely determines all other attributes in the relation.

3. Normal Forms:
   - 1NF: Attribute values must be atomic (no arrays, lists, or nested records).
   - 2NF: In 1NF and every non-prime attribute is fully functionally dependent on the entire candidate key (eliminates partial key dependencies).
   - 3NF: In 2NF and no non-prime attribute is transitively dependent on candidate keys (X -> Y requires X is superkey or Y is prime attribute).
   - BCNF (Boyce-Codd Normal Form): Stricter 3NF requiring that for every functional dependency X -> Y, X must be a superkey. Eliminates all redundancy based on functional dependencies.`,
  },
  {
    title: 'Transactions, ACID Guarantees, Concurrency Control & Write-Ahead Logging',
    subject: 'Database Management',
    fileType: 'notes',
    content: `Database transaction management maintains correctness under multi-user concurrency and hardware failure:
1. ACID Properties:
   - Atomicity: "All or nothing" execution. Partial failures trigger rollback.
   - Consistency: Transitions database from one valid schema state to another.
   - Isolation: Uncommitted changes are hidden from concurrent transactions.
   - Durability: Committed updates permanently persist across crashes.

2. Concurrency Phenomena & Isolation Levels:
   - Dirty Read: Transaction reads uncommitted modifications of another transaction.
   - Non-Repeatable Read: Re-reading row returns modified data committed concurrently.
   - Phantom Read: Re-executing range query returns newly inserted matching rows.
   - SQL Isolation Levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable (strict sequential equivalence).

3. Two-Phase Locking (2PL):
   - Growing Phase: Locks acquired, none released.
   - Shrinking Phase: Locks released, none acquired.
   - Guarantees serializability; Strict 2PL holds exclusive locks until commit, preventing cascading aborts.

4. Write-Ahead Logging (WAL) & Recovery:
   - Changes must be written to non-volatile log on disk before corresponding database buffer pages are flushed.
   - ARIES Algorithm: Analysis pass identifies dirty pages, Redo pass repeats logged history, and Undo pass rolls back uncommitted transactions.`,
  },

  // --- 5. Node.js ---
  {
    title: 'Node.js Runtime Architecture: Event Loop Phases, Libuv Thread Pool & Non-Blocking I/O',
    subject: 'Node.js',
    fileType: 'notes',
    content: `Node.js provides an asynchronous, event-driven runtime built on Chrome's V8 engine:
1. Single-Threaded Event Loop & Libuv:
   - JavaScript execution is single-threaded on the main V8 thread.
   - Asynchronous I/O operations (file system, DNS, crypto, network sockets) are delegated to the underlying C-based Libuv library.
   - Libuv manages an internal Thread Pool (default 4 worker threads, configurable via UV_THREADPOOL_SIZE).

2. Event Loop Phases in Order:
   - Timers Phase: Executes callbacks scheduled by setTimeout() and setInterval().
   - Pending Callbacks: Executes I/O callbacks deferred from previous iterations (e.g., TCP error notifications).
   - Idle, Prepare: Internal Libuv routines.
   - Poll Phase: Retrieves new I/O events, executes I/O related callbacks; blocks when queue is empty if timers have not expired.
   - Check Phase: Executes callbacks queued via setImmediate().
   - Close Callbacks: Executes socket/handle closure callbacks (e.g., socket.on('close')).

3. Microtask Queues:
   - process.nextTick() queue has top priority and executes immediately after current operation completes before advancing phase.
   - Promise resolution microtask queue executes right after nextTick queue before the event loop advances.`,
  },
  {
    title: 'Building Production REST APIs with Express.js, Authentication Middleware & Error Handling',
    subject: 'Node.js',
    fileType: 'notes',
    content: `Production Express.js services follow modular, layered architecture for maintainability and security:
1. RESTful Principles:
   - Stateless client-server communication using HTTP verbs (GET, POST, PUT, PATCH, DELETE).
   - Standard HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error).

2. Middleware Pipeline:
   - Functions with signature (req, res, next). Can inspect, transform requests, end response cycle, or pass control via next().
   - Built-in: express.json() for request payload parsing, express.static() for file serving.
   - Security: Helmet for HTTP response security headers, CORS for cross-origin resource sharing control.

3. Authentication & Authorization:
   - Password Hashing: bcrypt with cryptographic salt rounds prevents rainbow table attacks.
   - JSON Web Tokens (JWT): Composed of Header, Payload, and Signature:
     HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
   - Stateless auth: Client presents Bearer token in HTTP Authorization header; verified by middleware before reaching controller.

4. Centralized Error Handling:
   - Catch async errors using try/catch or wrapper utilities.
   - Global error middleware: Defined with 4 parameters: (err, req, res, next) ensures uniform JSON error responses across the entire application.`,
  },

  // --- 6. MongoDB ---
  {
    title: 'MongoDB Document Schema Design: Embedding vs Referencing & Schema Validation',
    subject: 'MongoDB',
    fileType: 'notes',
    content: `MongoDB is a distributed document database storing rich, dynamic BSON documents:
1. Document Model Fundamentals:
   - Schemas are flexible, allowing polymorphic data models.
   - Document size limit is 16 MB.
   - BSON supports native data types: ObjectId (12-byte timestamp + machine + process + counter), ISODate, 64-bit integers, and binary data.

2. Schema Design: Embedding vs Referencing:
   - Embedding (Denormalization):
     - Stores related data inside nested subdocuments or arrays within a single document.
     - Best for: 1-to-1 or 1-to-Few relationships where data is frequently retrieved together in a single atomic read.
     - Advantage: Fast single-query reads, atomic updates without multi-document transactions.
   - Referencing (Normalization):
     - Stores ObjectIds linking to separate documents across collections.
     - Best for: 1-to-Many, Many-to-Many, or frequently growing unbounded datasets (preventing 16 MB document limit).
     - Advantage: Eliminates redundancy, permits independent indexing and query lifecycle.

3. Write Concern & Read Preference:
   - Write Concern: { w: 'majority', j: true } ensures writes are committed to the majority of replica set nodes and written to on-disk journal before acknowledging.
   - Read Preference: Directs read queries to Primary, Secondary, or Nearest nodes based on latency and consistency requirements.`,
  },
  {
    title: 'MongoDB Aggregation Pipelines, Compound Indexing & Query Optimization',
    subject: 'MongoDB',
    fileType: 'notes',
    content: `Query optimization in MongoDB leverages index strategies and multi-stage aggregation pipelines:
1. Aggregation Pipeline Stages:
   - Operates as a sequential data transformation pipeline:
     $match -> $project -> $group -> $sort -> $skip -> $limit
   - $lookup: Performs left outer equality joins across collections.
   - $unwind: Deconstructs an array field from input documents to output a document for each element.
   - $facet: Executes multi-faceted aggregations within a single pipeline stage.

2. Index Types & Structures:
   - B-Tree indexes: Provide fast O(log N) key lookups and ordered scans.
   - Compound Indexes: Index spanning multiple fields, e.g., { subject: 1, createdAt: -1 }.
   - Text Indexes: Supports word stemming and search score relevance ranking.
   - Partial & TTL Indexes: Indexes subset of documents conforming to filter, or automatically deletes documents after elapsed time.

3. The ESR Rule (Equality, Sort, Range):
   - Fundamental design principle for optimal compound index field ordering:
     1. Equality fields: Exact match predicates ($eq) placed first.
     2. Sort fields: Fields specified in sort order placed second.
     3. Range fields: Range filter predicates ($gt, $lt, $in) placed last.
   - Query Profiling: .explain("executionStats") examines whether queries execute via IXSCAN (index scan) or COLLSCAN (full collection scan).`,
  },
];

module.exports = DEFAULT_COURSE_MATERIALS;
