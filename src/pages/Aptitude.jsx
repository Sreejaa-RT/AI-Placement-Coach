import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHero from '../components/PageHero';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Aptitude() {
  const { currentUser, userProfile, updateUserStats } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  /* =========================================================
     CATEGORIES DEFINITION
  ========================================================= */

  const categories = [
    { 
      id: 'dsa', 
      name: 'Data Structures', 
      icon: '🌳', 
      count: 10, 
      description: 'Arrays, Linked Lists, Stack, Queue, Trees, BST, Heap, Hashing, Graphs' 
    },
    { 
      id: 'algo', 
      name: 'Algorithms', 
      icon: '⚡', 
      count: 10, 
      description: 'Searching, Sorting, Two Pointer, Sliding Window, Greedy, DP, Backtracking, Graph Algorithms' 
    },
    { 
      id: 'dbms', 
      name: 'DBMS / SQL', 
      icon: '🗄️', 
      count: 10, 
      description: 'SQL, Joins, Keys, Normalization, Transactions, ACID, Indexing, ER Model' 
    },
    { 
      id: 'os', 
      name: 'Operating Systems', 
      icon: '💻', 
      count: 10, 
      description: 'Processes, Threads, Scheduling, Deadlocks, Memory Management, Paging, Virtual Memory' 
    },
    { 
      id: 'cn', 
      name: 'Computer Networks', 
      icon: '🌐', 
      count: 10, 
      description: 'OSI Model, TCP/IP, HTTP, HTTPS, DNS, TCP, UDP, IP Addressing, Routing' 
    },
    { 
      id: 'oop', 
      name: 'Object-Oriented Programming', 
      icon: '🧩', 
      count: 10, 
      description: 'Classes, Objects, Inheritance, Polymorphism, Abstraction, Encapsulation, SOLID' 
    },
    { 
      id: 'prog', 
      name: 'Programming Fundamentals', 
      icon: '💻', 
      count: 10, 
      description: 'Variables, Functions, Recursion, Exception Handling, Collections, Complexity' 
    },
    { 
      id: 'quant', 
      name: 'Quantitative Aptitude', 
      icon: '📊', 
      count: 10, 
      description: 'Percentages, Ratio, Profit & Loss, Time & Work, Probability, Permutation & Combination' 
    },
    { 
      id: 'logical', 
      name: 'Logical Reasoning', 
      icon: '🧠', 
      count: 10, 
      description: 'Number Series, Coding-Decoding, Syllogisms, Blood Relations, Puzzles, Logical Patterns' 
    },
    { 
      id: 'verbal', 
      name: 'Verbal Ability', 
      icon: '💬', 
      count: 10, 
      description: 'Grammar, Vocabulary, Sentence Correction, Reading Comprehension, Verbal Reasoning' 
    }
  ];

  /* =========================================================
     CATEGORY STYLING MAP (Subtle Pastel Colors & Pill Tags)
  ========================================================= */

  const categoryStyles = {
    dsa: {
      bg: '#F0FDF4', // soft green
      iconBg: '#DCFCE7',
      textColor: '#166534',
      tagBg: '#DCFCE7',
      tags: ['Arrays', 'Trees', 'Graphs'],
      type: 'Technical'
    },
    algo: {
      bg: '#FAF5FF', // soft purple
      iconBg: '#F3E8FF',
      textColor: '#6B21A8',
      tagBg: '#F3E8FF',
      tags: ['Sorting', 'Searching', 'Dynamic Programming'],
      type: 'Technical'
    },
    dbms: {
      bg: '#EFF6FF', // soft blue
      iconBg: '#DBEAFE',
      textColor: '#1E40AF',
      tagBg: '#DBEAFE',
      tags: ['SQL', 'Normalization', 'Transactions'],
      type: 'Technical'
    },
    os: {
      bg: '#FFF7ED', // soft orange
      iconBg: '#FFEDD5',
      textColor: '#9A3412',
      tagBg: '#FFEDD5',
      tags: ['Processes', 'Memory', 'Deadlocks'],
      type: 'Technical'
    },
    cn: {
      bg: '#ECFEFF', // soft cyan
      iconBg: '#CFFAFE',
      textColor: '#075985',
      tagBg: '#CFFAFE',
      tags: ['TCP/IP', 'HTTP', 'DNS'],
      type: 'Technical'
    },
    oop: {
      bg: '#FDF2F8', // soft pink
      iconBg: '#FCE7F3',
      textColor: '#9D174D',
      tagBg: '#FCE7F3',
      tags: ['Inheritance', 'Polymorphism', 'Abstraction'],
      type: 'Technical'
    },
    prog: {
      bg: '#EEF2FF', // soft indigo
      iconBg: '#E0E7FF',
      textColor: '#3730A3',
      tagBg: '#E0E7FF',
      tags: ['Recursion', 'Collections', 'Complexity'],
      type: 'Technical'
    },
    quant: {
      bg: '#FEFCE8', // soft yellow
      iconBg: '#FEF9C3',
      textColor: '#854D0E',
      tagBg: '#FEF9C3',
      tags: ['Percentages', 'Ratio', 'Probability'],
      type: 'Aptitude'
    },
    logical: {
      bg: '#F0FDFA', // soft teal
      iconBg: '#CCFBF1',
      textColor: '#075985',
      tagBg: '#CCFBF1',
      tags: ['Series', 'Puzzles', 'Syllogisms'],
      type: 'Aptitude'
    },
    verbal: {
      bg: '#FFF5F5', // soft peach/red
      iconBg: '#FFE3E3',
      textColor: '#9B1C1C',
      tagBg: '#FFE3E3',
      tags: ['Grammar', 'Vocabulary', 'Comprehension'],
      type: 'Aptitude'
    }
  };

  /* =========================================================
     QUESTION BANK (100 QUESTIONS - 10 per category)
  ========================================================= */

  const questionsPool = {
    dsa: [
      {
        q: "What is the worst-case time complexity of searching in a Hash Table?",
        opts: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        ans: 2,
        exp: "In the average case, hash table lookup is O(1). However, in the worst case (where all keys hash to the same bucket and cause collisions resolved by chaining), it degrades to searching a linked list of length N, which takes O(N) time.",
        topic: "Hashing",
        difficulty: "Medium"
      },
      {
        q: "Which data structure is mainly used for implementing BFS (Breadth-First Search) on graphs?",
        opts: ["Stack", "Queue", "Binary Tree", "Heap"],
        ans: 1,
        exp: "BFS visits nodes level-by-level. A Queue (FIFO) is used to track nodes that have been discovered but not yet fully explored, ensuring that closer nodes are visited before nodes that are further away.",
        topic: "Graphs",
        difficulty: "Easy"
      },
      {
        q: "In a min-heap, where is the minimum element located?",
        opts: ["Leaf node", "Root node", "Middle node", "Random node"],
        ans: 1,
        exp: "By definition, the min-heap property requires that the key of a node is less than or equal to the keys of its children. Thus, the absolute smallest element is always stored at the root (index 0).",
        topic: "Heap",
        difficulty: "Easy"
      },
      {
        q: "What is the relation between number of edges (E) and vertices (V) in a Tree graph?",
        opts: ["E = V", "E = V + 1", "E = V - 1", "E = 2V"],
        ans: 2,
        exp: "A tree is defined as an acyclic connected graph. A fundamental mathematical property of any tree is that it contains exactly V - 1 edges, where V is the count of vertices.",
        topic: "Trees",
        difficulty: "Easy"
      },
      {
        q: "Which data structure follows the LIFO (Last-In-First-Out) access pattern?",
        opts: ["Queue", "Stack", "Priority Queue", "Linked List"],
        ans: 1,
        exp: "A Stack follows Last-In-First-Out (LIFO), meaning the last element added is the first one retrieved.",
        topic: "Stack",
        difficulty: "Easy"
      },
      {
        q: "What is the worst-case time complexity of deleting a node from a singly linked list when given only a pointer to that node (and not the head)?",
        opts: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        ans: 0,
        exp: "We can copy the data of the next node into the current node and delete the next node in O(1) time. (Note: this does not work if it is the tail node, but generally this trick is O(1)).",
        topic: "Linked Lists",
        difficulty: "Hard"
      },
      {
        q: "Which traversal of a Binary Search Tree (BST) visits the nodes in sorted ascending order?",
        opts: ["Preorder", "Inorder", "Postorder", "Level-order"],
        ans: 1,
        exp: "Inorder traversal (Left, Root, Right) of a Binary Search Tree processes keys in ascending sorted order.",
        topic: "BST",
        difficulty: "Medium"
      },
      {
        q: "What is the time complexity to retrieve an element at a random index in an Array vs a Singly Linked List?",
        opts: ["O(1) for both", "O(N) for both", "O(1) for Array, O(N) for Linked List", "O(N) for Array, O(1) for Linked List"],
        ans: 2,
        exp: "Arrays support direct indexing using memory offsets, taking O(1) time. Linked lists require traversing pointers from the head, taking O(N) time in the worst case.",
        topic: "Arrays",
        difficulty: "Easy"
      },
      {
        q: "Which representation of a graph is more space-efficient for sparse graphs (graphs with few edges)?",
        opts: ["Adjacency Matrix", "Adjacency List", "Incidence Matrix", "Both are equally efficient"],
        ans: 1,
        exp: "An adjacency list takes O(V + E) space, which is very efficient for sparse graphs. An adjacency matrix always takes O(V^2) space, which wastes space when edges are few.",
        topic: "Graphs",
        difficulty: "Medium"
      },
      {
        q: "How is a circular queue empty condition typically represented using front and rear pointers?",
        opts: ["front == rear", "front == rear + 1", "(rear + 1) % size == front", "front == -1"],
        ans: 0,
        exp: "When the queue is empty, the front and rear pointers point to the same index (front == rear).",
        topic: "Queue",
        difficulty: "Hard"
      }
    ],
    algo: [
      {
        q: "Which sorting algorithm has a stable worst-case time complexity of O(N log N)?",
        opts: ["Quick Sort", "Bubble Sort", "Merge Sort", "Insertion Sort"],
        ans: 2,
        exp: "Merge Sort consistently divides the array in half and merges them in linear time, yielding O(N log N) in best, average, and worst cases. Quick Sort's worst case is O(N^2) if pivot choices are highly unbalanced.",
        topic: "Sorting",
        difficulty: "Medium"
      },
      {
        q: "What design paradigm does Binary Search belong to?",
        opts: ["Greedy Method", "Dynamic Programming", "Divide and Conquer", "Backtracking"],
        ans: 2,
        exp: "Binary search repeatedly divides the search space in half (Divide), compares the target with the middle element (Conquer), and discards the invalid half. Thus, it follows Divide and Conquer.",
        topic: "Searching",
        difficulty: "Easy"
      },
      {
        q: "Which algorithm is used to find the shortest path from a single source node to all other nodes in a weighted graph with positive weights?",
        opts: ["Prim's Algorithm", "Kruskal's Algorithm", "Dijkstra's Algorithm", "Floyd-Warshall Algorithm"],
        ans: 2,
        exp: "Dijkstra's algorithm is specifically designed for single-source shortest path calculation on graphs with non-negative edge weights. Prim and Kruskal find Minimum Spanning Trees (MSTs).",
        topic: "Graph Algorithms",
        difficulty: "Medium"
      },
      {
        q: "What is the time complexity of the standard recursive Fibonacci algorithm without memoization?",
        opts: ["O(N)", "O(N log N)", "O(2^N)", "O(N^2)"],
        ans: 2,
        exp: "The recurrence relation is T(N) = T(N-1) + T(N-2) + O(1), which creates a recursive tree of height N. The number of calls doubles at each level, resulting in an exponential time complexity of O(2^N).",
        topic: "Recursion",
        difficulty: "Medium"
      },
      {
        q: "What is the worst-case time complexity of Quick Sort, and when does it occur?",
        opts: ["O(N log N), when array is sorted", "O(N^2), when array is sorted and first or last element is chosen as pivot", "O(N^2), when elements are identical", "O(N log N), always"],
        ans: 1,
        exp: "Quick Sort degrades to O(N^2) if the pivot partition is extremely unbalanced, such as choosing the minimum or maximum element repeatedly on an already sorted array.",
        topic: "Sorting",
        difficulty: "Hard"
      },
      {
        q: "Which of the following algorithms is used to find the Minimum Spanning Tree of a graph?",
        opts: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Bellman-Ford Algorithm", "Floyd-Warshall Algorithm"],
        ans: 1,
        exp: "Kruskal's and Prim's algorithms are greedy algorithms used to find the Minimum Spanning Tree (MST) of a connected, undirected weighted graph.",
        topic: "Graph Algorithms",
        difficulty: "Medium"
      },
      {
        q: "What are the two core properties that a problem must exhibit to be solved using Dynamic Programming?",
        opts: ["Divide and conquer, greedy choice", "Overlapping subproblems, optimal substructure", "LIFO execution, optimal bounds", "Linear growth, recursive structure"],
        ans: 1,
        exp: "Dynamic Programming requires Overlapping Subproblems (subproblems are recomputed multiple times) and Optimal Substructure (optimal solution to the problem contains optimal solutions to subproblems).",
        topic: "Dynamic Programming",
        difficulty: "Hard"
      },
      {
        q: "Which of the following is a classic example of a Greedy algorithm?",
        opts: ["Merge Sort", "Fractional Knapsack", "0/1 Knapsack", "Floyd-Warshall Algorithm"],
        ans: 1,
        exp: "Fractional Knapsack can be solved greedily by sorting items by value-to-weight ratio. 0/1 Knapsack cannot be solved greedily and requires Dynamic Programming.",
        topic: "Greedy",
        difficulty: "Medium"
      },
      {
        q: "What is the prerequisite for performing a Binary Search on an array?",
        opts: ["The array must be unsorted", "The array must be sorted", "The array must contain only positive numbers", "The array size must be a power of 2"],
        ans: 1,
        exp: "Binary search compares the target value to the middle element and discards half the search space, which requires the elements to be in sorted order.",
        topic: "Searching",
        difficulty: "Easy"
      },
      {
        q: "Which data structure is used to implement Depth-First Search (DFS) iteratively?",
        opts: ["Queue", "Stack", "Min-Heap", "Hash Map"],
        ans: 1,
        exp: "Iterative DFS uses a Stack to store vertices waiting to be explored, matching the LIFO property of recursive call execution.",
        topic: "Graph Algorithms",
        difficulty: "Easy"
      }
    ],
    dbms: [
      {
        q: "Which normal form requires that there are no partial dependencies (i.e. no non-prime attribute depends on a subset of a candidate key)?",
        opts: ["1NF", "2NF", "3NF", "BCNF"],
        ans: 1,
        exp: "A relation is in Second Normal Form (2NF) if it is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key. In other words, there are no partial dependencies.",
        topic: "Normalization",
        difficulty: "Medium"
      },
      {
        q: "What does the 'I' in ACID database transactions stand for?",
        opts: ["Inheritance", "Integration", "Isolation", "Indexation"],
        ans: 2,
        exp: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation ensures that concurrent execution of transactions leaves the database in the same state as if they were executed sequentially.",
        topic: "Transactions",
        difficulty: "Easy"
      },
      {
        q: "Which SQL clause is used to filter records AFTER an aggregation or GROUP BY operation?",
        opts: ["WHERE", "HAVING", "ORDER BY", "DISTINCT"],
        ans: 1,
        exp: "The WHERE clause filters records before they are grouped. The HAVING clause was added to SQL because the WHERE keyword could not be used with aggregate functions; it filters groups after aggregation.",
        topic: "SQL",
        difficulty: "Easy"
      },
      {
        q: "What type of index should be created on a column that contains completely unique values and matches the physical sorting order of rows?",
        opts: ["Clustered Index", "Non-Clustered Index", "Bitmap Index", "Secondary Index"],
        ans: 0,
        exp: "A Clustered Index determines the physical order of data rows in a table. Since the actual data rows can only be sorted in one order, there can be only one clustered index per table.",
        topic: "Indexing",
        difficulty: "Medium"
      },
      {
        q: "What is a Foreign Key in a relational database?",
        opts: ["A key that uniquely identifies a row in its own table", "A key in a table that references the primary key of another table", "A key used to speed up queries only", "A key generated automatically by the database system"],
        ans: 1,
        exp: "A Foreign Key establishes a relationship between tables by referencing the Primary Key of another table, ensuring referential integrity.",
        topic: "Keys",
        difficulty: "Easy"
      },
      {
        q: "Which SQL command is used to undo changes made during a transaction that has not yet been committed?",
        opts: ["COMMIT", "ROLLBACK", "REVOKE", "DELETE"],
        ans: 1,
        exp: "The ROLLBACK command cancels transactions that are not committed, restoring the database to its previous state.",
        topic: "Transactions",
        difficulty: "Easy"
      },
      {
        q: "What is the primary advantage of utilizing B-Tree structures for database indexing?",
        opts: ["They compress data significantly", "They guarantee O(log N) search, insertion, and deletion time complexity", "They prevent duplicate entries automatically", "They eliminate the need for primary keys"],
        ans: 1,
        exp: "B-Trees remain balanced, guaranteeing logarithmic time complexity O(log N) for search, insert, and delete operations, which is ideal for disks.",
        topic: "Indexing",
        difficulty: "Hard"
      },
      {
        q: "Which definition describes Boyce-Codd Normal Form (BCNF)?",
        opts: ["Every attribute must be prime", "No partial dependencies are allowed", "For every non-trivial functional dependency X -> Y, X must be a super key", "There are no multi-valued dependencies"],
        ans: 2,
        exp: "BCNF is a stronger version of 3NF. It requires that for any functional dependency X -> Y, X must be a super key.",
        topic: "Normalization",
        difficulty: "Hard"
      },
      {
        q: "Which SQL join returns all rows from both tables, matching columns where possible and filling with NULLs where there is no match?",
        opts: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"],
        ans: 3,
        exp: "FULL OUTER JOIN combines the results of both Left and Right outer joins, returning all rows from both tables, filling with NULLs for missing matches.",
        topic: "SQL",
        difficulty: "Medium"
      },
      {
        q: "Which SQL commands belong to the Data Definition Language (DDL)?",
        opts: ["SELECT, INSERT, UPDATE", "CREATE, ALTER, DROP", "GRANT, REVOKE", "COMMIT, ROLLBACK"],
        ans: 1,
        exp: "DDL commands define/modify database schema structures (CREATE, ALTER, DROP). DML handles table records (INSERT, UPDATE, DELETE).",
        topic: "SQL",
        difficulty: "Medium"
      }
    ],
    os: [
      {
        q: "What condition occurs when two or more processes are blocked indefinitely, each waiting for a resource held by the other?",
        opts: ["Thrashing", "Starvation", "Deadlock", "Segmentation"],
        ans: 2,
        exp: "Deadlock is a state where processes cannot progress because each holds a resource while requesting another resource held by another process. The four Coffman conditions are mutual exclusion, hold & wait, no preemption, and circular wait.",
        topic: "Deadlocks",
        difficulty: "Medium"
      },
      {
        q: "What is Virtual Memory mainly used to achieve?",
        opts: ["Increase CPU processing cores speed", "Allow execution of programs larger than physical RAM", "Reduce database query latency", "Secure OS kernel files"],
        ans: 1,
        exp: "Virtual Memory maps user virtual addresses to physical RAM or secondary disk storage (swap space), enabling the execution of processes that require more memory space than the physical RAM installed on the machine.",
        topic: "Memory Management",
        difficulty: "Easy"
      },
      {
        q: "Which scheduling algorithm can cause starvation for longer processes?",
        opts: ["Round Robin", "First-Come, First-Served (FCFS)", "Shortest Job First (SJF)", "Priority Scheduling (without aging)"],
        ans: 2,
        exp: "SJF schedules processes with the shortest burst time first. If a continuous stream of short processes enters the queue, longer processes will wait indefinitely (starvation). Aging is needed to prevent this.",
        topic: "Scheduling",
        difficulty: "Medium"
      },
      {
        q: "What is the purpose of a Translation Lookaside Buffer (TLB)?",
        opts: ["Store files temporarily", "Cache page table page-to-frame translations for faster memory access", "Compile source code files", "Resolve system network protocols"],
        ans: 1,
        exp: "TLB is a small hardware cache inside the MMU that stores recent page-to-frame address translations. It bypasses double memory lookup overheads, speeding up virtual-to-physical translations.",
        topic: "Memory Management",
        difficulty: "Hard"
      },
      {
        q: "What does the term 'Thrashing' refer to in Operating Systems?",
        opts: ["A program throwing continuous exceptions", "The CPU spends more time swapping pages in/out of disk than executing processes", "Deleting temporary files from secondary storage", "Forcing unresponsive programs to shut down"],
        ans: 1,
        exp: "Thrashing occurs when virtual memory page replacement frequency is extremely high, causing the system to spend more time paging than executing actual instructions, degrading performance to near zero.",
        topic: "Virtual Memory",
        difficulty: "Hard"
      },
      {
        q: "Which primitive variable is utilized for controlling access to a shared resource in concurrent programming?",
        opts: ["Mutex / Semaphore", "Pointer", "Heap array", "Virtual cache page"],
        ans: 0,
        exp: "Semaphores and Mutexes are synchronization primitives used to manage mutual exclusion in critical sections, preventing race conditions.",
        topic: "Processes",
        difficulty: "Medium"
      },
      {
        q: "What is the primary resource-sharing difference between a Thread and a Process?",
        opts: ["Processes share memory, threads do not", "Threads share the memory and resources of their parent process, while processes have separate memory spaces", "Threads are compiled, processes are interpreted", "Processes run on physical CPUs, threads run on virtual virtual memory only"],
        ans: 1,
        exp: "A process is an isolated executing program with its own address space. Threads are sub-units of a process that share the process's code, data, and system resources.",
        topic: "Threads",
        difficulty: "Easy"
      },
      {
        q: "When does a Page Fault exception occur?",
        opts: ["When a program accesses a null pointer", "When a referenced virtual page is not currently loaded in physical RAM", "When the page file size exceeds storage capacity", "When the CPU cache suffers a line invalidation"],
        ans: 1,
        exp: "A page fault is an interrupt raised by the MMU hardware when a program accesses a page mapped in virtual address space but not loaded in physical memory frames.",
        topic: "Paging",
        difficulty: "Medium"
      },
      {
        q: "Which parameter controls time slicing in Round Robin CPU scheduling?",
        opts: ["CPU Burst time", "Context Switch latency", "Time Quantum", "Process Priority weight"],
        ans: 2,
        exp: "Round Robin schedules processes sequentially, giving each process a fixed slice of time called a Time Quantum. When it expires, the process is preempted.",
        topic: "Scheduling",
        difficulty: "Easy"
      },
      {
        q: "What is the main purpose of the Banker's Algorithm?",
        opts: ["To optimize file storage", "To avoid deadlocks dynamically by checking resource allocation states", "To encrypt user data", "To schedule network packets"],
        ans: 1,
        exp: "The Banker's Algorithm is a deadlock avoidance algorithm that checks if allocating requested resources will leave the system in a 'safe state'.",
        topic: "Deadlocks",
        difficulty: "Hard"
      }
    ],
    cn: [
      {
        q: "How many layers are defined in the standard Open Systems Interconnection (OSI) network reference model?",
        opts: ["4", "5", "7", "9"],
        ans: 2,
        exp: "The OSI reference model defines 7 distinct layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
        topic: "OSI Model",
        difficulty: "Easy"
      },
      {
        q: "What is the fundamental difference between the TCP and UDP transport layer protocols?",
        opts: ["TCP is faster than UDP", "TCP is connection-oriented and reliable, while UDP is connectionless and unreliable", "UDP supports encryption, TCP does not", "TCP works at Layer 3, UDP works at Layer 4"],
        ans: 1,
        exp: "TCP guarantees delivery via connection handshakes, sequences, and acknowledgments. UDP sends packets without handshakes or delivery guarantees, yielding faster, low-overhead transmission.",
        topic: "TCP/IP",
        difficulty: "Easy"
      },
      {
        q: "Which protocol is responsible for translating human-readable hostnames into machine-readable IP addresses?",
        opts: ["HTTP", "ARP", "DNS", "DHCP"],
        ans: 2,
        exp: "DNS (Domain Name System) maps website names (like google.com) to corresponding network IP addresses.",
        topic: "DNS",
        difficulty: "Easy"
      },
      {
        q: "At which layer of the OSI model does a Router operate to route packets between different networks?",
        opts: ["Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7 (Application)"],
        ans: 1,
        exp: "Routers forward packets across networks using logical IP addresses, which are handled at Layer 3 (Network Layer).",
        topic: "Routing",
        difficulty: "Medium"
      },
      {
        q: "Which cryptographic protocols secure communications over HTTP, turning it into HTTPS?",
        opts: ["SSH / SFTP", "SSL / TLS", "WEP / WPA", "MD5 / SHA"],
        ans: 1,
        exp: "HTTPS encrypts normal HTTP packets using Secure Sockets Layer (SSL) or Transport Layer Security (TLS) cryptosystems.",
        topic: "HTTPS",
        difficulty: "Medium"
      },
      {
        q: "What is the standard loopback IP address in IPv4 networks, used to test local network adapters?",
        opts: ["192.168.1.1", "10.0.0.1", "127.0.0.1", "255.255.255.255"],
        ans: 2,
        exp: "127.0.0.1 is the standard loopback address representing the local machine in IPv4.",
        topic: "IP Addressing",
        difficulty: "Easy"
      },
      {
        q: "Which layer of the OSI model is responsible for node-to-node frame delivery, physical addressing (MAC), and error control on physical media?",
        opts: ["Physical Layer", "Data Link Layer", "Network Layer", "Transport Layer"],
        ans: 1,
        exp: "The Data Link Layer packages bit streams into frames, handles hardware MAC addresses, and detects transmission errors.",
        topic: "OSI Model",
        difficulty: "Medium"
      },
      {
        q: "What are the flags used to establish a TCP session connection in the standard three-way handshake?",
        opts: ["SYN, SYN-ACK, ACK", "RST, FIN, ACK", "SYN, PSH, URG", "PING, PONG, ACK"],
        ans: 0,
        exp: "TCP connection setup sequence: Client sends SYN -> Server responds SYN-ACK -> Client acknowledges with ACK, establishing the connection.",
        topic: "TCP",
        difficulty: "Hard"
      },
      {
        q: "Which of the following protocol groups operate entirely within the Application Layer (Layer 7)?",
        opts: ["IP, ARP, ICMP", "TCP, UDP, SCTP", "HTTP, SMTP, DNS", "MAC, Ethernet, Wi-Fi"],
        ans: 2,
        exp: "HTTP, SMTP (mail transfer), and DNS (name resolution) are user-facing services residing in the Application layer.",
        topic: "OSI Model",
        difficulty: "Easy"
      },
      {
        q: "What is the primary function of the Dynamic Host Configuration Protocol (DHCP)?",
        opts: ["To route packets to external networks", "To assign IP addresses, gateway pathways, and DNS servers dynamically to hosts", "To monitor local network traffic", "To cache HTML pages locally"],
        ans: 1,
        exp: "DHCP automates network configuration, automatically leasing IP addresses to devices when they connect to a network.",
        topic: "TCP/IP",
        difficulty: "Easy"
      }
    ],
    oop: [
      {
        q: "Which Object-Oriented Programming concept wraps variables and methods together into a single unit and restricts direct access?",
        opts: ["Inheritance", "Encapsulation", "Polymorphism", "Abstraction"],
        ans: 1,
        exp: "Encapsulation bundles data (attributes) and code (methods) together and hides internal state details using access modifiers (private, protected).",
        topic: "Encapsulation",
        difficulty: "Easy"
      },
      {
        q: "What is the mechanism by which a child class acquires the properties and methods of a parent class?",
        opts: ["Polymorphism", "Abstraction", "Inheritance", "Overloading"],
        ans: 2,
        exp: "Inheritance enables a derived class to reuse variables and functions from a base class, establishing an 'is-a' relationship.",
        topic: "Inheritance",
        difficulty: "Easy"
      },
      {
        q: "Having multiple methods in the same class with the same name but different argument lists (signatures) is called:",
        opts: ["Method Overriding", "Method Overloading", "Encapsulation", "Polymorphism"],
        ans: 1,
        exp: "Method Overloading is a compile-time (static) polymorphism feature where same-named methods are distinguished by parameter count, type, or order.",
        topic: "Polymorphism",
        difficulty: "Easy"
      },
      {
        q: "Redefining a base class method inside a subclass with the exact same name, return type, and parameters is known as:",
        opts: ["Method Overloading", "Method Overriding", "Data Hiding", "Dynamic Casting"],
        ans: 1,
        exp: "Method Overriding is a runtime (dynamic) polymorphism feature where a subclass provides its own specific implementation of a parent class method.",
        topic: "Polymorphism",
        difficulty: "Easy"
      },
      {
        q: "Exposing only the essential interfaces of an object while hiding complex implementation details is known as:",
        opts: ["Abstraction", "Inheritance", "Encapsulation", "Garbage Collection"],
        ans: 0,
        exp: "Abstraction focuses on what an object does rather than how it does it, implemented using abstract classes and interfaces.",
        topic: "Abstraction",
        difficulty: "Easy"
      },
      {
        q: "What does the 'D' in the SOLID principles of Object-Oriented Design stand for?",
        opts: ["Data Abstraction", "Dependency Inversion Principle", "Decomposition Rule", "Design Pattern Isolation"],
        ans: 1,
        exp: "SOLID stands for Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. The Dependency Inversion Principle states high-level modules should depend on abstractions, not concretions.",
        topic: "SOLID",
        difficulty: "Hard"
      },
      {
        q: "What is the 'Diamond Problem' in Object-Oriented Programming?",
        opts: ["A memory leak caused by circular references", "Ambiguity when a class inherits from two parent classes that both inherit from the same base class", "An exception thrown when compiling abstract classes", "A type of database indexing deadlock"],
        ans: 1,
        exp: "The Diamond Problem occurs in multiple inheritance where a subclass inherits from two classes that override a method from a shared base class, creating ambiguity.",
        topic: "Inheritance",
        difficulty: "Medium"
      },
      {
        q: "What is a major conceptual difference between an Abstract Class and an Interface?",
        opts: ["Abstract classes cannot contain fields, interfaces can", "Interfaces can hold concrete state, abstract classes cannot", "Classes can implement multiple interfaces, but typically inherit from only one abstract class", "Abstract classes are resolved at compile-time, interfaces at runtime"],
        ans: 2,
        exp: "In most standard OOP languages, multiple inheritance of classes is prohibited (allowing only single inheritance from abstract classes), but implementing multiple interfaces is fully supported.",
        topic: "Abstraction",
        difficulty: "Medium"
      },
      {
        q: "What is the primary role of a Constructor in a class?",
        opts: ["To delete objects from the heap", "To allocate memory and initialize class member variables when an object is instantiated", "To call private methods outside the class", "To declare static constants"],
        ans: 1,
        exp: "Constructors are special member functions automatically called when an object is created to initialize its state.",
        topic: "Classes",
        difficulty: "Easy"
      },
      {
        q: "Method overloading is resolved at ______ time, whereas method overriding is resolved at ______ time.",
        opts: ["runtime, compile-time", "compile-time, runtime", "compilation, linking", "initialization, runtime"],
        ans: 1,
        exp: "Overloading is static/compile-time polymorphism. Overriding is dynamic/run-time polymorphism, determined by the actual object type at execution time.",
        topic: "Polymorphism",
        difficulty: "Hard"
      }
    ],
    prog: [
      {
        q: "What is critical to define in a recursive function to prevent an infinite loop and eventual Stack Overflow error?",
        opts: ["Return statement", "Base Case", "Global Variable", "Iteration counter"],
        ans: 1,
        exp: "The basecase defines the terminating condition that stops recursion from spawning further frames, avoiding call stack exhaustion.",
        topic: "Recursion",
        difficulty: "Easy"
      },
      {
        q: "What is the difference between 'Call by Value' and 'Call by Reference' parameter passing?",
        opts: ["Call by value passes copies, call by reference passes actual variable memory addresses", "Call by reference is slower than call by value", "Call by value modifies the original variable, call by reference does not", "There is no difference in modern languages"],
        ans: 0,
        exp: "Call by value replicates the argument (local changes do not affect caller). Call by reference passes the address, allowing modifications to propagate back.",
        topic: "Functions",
        difficulty: "Medium"
      },
      {
        q: "In exception handling, which block is guaranteed to execute regardless of whether an exception is thrown or caught?",
        opts: ["try", "catch", "finally", "throw"],
        ans: 2,
        exp: "The finally block executes unconditionally after try/catch, typically used to release resources (closing streams, database connections).",
        topic: "Exception Handling",
        difficulty: "Easy"
      },
      {
        q: "What is the worst-case Big-O time complexity of a function containing nested loops, where the inner loop runs N times for each iteration of the outer loop (which also runs N times)?",
        opts: ["O(N)", "O(N log N)", "O(N^2)", "O(2^N)"],
        ans: 2,
        exp: "Since the operation executes N times inside an outer loop running N times, total steps are N * N = N^2, yielding O(N^2) complexity.",
        topic: "Complexity",
        difficulty: "Easy"
      },
      {
        q: "Which collection data structure guarantees that no duplicate elements are stored?",
        opts: ["ArrayList", "LinkedList", "Set", "Stack"],
        ans: 2,
        exp: "A Set is a collection containing only unique values; inserting duplicate items has no effect.",
        topic: "Collections",
        difficulty: "Easy"
      },
      {
        q: "What is a local variable scope?",
        opts: ["Accessible anywhere in the program", "Accessible only within the block or function where it is declared", "Stored permanently in the database", "Defined inside a global class structure"],
        ans: 1,
        exp: "Local variables are bound to the stack frames or blocks where they are declared, and cannot be accessed outside.",
        topic: "Variables",
        difficulty: "Easy"
      },
      {
        q: "What is a Pointer variable in programming languages like C or C++?",
        opts: ["A reference to a function only", "A special data type representing floating points", "A variable that stores the memory address of another variable", "An index representing array bounds"],
        ans: 2,
        exp: "Pointers hold raw hex addresses of memory locations, allowing direct memory manipulation.",
        topic: "Variables",
        difficulty: "Medium"
      },
      {
        q: "What is the space complexity of a recursive algorithm that has a maximum recursion depth of N?",
        opts: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        ans: 2,
        exp: "Each recursive call allocates a stack frame to store local state. If the depth is N, N frames exist concurrently, giving O(N) space complexity.",
        topic: "Complexity",
        difficulty: "Hard"
      },
      {
        q: "When is a NullPointerException typically thrown?",
        opts: ["When dividing a number by zero", "When trying to access member fields or call methods on an object reference that is currently null", "When an array index exceeds its defined boundaries", "When the compiler cannot find a imported library file"],
        ans: 1,
        exp: "Invoking operations on variables that reference nothing (null) causes the runtime execution to throw a NullPointerException.",
        topic: "Exception Handling",
        difficulty: "Medium"
      },
      {
        q: "In almost all modern programming languages, arrays are indexed starting from what number?",
        opts: ["-1", "0", "1", "Random address"],
        ans: 1,
        exp: "Arrays are zero-indexed, representing element offsets from the base address of the array.",
        topic: "Collections",
        difficulty: "Easy"
      }
    ],
    quant: [
      {
        q: "A sum of money doubles itself in 5 years at simple interest. In how many years will it become 4 times itself at the same rate?",
        opts: ["10 years", "12 years", "15 years", "20 years"],
        ans: 2,
        exp: "Let Principal be P. If it doubles, Interest = P. S.I = P * R * 5 / 100 => R = 20%. To become 4 times, Interest = 3P. 3P = P * 20 * T / 100 => T = (3 * 100) / 20 = 15 years.",
        topic: "Percentages",
        difficulty: "Medium"
      },
      {
        q: "If 12 men can complete a project in 20 days, how many days will it take 15 men to complete the same project working at the same pace?",
        opts: ["14 days", "15 days", "16 days", "18 days"],
        ans: 2,
        exp: "Using formula M1 * D1 = M2 * D2 => 12 * 20 = 15 * D2 => D2 = 240 / 15 = 16 days.",
        topic: "Time & Work",
        difficulty: "Easy"
      },
      {
        q: "A train 150m long passes a telegraph post in 9 seconds. How long will it take to cross a bridge 250m long?",
        opts: ["15 seconds", "20.5 seconds", "24 seconds", "27 seconds"],
        ans: 2,
        exp: "Speed of train = Length / Time = 150 / 9 = 50/3 m/s. To cross the bridge, total distance to cover is Train Length + Bridge Length = 150 + 250 = 400m. Time = Distance / Speed = 400 / (50/3) = (400 * 3) / 50 = 24 seconds.",
        topic: "Time & Work",
        difficulty: "Medium"
      },
      {
        q: "Two cards are drawn from a pack of 52 cards. What is the probability that both cards are Kings?",
        opts: ["1/221", "2/221", "1/17", "4/663"],
        ans: 0,
        exp: "Number of ways to draw 2 Kings out of 4 is 4C2 = 6. Total ways to draw 2 cards is 52C2 = (52 * 51) / 2 = 1326. Probability = 6 / 1326 = 1 / 221.",
        topic: "Probability",
        difficulty: "Hard"
      },
      {
        q: "A product is purchased for ₹500 and sold for ₹600. What is the profit percentage?",
        opts: ["10%", "15%", "20%", "25%"],
        ans: 2,
        exp: "Profit = Selling Price - Cost Price = 600 - 500 = ₹100. Profit % = (Profit / Cost Price) * 100 = (100 / 500) * 100 = 20%.",
        topic: "Profit & Loss",
        difficulty: "Easy"
      },
      {
        q: "What is 20% of 250?",
        opts: ["40", "45", "50", "60"],
        ans: 2,
        exp: "20% of 250 = (20 / 100) * 250 = 50.",
        topic: "Percentages",
        difficulty: "Easy"
      },
      {
        q: "If speed is increased by 25%, by what percentage does the time taken to cover the same distance decrease?",
        opts: ["20%", "25%", "15%", "30%"],
        ans: 0,
        exp: "Time is inversely proportional to speed. New speed = 1.25 * S. New time = T / 1.25 = 0.8 * T, which is a 20% decrease.",
        topic: "Percentages",
        difficulty: "Hard"
      },
      {
        q: "A bag contains 5 red and 3 blue balls. If two balls are drawn at random, what is the probability that one is red and one is blue?",
        opts: ["15/28", "15/56", "3/8", "5/8"],
        ans: 0,
        exp: "Total balls = 8. Ways to choose 2 = 8C2 = 28. Ways to choose 1 red and 1 blue = 5C1 * 3C1 = 15. Probability = 15 / 28.",
        topic: "Probability",
        difficulty: "Hard"
      },
      {
        q: "If the ratio of two numbers is 2:3 and their sum is 50, what is the smaller number?",
        opts: ["15", "20", "25", "30"],
        ans: 1,
        exp: "Let numbers be 2x and 3x. 2x + 3x = 50 => 5x = 50 => x = 10. Smaller number is 2x = 2 * 10 = 20.",
        topic: "Ratio",
        difficulty: "Easy"
      },
      {
        q: "What is the average of the first five prime numbers?",
        opts: ["5.0", "5.6", "6.2", "4.8"],
        ans: 1,
        exp: "First five prime numbers are 2, 3, 5, 7, 11. Sum = 2 + 3 + 5 + 7 + 11 = 28. Average = 28 / 5 = 5.6.",
        topic: "Ratio",
        difficulty: "Medium"
      }
    ],
    logical: [
      {
        q: "Find the missing number in the series: 2, 4, 8, 16, ?",
        opts: ["20", "24", "32", "40"],
        ans: 2,
        exp: "Each number in the sequence is double the preceding number (multiplied by 2). So, 16 * 2 = 32.",
        topic: "Number Series",
        difficulty: "Easy"
      },
      {
        q: "Choose the odd one out from the following options:",
        opts: ["Apple", "Mango", "Carrot", "Banana"],
        ans: 2,
        exp: "Apple, Mango, and Banana are fruits, while Carrot is a root vegetable.",
        topic: "Logical Patterns",
        difficulty: "Easy"
      },
      {
        q: "If CAT is coded as DBU in a certain cipher, how will DOG be coded?",
        opts: ["EPH", "EOG", "DPH", "FPI"],
        ans: 0,
        exp: "Each letter is shifted forward by 1 position: C->D, A->B, T->U. For DOG: D->E, O->P, G->H. So it is EPH.",
        topic: "Coding-Decoding",
        difficulty: "Easy"
      },
      {
        q: "If all roses are flowers, and some flowers are red, which of the following statements is definitely true?",
        opts: ["All roses are red", "Some roses are red", "All roses are flowers", "No roses are red"],
        ans: 2,
        exp: "Based on the premises, 'All roses are flowers' is a given truth. We cannot deduce the red color of roses from the statement 'some flowers are red'.",
        topic: "Syllogisms",
        difficulty: "Medium"
      },
      {
        q: "Find the next letter in the pattern: A, C, E, G, ?",
        opts: ["H", "I", "J", "K"],
        ans: 1,
        exp: "The letters skip one alphabet each time: A (+2) -> C (+2) -> E (+2) -> G (+2) -> I.",
        topic: "Number Series",
        difficulty: "Easy"
      },
      {
        q: "A is taller than B. B is taller than C. D is taller than A. Who is the shortest?",
        opts: ["A", "B", "C", "D"],
        ans: 2,
        exp: "Ordering by height: D > A > B > C. C is the shortest of them all.",
        topic: "Puzzles",
        difficulty: "Medium"
      },
      {
        q: "If Monday is coded as 1, Tuesday as 2, and Wednesday as 3, what is the code for Friday?",
        opts: ["4", "5", "6", "7"],
        ans: 1,
        exp: "The coding maps weekdays to their numerical order in the week (Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5).",
        topic: "Coding-Decoding",
        difficulty: "Easy"
      },
      {
        q: "Find the missing number: 3, 6, 9, 12, ?",
        opts: ["13", "14", "15", "16"],
        ans: 2,
        exp: "The series increments by 3 at each step. 12 + 3 = 15.",
        topic: "Number Series",
        difficulty: "Easy"
      },
      {
        q: "If SOUTH is written as HTUOS, how is NORTH written?",
        opts: ["HTRON", "HTRNO", "HTORN", "HRTON"],
        ans: 0,
        exp: "The word is written in reverse letter order. SOUTH -> HTUOS. NORTH -> HTRON.",
        topic: "Coding-Decoding",
        difficulty: "Easy"
      },
      {
        q: "Which number in the following sequence does NOT belong: 2, 4, 8, 16, 31?",
        opts: ["2", "8", "16", "31"],
        ans: 3,
        exp: "The sequence doubles at each step (2, 4, 8, 16, 32). 31 is the incorrect number.",
        topic: "Logical Patterns",
        difficulty: "Medium"
      }
    ],
    verbal: [
      {
        q: "Choose the synonym of the word: Rapid",
        opts: ["Slow", "Fast", "Heavy", "Late"],
        ans: 1,
        exp: "'Rapid' means fast or happening in a short time.",
        topic: "Vocabulary",
        difficulty: "Easy"
      },
      {
        q: "Choose the antonym of the word: Ancient",
        opts: ["Old", "Historic", "Modern", "Traditional"],
        ans: 2,
        exp: "'Ancient' means very old. The opposite (antonym) is 'Modern'.",
        topic: "Vocabulary",
        difficulty: "Easy"
      },
      {
        q: "Choose the grammatically correct sentence from the following options:",
        opts: ["She go to college.", "She goes to college.", "She going to college.", "She gone to college."],
        ans: 1,
        exp: "With third-person singular subjects (She), the verb takes -s/-es in simple present tense: 'She goes to college.'",
        topic: "Grammar",
        difficulty: "Easy"
      },
      {
        q: "Fill in the blank with the appropriate preposition: 'He is extremely good _____ mathematics.'",
        opts: ["in", "at", "on", "with"],
        ans: 1,
        exp: "The correct preposition combination is 'good at' something (e.g. good at mathematics).",
        topic: "Grammar",
        difficulty: "Easy"
      },
      {
        q: "What is the correct plural form of the word 'Child'?",
        opts: ["Childs", "Children", "Childrens", "Childes"],
        ans: 1,
        exp: "The plural of 'child' is irregular and is 'children'.",
        topic: "Grammar",
        difficulty: "Easy"
      },
      {
        q: "Choose the correctly spelled word from the options:",
        opts: ["Recieve", "Receive", "Receeve", "Receve"],
        ans: 1,
        exp: "The correct spelling is 'Receive' (following the rule 'i before e except after c').",
        topic: "Sentence Correction",
        difficulty: "Easy"
      },
      {
        q: "What is the definition of the word 'Benevolent'?",
        opts: ["Kind and generous", "Angry and hostile", "Lazy and passive", "Confused and disoriented"],
        ans: 0,
        exp: "'Benevolent' means kind, well-meaning, and generous.",
        topic: "Vocabulary",
        difficulty: "Medium"
      },
      {
        q: "Identify the correct article to fill the blank: 'He is _____ honest person.'",
        opts: ["a", "an", "the", "no article needed"],
        ans: 1,
        exp: "The word 'honest' starts with a silent 'h' and has a vowel sound ('on-est'), so 'an' is appropriate.",
        topic: "Grammar",
        difficulty: "Easy"
      },
      {
        q: "Identify the noun in the sentence: 'The student solved the problem quickly.'",
        opts: ["solved", "quickly", "student", "solved"],
        ans: 2,
        exp: "'Student' is a common noun representing a person. 'Problem' is also a noun, but 'student' is the selected option here.",
        topic: "Grammar",
        difficulty: "Easy"
      },
      {
        q: "Which word is closest in meaning to the word 'Essential'?",
        opts: ["Optional", "Necessary", "Unusual", "Temporary"],
        ans: 1,
        exp: "'Essential' means absolutely necessary, indispensable, or extremely important.",
        topic: "Vocabulary",
        difficulty: "Easy"
      }
    ]
  };

  /* =========================================================
     COMPUTED STATES & HANDLERS
  ========================================================= */

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [correctOptionIdx, setCorrectOptionIdx] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [fetchingRec, setFetchingRec] = useState(false);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  const recommendation = performanceData?.recommendation || null;

  const categoryIdToName = {
    dsa: 'Data Structures',
    algo: 'Algorithms',
    dbms: 'DBMS / SQL',
    os: 'Operating Systems',
    cn: 'Computer Networks',
    oop: 'Object-Oriented Programming',
    prog: 'Programming Fundamentals',
    quant: 'Quantitative Aptitude',
    logical: 'Logical Reasoning',
    verbal: 'Verbal Ability'
  };

  const categoryNameToId = {
    'Data Structures': 'dsa',
    'Algorithms': 'algo',
    'DBMS / SQL': 'dbms',
    'Operating Systems': 'os',
    'Computer Networks': 'cn',
    'Object-Oriented Programming': 'oop',
    'Programming Fundamentals': 'prog',
    'Quantitative Aptitude': 'quant',
    'Logical Reasoning': 'logical',
    'Verbal Ability': 'verbal'
  };

  const loadRecommendation = async () => {
    if (!currentUser?.uid) return;
    setFetchingRec(true);
    try {
      const localAttempts = localStorage.getItem(`assessment_attempts_${currentUser.uid}`);
      let url = `/api/v1/assessment/performance?user_id=${currentUser.uid}`;
      if (localAttempts) {
        url += `&attempts_json=${encodeURIComponent(localAttempts)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (err) {
      console.warn("[Aptitude] Failed to fetch practice recommendation:", err);
    } finally {
      setFetchingRec(false);
    }
  };

  // Fetch performance recommendations
  useEffect(() => {
    loadRecommendation();
  }, [currentUser, userProfile]);

  // Client-side Firestore attempts logging
  const logAttemptToFirestore = async (attemptData) => {
    if (!currentUser?.uid) return;
    try {
      const userAttemptsRef = collection(db, 'users', currentUser.uid, 'assessmentAttempts');
      await addDoc(userAttemptsRef, {
        ...attemptData,
        userId: currentUser.uid,
        timestamp: serverTimestamp()
      });
      console.log("[Aptitude] Attempt written to Firestore.");
    } catch (error) {
      console.warn("[Aptitude] Firestore logging blocked. Storing locally:", error.message);
      const localKey = `assessment_attempts_${currentUser.uid}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      existing.push({
        ...attemptData,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(localKey, JSON.stringify(existing));
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (activeFilter === 'All') return categories;
    return categories.filter(cat => categoryStyles[cat.id]?.type === activeFilter);
  }, [activeFilter, categories]);

  // Overall progress statistics calculated from user profile / attempts data
  const stats = useMemo(() => {
    if (performanceData && performanceData.total_attempted > 0) {
      const accuracyMap = performanceData.category_accuracy || {};
      const attemptedCount = Object.keys(accuracyMap).length;
      
      return {
        overallProgress: Math.round(performanceData.overall_accuracy),
        topicsCovered: attemptedCount,
        questionsSolved: performanceData.total_attempted
      };
    }
    
    const savedCategories = userProfile?.aptitudeStats?.categories || {};
    const scores = categories
      .map((cat) => savedCategories[cat.id])
      .filter((score) => typeof score === 'number');

    const topicsCount = scores.length;
    const progress = topicsCount === 0 
      ? 0 
      : Math.round(scores.reduce((sum, val) => sum + val, 0) / topicsCount);
    
    return {
      overallProgress: progress,
      topicsCovered: topicsCount,
      questionsSolved: userProfile?.aptitudeStats?.questionsSolved || 0
    };
  }, [performanceData, userProfile, categories]);

  // Quiz initiation
  const startQuiz = async (catId) => {
    setSelectedCategory(catId);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
    setCorrectOptionIdx(null);
    setCurrentExplanation("");
    setUsingLocalFallback(false);
    
    // Explicit Verbal Ability local fallback bypass (0 items in preprocessed dataset)
    if (catId === 'verbal') {
      const localPool = questionsPool[catId] || [];
      const shuffled = [...localPool].sort(() => 0.5 - Math.random()).slice(0, 10);
      const mapped = shuffled.map((q, idx) => ({
        question_id: `local_verbal_${idx}`,
        q: q.q,
        opts: q.opts,
        ans: q.ans,
        exp: q.exp,
        topic: q.topic,
        difficulty: q.difficulty,
        isLocal: true
      }));
      setCurrentQuestions(mapped);
      setQuestionStartTime(Date.now());
      return;
    }
    
    setLoadingQuiz(true);
    try {
      const localAttempts = localStorage.getItem(`assessment_attempts_${currentUser?.uid}`);
      let url = `/api/v1/assessment/questions?category=${encodeURIComponent(categoryIdToName[catId])}&limit=10`;
      if (currentUser?.uid) {
        url += `&user_id=${currentUser.uid}`;
      }
      if (localAttempts) {
        url += `&attempts_json=${encodeURIComponent(localAttempts)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const mapped = data.map(item => ({
            question_id: item.question_id,
            q: item.question_text,
            opts: [item.option_a, item.option_b, item.option_c, item.option_d],
            topic: item.topic,
            difficulty: item.difficulty,
            isLocal: false
          }));
          setCurrentQuestions(mapped);
          setQuestionStartTime(Date.now());
          setLoadingQuiz(false);
          return;
        }
      }
      throw new Error("Empty questions payload");
    } catch (err) {
      console.warn("[Aptitude] Questions fetch failed. Triggering local backup:", err);
      setUsingLocalFallback(true);
      const localPool = questionsPool[catId] || [];
      const shuffled = [...localPool].sort(() => 0.5 - Math.random()).slice(0, 10);
      const mapped = shuffled.map((q, idx) => ({
        question_id: `local_${catId}_${idx}`,
        q: q.q,
        opts: q.opts,
        ans: q.ans,
        exp: q.exp,
        topic: q.topic,
        difficulty: q.difficulty,
        isLocal: true
      }));
      setCurrentQuestions(mapped);
      setQuestionStartTime(Date.now());
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Option selection handler
  const handleOptionSelect = (optIndex) => {
    if (isAnswered) return;
    setSelectedOption(optIndex);
  };

  // Submit current answer
  const handleSubmitAnswer = async () => {
    if (selectedOption === null) return;
    
    const currentQ = currentQuestions[currentIdx];
    const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    
    if (currentQ.isLocal) {
      const isCorrect = (selectedOption === currentQ.ans);
      setCorrectOptionIdx(currentQ.ans);
      setCurrentExplanation(currentQ.exp);
      setIsAnswered(true);
      
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
      
      const attemptData = {
        question_id: currentQ.question_id,
        category: categoryIdToName[selectedCategory],
        topic: currentQ.topic,
        difficulty: currentQ.difficulty,
        selected_option: selectedOption,
        correct_option: ["A", "B", "C", "D"][currentQ.ans],
        is_correct: isCorrect,
        time_taken_seconds: timeTaken,
        attempt_number: 1
      };
      await logAttemptToFirestore(attemptData);
      
    } else {
      try {
        const response = await fetch('/api/v1/assessment/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: currentQ.question_id,
            selected_option: selectedOption,
            time_taken_seconds: timeTaken,
            attempt_number: 1
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const correctIdx = ["A", "B", "C", "D"].indexOf(result.correct_answer);
          setCorrectOptionIdx(correctIdx);
          setCurrentExplanation(result.explanation || "No explanation provided.");
          setIsAnswered(true);
          
          if (result.is_correct) {
            setScore((prev) => prev + 1);
          }
          
          const attemptData = {
            question_id: currentQ.question_id,
            category: result.category,
            topic: result.topic,
            difficulty: result.difficulty,
            selected_option: selectedOption,
            correct_option: result.correct_answer,
            is_correct: result.is_correct,
            time_taken_seconds: timeTaken,
            attempt_number: 1
          };
          await logAttemptToFirestore(attemptData);
        } else {
          throw new Error("Check failed");
        }
      } catch (err) {
        console.error("[Aptitude] Attempt verification failed:", err);
        setCorrectOptionIdx(0);
        setCurrentExplanation("Offline fallback: Connection failed.");
        setIsAnswered(true);
      }
    }
  };

  // Next question or finish quiz
  const handleNext = () => {
    if (currentIdx < currentQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setCorrectOptionIdx(null);
      setCurrentExplanation("");
      setQuestionStartTime(Date.now());
    } else {
      setQuizFinished(true);

      const scorePct = Math.round((score / currentQuestions.length) * 100);
      const prevSolved = userProfile?.aptitudeStats?.questionsSolved || 0;
      const categoriesCopy = { ...(userProfile?.aptitudeStats?.categories || {}) };

      const prevBest = categoriesCopy[selectedCategory] || 0;
      categoriesCopy[selectedCategory] = Math.max(prevBest, scorePct);

      updateUserStats({
        aptitudeStats: {
          questionsSolved: prevSolved + currentQuestions.length,
          categories: categoriesCopy
        }
      }).then(() => {
        loadRecommendation();
      });
    }
  };

  // Reset quiz states completely
  const exitQuiz = () => {
    setSelectedCategory(null);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
    setCorrectOptionIdx(null);
    setCurrentExplanation("");
  };

  // Pick recommendation: returns first unattempted, or lowest scoring category
  const startRecommendation = () => {
    const savedCategories = userProfile?.aptitudeStats?.categories || {};
    const unattempted = categories.find(cat => savedCategories[cat.id] === undefined);
    if (unattempted) {
      startQuiz(unattempted.id);
      return;
    }
    let lowestCat = categories[0];
    let lowestScore = savedCategories[lowestCat.id] || 0;
    categories.forEach(cat => {
      const s = savedCategories[cat.id] || 0;
      if (s < lowestScore) {
        lowestScore = s;
        lowestCat = cat;
      }
    });
    startQuiz(lowestCat.id);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="animate-slide-up">
      
      {/* Page Hero Banner */}
      <PageHero 
        badge="SKILL TEST"
        title="Aptitude & Technical Prep"
        subtitle="Strengthen your DSA, DBMS, OS, and technical problem-solving skills for placement tests."
        supportingLine="Every question solved is one step closer to being placement-ready."
      />

      <div style={{ padding: '32px 40px 40px 40px', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

      {!selectedCategory ? (
        /* Dashboard Selection Screen */
        <div>
          
          {/* Section 1: PLACEMENT READINESS (Top Summary Section) */}
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
              PREP AI Readiness Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              
              <div style={{ borderRight: '1px solid #F1F5F9', paddingRight: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Overall Progress</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{stats.overallProgress}%</span>
                  <div style={{ flexGrow: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.overallProgress}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>

              <div style={{ borderRight: '1px solid #F1F5F9', paddingRight: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Topics Covered</span>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-purple)' }}>{stats.topicsCovered}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: '700' }}>/ 10 Topics</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Questions Solved</span>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-emerald)' }}>{stats.questionsSolved}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: '600' }}>MCQs Completed</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: RECOMMENDED FOR YOU */}
          <div className="glass-panel" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(138, 112, 214, 0.03) 0%, rgba(6, 182, 212, 0.03) 100%)', border: '1px solid rgba(138, 112, 214, 0.1)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '28px' }}>🤖</span>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                  RECOMMENDED FOR YOU
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
                  {recommendation 
                    ? `Practice: ${recommendation.recommended_category} (${recommendation.recommended_topic} - ${recommendation.recommended_difficulty}). Reason: ${recommendation.reason}`
                    : 'Start with a topic to build your comprehensive placement assessment profile.'}
                </p>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                if (recommendation && recommendation.recommended_category) {
                  const targetId = categoryNameToId[recommendation.recommended_category];
                  if (targetId) {
                    startQuiz(targetId);
                  } else {
                    startRecommendation();
                  }
                } else {
                  startRecommendation();
                }
              }} 
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              Start Assessment →
            </button>
          </div>

          {/* Performance Analytics Section */}
          <div style={{ marginTop: '32px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.8px', marginBottom: '16px', textTransform: 'uppercase' }}>
              Performance Analytics & Diagnostics
            </h3>
            
            {!performanceData || performanceData.total_attempted === 0 ? (
              /* Empty State */
              <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF', textAlign: 'center', border: '1px dashed #CBD5E1' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📊</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  Start your first assessment to unlock performance analytics.
                </p>
              </div>
            ) : (
              /* Performance Content */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 5 Stats Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  
                  {/* Card 1: Overall Accuracy */}
                  <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall Accuracy</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-cyan)', marginTop: '8px' }}>
                      {performanceData.overall_accuracy}%
                    </span>
                  </div>

                  {/* Card 2: Questions Solved */}
                  <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Questions Solved</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-emerald)', marginTop: '8px' }}>
                      {performanceData.total_attempted}
                    </span>
                  </div>

                  {/* Card 3: Avg Response Time */}
                  <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Avg Time / Q</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-purple)', marginTop: '8px' }}>
                      {performanceData.average_response_time}s
                    </span>
                  </div>

                  {/* Card 4: Strongest Topic */}
                  <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Strongest Topic</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534', marginTop: '8px', wordBreak: 'break-word' }}>
                      {performanceData.strongest_topics && performanceData.strongest_topics.length > 0 
                        ? performanceData.strongest_topics[0] 
                        : 'N/A'}
                    </span>
                  </div>

                  {/* Card 5: Needs Practice */}
                  <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Needs Practice</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#9B1C1C', marginTop: '8px', wordBreak: 'break-word' }}>
                      {performanceData.weakest_topics && performanceData.weakest_topics.length > 0 
                        ? performanceData.weakest_topics[0] 
                        : 'N/A'}
                    </span>
                  </div>

                </div>

                {/* Grid for Splits: Categories list (left/center) and Difficulty + Topics (right) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  
                  {/* Category Performance Card */}
                  <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
                      Category Performance
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {categories.map((cat) => {
                        const score = performanceData.category_accuracy[cat.name];
                        const count = performanceData.category_attempts[cat.name] || 0;
                        
                        return (
                          <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{cat.name}</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontWeight: '600' }}>
                                {score !== undefined ? `${count} question${count !== 1 ? 's' : ''} — ${score}% accuracy` : 'Not attempted'}
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: score !== undefined ? `${score}%` : '0%', 
                                height: '100%', 
                                background: score !== undefined 
                                  ? (score >= 70 ? 'var(--accent-emerald)' : score >= 50 ? 'var(--accent-cyan)' : 'var(--accent-pink)')
                                  : '#E2E8F0', 
                                borderRadius: '3px', 
                                transition: 'width 0.4s ease' 
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side: Topic Accuracy & Evaluation by Difficulty */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Topic Diagnostics Panel */}
                    <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <h4 style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
                        Topic Diagnostics
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                            Strongest Topics
                          </span>
                          {performanceData.strongest_topics && performanceData.strongest_topics.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {performanceData.strongest_topics.slice(0, 3).map((topic, idx) => (
                                <li key={idx} style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                                  ✓ {topic} — {performanceData.topic_accuracy[topic]}%
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>No strong topics yet.</span>
                          )}
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#9B1C1C', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                            Needs Practice
                          </span>
                          {performanceData.weakest_topics && performanceData.weakest_topics.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {performanceData.weakest_topics.slice(0, 3).map((topic, idx) => (
                                <li key={idx} style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                                  ! {topic} — {performanceData.topic_accuracy[topic]}%
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>No weak topics yet.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Evaluation by Difficulty Panel */}
                    <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <h4 style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
                        Evaluation by Difficulty
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {['Easy', 'Medium', 'Hard'].map((level) => {
                          const score = performanceData.difficulty_accuracy[level];
                          const count = performanceData.difficulty_attempts[level] || 0;
                          
                          return (
                            <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{level}</span>
                              <span style={{ color: score !== undefined ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: '700' }}>
                                {score !== undefined ? `${count} attempt${count !== 1 ? 's' : ''} — ${score}%` : 'No attempts'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}
          </div>

          {/* Filter view controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.8px', margin: 0, textTransform: 'uppercase' }}>
              Select Topic
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Technical', 'Aptitude'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`btn ${activeFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 16px', fontSize: '12.5px' }}
                >
                  {filter === 'All' ? 'All Topics ▼' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of preparation categories */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {filteredCategories.map((cat) => {
              const prevScore = userProfile?.aptitudeStats?.categories?.[cat.id];
              const styles = categoryStyles[cat.id] || { bg: '#FFFFFF', iconBg: '#F1F5F9', textColor: 'var(--text-primary)', tagBg: '#F1F5F9', tags: [] };
              
              return (
                <div 
                  key={cat.id}
                  className="glass-card" 
                  onClick={() => startQuiz(cat.id)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '210px',
                    background: styles.bg,
                    border: '1px solid rgba(226, 232, 240, 0.7)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ 
                        fontSize: '28px', 
                        width: '46px', 
                        height: '46px', 
                        background: styles.iconBg, 
                        borderRadius: '10px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        {cat.icon}
                      </div>
                      
                      {/* Topic Tags */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
                        {styles.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} style={{ 
                            fontSize: '9.5px', 
                            fontWeight: '700', 
                            background: styles.tagBg, 
                            color: styles.textColor, 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {cat.name}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>
                      {cat.description}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>
                      {prevScore !== undefined ? `Best Score: ${prevScore}%` : 'Not Attempted'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: styles.textColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Start →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* Quiz Mode */
        <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Quiz Active Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <button 
              onClick={exitQuiz} 
              className="btn-text" 
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', background: 'none', color: 'var(--accent-cyan)', fontWeight: '700' }}
            >
              <span>◀ Exit Quiz</span>
            </button>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '800' }}>
                {categories.find(c => c.id === selectedCategory)?.name}
              </span>
              {!quizFinished && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>
                  Question {currentIdx + 1} of {currentQuestions.length}
                </div>
              )}
            </div>
          </div>

          {loadingQuiz ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(138, 112, 214, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px', fontWeight: '600' }}>Loading questions...</p>
            </div>
          ) : !quizFinished ? (
            /* Active MCQ Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                <div style={{ width: `${((currentIdx + 1) / currentQuestions.length) * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>

              {/* Difficulty & Sub-Topic Header */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                <span>Difficulty: <span style={{ color: currentQuestions[currentIdx].difficulty === 'Hard' ? 'var(--accent-pink)' : currentQuestions[currentIdx].difficulty === 'Medium' ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>{currentQuestions[currentIdx].difficulty}</span></span>
                <span>•</span>
                <span>Topic: {currentQuestions[currentIdx].topic}</span>
              </div>

              {/* Question */}
              <h3 style={{ fontSize: '16.5px', fontWeight: '650', color: 'var(--text-primary)', lineHeight: '1.6', margin: '6px 0' }}>
                {currentQuestions[currentIdx].q}
              </h3>

              {/* Options list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestions[currentIdx].opts.map((opt, oIdx) => {
                  
                  // Color codes for answers
                  let borderStyle = '1px solid #E2E8F0';
                  let bgStyle = '#FFFFFF';
                  let colorStyle = 'var(--text-secondary)';

                  if (!isAnswered) {
                    if (selectedOption === oIdx) {
                      borderStyle = '1px solid var(--accent-cyan)';
                      bgStyle = 'rgba(138, 112, 214, 0.05)';
                      colorStyle = 'var(--accent-cyan)';
                    }
                  } else {
                    const isCorrect = correctOptionIdx === oIdx;
                    const isSelected = selectedOption === oIdx;

                    if (isCorrect) {
                      borderStyle = '1px solid var(--accent-emerald)';
                      bgStyle = 'rgba(96, 182, 167, 0.08)';
                      colorStyle = 'var(--accent-emerald)';
                    } else if (isSelected) {
                      borderStyle = '1px solid var(--accent-pink)';
                      bgStyle = 'rgba(229, 140, 163, 0.08)';
                      colorStyle = 'var(--accent-pink)';
                    }
                  }

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleOptionSelect(oIdx)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '8px',
                        border: borderStyle,
                        background: bgStyle,
                        color: colorStyle,
                        cursor: isAnswered ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '13.5px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      className={!isAnswered ? "quiz-option-hover" : ""}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid currentColor',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                {!isAnswered ? (
                  <button 
                    disabled={selectedOption === null}
                    onClick={handleSubmitAnswer}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button 
                    onClick={handleNext}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                  >
                    <span>{currentIdx === currentQuestions.length - 1 ? 'Finish Test' : 'Next Question ➜'}</span>
                  </button>
                )}
              </div>

              {/* Concept explanation */}
              {isAnswered && (
                <div style={{
                  background: 'rgba(138, 112, 214, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '20px',
                  marginTop: '12px'
                }}>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-cyan)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Concept Explanation
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    {currentExplanation}
                  </p>
                </div>
              )}

            </div>
          ) : (
            /* Results Screen */
            <div style={{ textAlign: 'center', padding: '24px 0' }} className="animate-fade-in">
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>
                {Math.round((score / currentQuestions.length) * 100) >= 80 ? '🏆' : Math.round((score / currentQuestions.length) * 100) >= 50 ? '👍' : '📚'}
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Assessment Complete 🎉
              </h3>
              
              <div style={{
                fontSize: '48px',
                fontWeight: '800',
                color: 'var(--accent-cyan)',
                margin: '16px 0'
              }}>
                {Math.round((score / currentQuestions.length) * 100)}%
              </div>

              <div style={{ margin: '12px 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                  You scored <strong>{score}</strong> out of <strong>{currentQuestions.length}</strong> questions.
                </p>
                
                {/* Performance Badge */}
                <span className={`badge ${Math.round((score / currentQuestions.length) * 100) >= 80 ? 'badge-emerald' : Math.round((score / currentQuestions.length) * 100) >= 50 ? 'badge-amber' : 'badge-rose'}`} style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' }}>
                  Performance: {Math.round((score / currentQuestions.length) * 100) >= 80 ? 'Strong' : Math.round((score / currentQuestions.length) * 100) >= 50 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>

              {/* Stats card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', margin: '0 auto 32px auto', maxWidth: '440px', textAlign: 'left', fontSize: '13px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '10px' }}>
                  Metrics Details
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Correct Answers:</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>{score}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Incorrect Answers:</span>
                  <strong style={{ color: 'var(--accent-pink)' }}>{currentQuestions.length - score}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>Topics Assessed:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {[...new Set(currentQuestions.map(q => q.topic))].join(', ')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button onClick={() => startQuiz(selectedCategory)} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  Retake Test
                </button>
                <button onClick={exitQuiz} className="btn btn-secondary" style={{ padding: '10px 24px' }}>
                  Choose Another Category
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Responsive layout stylings and hovers */}
      <style dangerouslySetInnerHTML={{__html: `
        .quiz-option-hover:hover {
          background: rgba(138, 112, 214, 0.03) !important;
          border-color: var(--border-glass-hover) !important;
          color: var(--accent-cyan) !important;
          transform: translateY(-1px);
        }
        .glass-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .glass-card {
            min-height: 190px !important;
          }
        }
      `}} />

      </div>
    </div>
  );
}
