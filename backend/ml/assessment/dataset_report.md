# Preprocessing Report: Assessment Q&A Datasets

This report card summarizes the dataset filtering, cleaning, and normalization results.

## 1. Data Source Breakdown
- **MMLU:** 1509 questions selected
- **CS-Bench:** 1316 questions selected
- **Deduplication:** 126 records dropped
- **Invalid Rows:** 853 records dropped
- **Total Normalized Output:** 2825 questions

## 2. Category-Wise Distribution

| Category | Question Count |
| :--- | :---: |
| Data Structures | 290 |
| Algorithms | 120 |
| DBMS / SQL | 15 |
| Operating Systems | 613 |
| Computer Networks | 376 |
| Object-Oriented Programming | 16 |
| Programming Fundamentals | 231 |
| Quantitative Aptitude | 834 |
| Logical Reasoning | 330 |
| Verbal Ability | 0 |

*Note: Verbal Ability is mapped as 0 because MMLU and CS-Bench do not have English Grammar/Vocabulary tasks in their configs. The frontend's hardcoded Verbal Ability questions will serve as the default fallback.*

## 3. Topic-Wise Distribution

| Topic | Question Count |
| :--- | :---: |
| Abstraction | 1 |
| Arrays | 275 |
| Averages | 719 |
| Blood Relations | 2 |
| Classes/Objects | 10 |
| Complexity | 180 |
| Control Flow | 2 |
| Data Types | 30 |
| Directions | 6 |
| Dynamic Programming | 1 |
| ER Model | 1 |
| Encapsulation | 5 |
| File Systems | 342 |
| Functions | 10 |
| Graphs | 5 |
| HTTP/HTTPS | 6 |
| Hashing | 1 |
| IP Addressing | 2 |
| Indexing | 2 |
| Memory Management | 3 |
| Network Security | 23 |
| OSI/TCP-IP | 342 |
| Percentages | 8 |
| Permutation & Combination | 3 |
| Probability | 41 |
| Processes | 266 |
| Profit & Loss | 1 |
| Puzzles | 289 |
| Ratio | 16 |
| Recursion | 1 |
| Routing | 1 |
| SQL | 11 |
| Scheduling | 1 |
| Searching | 54 |
| Sorting | 64 |
| Stack | 5 |
| Syllogisms | 33 |
| TCP/UDP | 2 |
| Time & Work | 28 |
| Time Speed Distance | 18 |
| Transactions | 1 |
| Trees | 4 |
| Variables | 9 |
| Virtual Memory | 1 |

## 4. Derived Difficulty Summary
- **Easy**: 535 questions
- **Medium**: 1913 questions
- **Hard**: 377 questions
