import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Aptitude() {
  const { userProfile, updateUserStats } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const categories = [
    { id: 'dsa', name: 'Data Structures', icon: '🌳', count: 4 },
    { id: 'algo', name: 'Algorithms', icon: '⏱️', count: 4 },
    { id: 'dbms', name: 'DBMS / SQL', icon: '🗄️', count: 4 },
    { id: 'os', name: 'Operating Systems', icon: '💻', count: 4 },
    { id: 'quant', name: 'Quantitative Aptitude', icon: '📊', count: 4 }
  ];

  const questionsPool = {
    dsa: [
      {
        q: "What is the worst-case time complexity of searching in a Hash Table?",
        opts: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        ans: 2,
        exp: "In the average case, hash table lookup is O(1). However, in the worst case (where all keys hash to the same bucket and cause collisions resolved by chaining), it degrades to searching a linked list of length N, which takes O(N) time."
      },
      {
        q: "Which data structure is mainy used for implementing BFS (Breadth-First Search) on graphs?",
        opts: ["Stack", "Queue", "Binary Tree", "Heap"],
        ans: 1,
        exp: "BFS visits nodes level-by-level. A Queue (FIFO) is used to track nodes that have been discovered but not yet fully explored, ensuring that closer nodes are visited before nodes that are further away."
      },
      {
        q: "In a min-heap, where is the minimum element located?",
        opts: ["Leaf node", "Root node", "Middle node", "Random node"],
        ans: 1,
        exp: "By definition, the min-heap property requires that the key of a node is less than or equal to the keys of its children. Thus, the absolute smallest element is always stored at the root (index 0)."
      },
      {
        q: "What is the relation between number of edges (E) and vertices (V) in a Tree graph?",
        opts: ["E = V", "E = V + 1", "E = V - 1", "E = 2V"],
        ans: 2,
        exp: "A tree is defined as an acyclic connected graph. A fundamental mathematical property of any tree is that it contains exactly V - 1 edges, where V is the count of vertices."
      }
    ],
    algo: [
      {
        q: "Which sorting algorithm has a stable worst-case time complexity of O(N log N)?",
        opts: ["Quick Sort", "Bubble Sort", "Merge Sort", "Insertion Sort"],
        ans: 2,
        exp: "Merge Sort consistently divides the array in half and merges them in linear time, yielding O(N log N) in best, average, and worst cases. Quick Sort's worst case is O(N^2) if pivot choices are highly unbalanced."
      },
      {
        q: "What design paradigm does Binary Search belong to?",
        opts: ["Greedy Method", "Dynamic Programming", "Divide and Conquer", "Backtracking"],
        ans: 2,
        exp: "Binary search repeatedly divides the search space in half (Divide), compares the target with the middle element (Conquer), and discards the invalid half. Thus, it follows Divide and Conquer."
      },
      {
        q: "Which algorithm is used to find the shortest path from a single source node to all other nodes in a weighted graph with positive weights?",
        opts: ["Prim's Algorithm", "Kruskal's Algorithm", "Dijkstra's Algorithm", "Floyd-Warshall Algorithm"],
        ans: 2,
        exp: "Dijkstra's algorithm is specifically designed for single-source shortest path calculation on graphs with non-negative edge weights. Prim and Kruskal find Minimum Spanning Trees (MSTs)."
      },
      {
        q: "What is the time complexity of the standard recursive Fibonacci algorithm without memoization?",
        opts: ["O(N)", "O(N log N)", "O(2^N)", "O(N^2)"],
        ans: 2,
        exp: "The recurrence relation is T(N) = T(N-1) + T(N-2) + O(1), which creates a recursive tree of height N. The number of calls doubles at each level, resulting in an exponential time complexity of O(2^N)."
      }
    ],
    dbms: [
      {
        q: "Which normal form requires that there are no partial dependencies (i.e. no non-prime attribute depends on a subset of a candidate key)?",
        opts: ["1NF", "2NF", "3NF", "BCNF"],
        ans: 1,
        exp: "A relation is in Second Normal Form (2NF) if it is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key. In other words, there are no partial dependencies."
      },
      {
        q: "What does the 'I' in ACID database transactions stand for?",
        opts: ["Inheritance", "Integration", "Isolation", "Indexation"],
        ans: 2,
        exp: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation ensures that concurrent execution of transactions leaves the database in the same state as if they were executed sequentially."
      },
      {
        q: "Which SQL clause is used to filter records AFTER an aggregation or GROUP BY operation?",
        opts: ["WHERE", "HAVING", "ORDER BY", "DISTINCT"],
        ans: 1,
        exp: "The WHERE clause filters records before they are grouped. The HAVING clause was added to SQL because the WHERE keyword could not be used with aggregate functions; it filters groups after aggregation."
      },
      {
        q: "What type of index should be created on a column that contains completely unique values and matches the physical sorting order of rows?",
        opts: ["Clustered Index", "Non-Clustered Index", "Bitmap Index", "Secondary Index"],
        ans: 0,
        exp: "A Clustered Index determines the physical order of data rows in a table. Since the actual data rows can only be sorted in one order, there can be only one clustered index per table."
      }
    ],
    os: [
      {
        q: "What condition occurs when two or more processes are blocked indefinitely, each waiting for a resource held by the other?",
        opts: ["Thrashing", "Starvation", "Deadlock", "Segmentation"],
        ans: 2,
        exp: "Deadlock is a state where processes cannot progress because each holds a resource while requesting another resource held by another process. The four Coffman conditions are mutual exclusion, hold & wait, no preemption, and circular wait."
      },
      {
        q: "What is Virtual Memory mainly used to achieve?",
        opts: ["Increase CPU processing cores speed", "Allow execution of programs larger than physical RAM", "Reduce database query latency", "Secure OS kernel files"],
        ans: 1,
        exp: "Virtual Memory maps user virtual addresses to physical RAM or secondary disk storage (swap space), enabling the execution of processes that require more memory space than the physical RAM installed on the machine."
      },
      {
        q: "Which scheduling algorithm can cause starvation for longer processes?",
        opts: ["Round Robin", "First-Come, First-Served (FCFS)", "Shortest Job First (SJF)", "Priority Scheduling (without aging)"],
        ans: 2,
        exp: "SJF schedules processes with the shortest burst time first. If a continuous stream of short processes enters the queue, longer processes will wait indefinitely (starvation). Aging is needed to prevent this."
      },
      {
        q: "What is the purpose of a Translation Lookaside Buffer (TLB)?",
        opts: ["Store files temporarily", "Cache page table page-to-frame translations for faster memory access", "Compile source code files", "Resolve system network protocols"],
        ans: 1,
        exp: "TLB is a small hardware cache inside the MMU that stores recent page-to-frame address translations. It bypasses double memory lookup overheads, speeding up virtual-to-physical translations."
      }
    ],
    quant: [
      {
        q: "A sum of money doubles itself in 5 years at simple interest. In how many years will it become 4 times itself at the same rate?",
        opts: ["10 years", "12 years", "15 years", "20 years"],
        ans: 2,
        exp: "Let Principal be P. If it doubles, Interest = P. S.I = P * R * 5 / 100 => R = 20%. To become 4 times, Interest = 3P. 3P = P * 20 * T / 100 => T = (3 * 100) / 20 = 15 years."
      },
      {
        q: "If 12 men can complete a project in 20 days, how many days will it take 15 men to complete the same project working at the same pace?",
        opts: ["14 days", "15 days", "16 days", "18 days"],
        ans: 2,
        exp: "Using formula M1 * D1 = M2 * D2 => 12 * 20 = 15 * D2 => D2 = 240 / 15 = 16 days."
      },
      {
        q: "A train 150m long passes a telegraph post in 9 seconds. How long will it take to cross a bridge 250m long?",
        opts: ["15 seconds", "20.5 seconds", "24 seconds", "27 seconds"],
        ans: 2,
        exp: "Speed of train = Length / Time = 150 / 9 = 50/3 m/s. To cross the bridge, total distance to cover is Train Length + Bridge Length = 150 + 250 = 400m. Time = Distance / Speed = 400 / (50/3) = (400 * 3) / 50 = 24 seconds."
      },
      {
        q: "Two cards are drawn from a pack of 52 cards. What is the probability that both cards are Kings?",
        opts: ["1/221", "2/221", "1/17", "4/663"],
        ans: 0,
        exp: "Number of ways to draw 2 Kings out of 4 is 4C2 = 6. Total ways to draw 2 cards is 52C2 = (52 * 51) / 2 = 1326. Probability = 6 / 1326 = 1 / 221."
      }
    ]
  };

  const startQuiz = (catId) => {
    setSelectedCategory(catId);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const currentQuestions = questionsPool[selectedCategory] || [];

  const handleOptionSelect = (optIndex) => {
    if (isAnswered) return;
    setSelectedOption(optIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    
    setIsAnswered(true);
    if (selectedOption === currentQuestions[currentIdx].ans) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    
    if (currentIdx < currentQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setQuizFinished(true);
      
      // Calculate score percentage
      const scorePct = Math.round((score / currentQuestions.length) * 100);
      
      // Save stats back to profile
      const prevSolved = userProfile?.aptitudeStats?.questionsSolved || 0;
      const categoriesCopy = { ...(userProfile?.aptitudeStats?.categories || {}) };
      categoriesCopy[selectedCategory] = scorePct;

      updateUserStats({
        aptitudeStats: {
          score: scorePct,
          questionsSolved: prevSolved + currentQuestions.length,
          categories: categoriesCopy
        }
      });
    }
  };

  return (
    <div className="main-content animate-slide-up" style={{ padding: '20px 0' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          <span className="text-gradient-cyan-blue">TECHNICAL & APTITUDE</span> PREPARATION
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: '500' }}>
          Test your domain knowledge on DSA, Database Normalization, operating system parameters, and quantitative metrics.
        </p>
      </div>

      {!selectedCategory ? (
        /* Category Selection Screen */
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '0.8px' }}>
            SELECT PREPARATION TOPIC
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '24px'
          }}>
            {categories.map((cat) => {
              const prevScore = userProfile?.aptitudeStats?.categories?.[cat.id];
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
                    minHeight: '170px',
                    background: '#FFFFFF'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{cat.icon}</div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{cat.name}</h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{cat.count} conceptual MCQs</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {prevScore !== undefined ? `Best Score: ${prevScore}%` : 'Not Attempted'}
                    </span>
                    <span className="text-gradient-cyan-blue" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Start ➜
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Quiz Interface */
        <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Header Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <button onClick={() => setSelectedCategory(null)} className="btn-text" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', background: 'none', color: 'var(--accent-cyan)', fontWeight: '600' }}>
              <span>◀ Exit Quiz</span>
            </button>
            <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
              Q {currentIdx + 1} of {currentQuestions.length}
            </span>
          </div>

          {!quizFinished ? (
            /* Active Question View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Question Text */}
              <h3 style={{ fontSize: '16.5px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.6' }}>
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
                    const isCorrect = currentQuestions[currentIdx].ans === oIdx;
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
                        transition: 'all var(--transition-fast)'
                      }}
                      className={!isAnswered ? "quiz-option-hover" : ""}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
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

              {/* Step-by-Step explanation */}
              {isAnswered && (
                <div style={{
                  background: 'rgba(138, 112, 214, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '20px',
                  marginTop: '16px',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    CONCEPT EXPLANATION
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {currentQuestions[currentIdx].exp}
                  </p>
                </div>
              )}

            </div>
          ) : (
            /* Results Screen */
            <div style={{ textAlign: 'center', padding: '24px 0' }} className="animate-fade-in">
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏆</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Test Completed!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px' }}>
                You scored **{score}** out of **{currentQuestions.length}** questions.
              </p>

              <div style={{
                fontSize: '44px',
                fontWeight: '800',
                color: 'var(--accent-cyan)',
                marginBottom: '32px'
              }}>
                {Math.round((score / currentQuestions.length) * 100)}%
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button onClick={() => startQuiz(selectedCategory)} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  Retake Test
                </button>
                <button onClick={() => setSelectedCategory(null)} className="btn btn-secondary" style={{ padding: '10px 24px' }}>
                  Choose Another Category
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Embedded Hovers */}
      <style dangerouslySetInnerHTML={{__html: `
        .quiz-option-hover:hover {
          background: rgba(138, 112, 214, 0.02) !important;
          border-color: var(--border-glass-hover) !important;
          color: var(--accent-cyan) !important;
        }
      `}} />

    </div>
  );
}
