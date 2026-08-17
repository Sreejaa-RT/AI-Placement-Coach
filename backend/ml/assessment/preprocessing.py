import os
import sys
import json
import re
from datasets import load_dataset

# Ensure Windows console encoding is correct
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

RAW_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# ----------------------------------------------------
# 1. Topic Mapping Dictionaries
# ----------------------------------------------------
TOPIC_KEYWORDS = {
    "Data Structures": {
        "Arrays": r'\b(array|arrays|element index|subarray)\b',
        "Linked Lists": r'\b(linked list|linked lists|singly linked|doubly linked|node pointer)\b',
        "Stack": r'\b(stack|stacks|push|pop|lifo)\b',
        "Queue": r'\b(queue|queues|enqueue|dequeue|fifo|circular queue)\b',
        "Trees": r'\b(tree|trees|binary tree|bst|avl|red-black|inorder|preorder|postorder|leaf node|root node)\b',
        "Graphs": r'\b(graph|graphs|vertices|edges|adjacency|vertex|dfs|bfs|connected components)\b',
        "Hashing": r'\b(hash|hashing|hash table|hash function|collisions?|chaining|linear probing)\b',
        "Heap": r'\b(heap|heaps|min-heap|max-heap|heapify)\b'
    },
    "Algorithms": {
        "Searching": r'\b(search|searching|binary search|linear search)\b',
        "Sorting": r'\b(sort|sorting|bubble sort|merge sort|quick sort|heap sort|insertion sort|selection sort|stable sort)\b',
        "Recursion": r'\b(recurse|recursion|recursive|memoization|fibonacci)\b',
        "Greedy": r'\b(greedy|fractional knapsack|prim\'s|kruskal\'s|dijkstra)\b',
        "Dynamic Programming": r'\b(dynamic programming|lcs|lis|memoized|bottom-up|overlapping subproblems|optimal substructure)\b',
        "Divide and Conquer": r'\b(divide and conquer|binary search|merge sort|quick sort)\b',
        "Graph Algorithms": r'\b(shortest path|dijkstra|kruskal|prim|bellman-ford|floyd-warshall|topological sort)\b'
    },
    "DBMS / SQL": {
        "SQL": r'\b(sql|select|where|group by|having|order by|insert|update|delete|ddl|dml)\b',
        "Joins": r'\b(join|joins|inner join|left join|right join|outer join|cross join)\b',
        "Normalization": r'\b(normal form|normalization|1nf|2nf|3nf|bcnf|4nf|partial dependency|transitive dependency)\b',
        "Transactions": r'\b(transaction|transactions|commit|rollback|acid|concurrency|deadlock)\b',
        "Indexing": r'\b(index|indexing|b-tree|b\+tree|clustered index|non-clustered index)\b',
        "Keys": r'\b(primary key|foreign key|candidate key|super key|composite key)\b',
        "ER Model": r'\b(er model|entity-relationship|cardinality|attributes?|schema)\b'
    },
    "Operating Systems": {
        "Processes": r'\b(process|processes|fork|inter-process|ipc|concurrency|race condition)\b',
        "Threads": r'\b(thread|threads|multi-threading|thread safety|user-level thread|kernel-level thread)\b',
        "Scheduling": r'\b(schedule|scheduling|cpu scheduling|round robin|fcfs|sjf|priority scheduling|time quantum|context switch)\b',
        "Deadlock": r'\b(deadlock|deadlocks|mutual exclusion|hold and wait|no preemption|circular wait|banker\'s algorithm)\b',
        "Memory Management": r'\b(memory management|paging|page table|segmentation|mmu|tlb|fragmentation)\b',
        "Virtual Memory": r'\b(virtual memory|thrashing|page fault|demand paging|lru|fifo page replacement)\b',
        "File Systems": r'\b(file system|file systems|directory|inode|fat|ntfs|ext4|disk seek)\b'
    },
    "Computer Networks": {
        "OSI/TCP-IP": r'\b(osi|tcp/ip|protocol suite|network architecture|physical layer|data link|network layer|transport layer|session layer|presentation layer|application layer)\b',
        "IP Addressing": r'\b(ip address|ipv4|ipv6|subnet|subnetting|mask|cidr|loopback|dns)\b',
        "Routing": r'\b(route|routing|router|routers|rip|ospf|bgp|packet forwarding)\b',
        "DNS": r'\b(dns|domain name system|name resolution|root server)\b',
        "HTTP/HTTPS": r'\b(http|https|url|ssl|tls|port 80|port 443|get|post)\b',
        "TCP/UDP": r'\b(tcp|udp|connection-oriented|connectionless|three-way handshake|window size|syn|ack|fin)\b',
        "Network Security": r'\b(security|firewall|cryptography|symmetric|asymmetric|encryption|rsa|hash|mac address|arp spoofing)\b'
    },
    "Object-Oriented Programming": {
        "Classes/Objects": r'\b(class|classes|object|objects|instantiate|instance|constructor|destructor|initializer)\b',
        "Inheritance": r'\b(inherit|inheritance|derived class|base class|subclass|superclass|diamond problem)\b',
        "Polymorphism": r'\b(polymorphism|polymorphic|overload|overloading|override|overriding|runtime polymorphism|compile-time polymorphism)\b',
        "Encapsulation": r'\b(encapsulation|encapsulate|private|public|protected|access modifier|getter|setter)\b',
        "Abstraction": r'\b(abstract|abstraction|abstract class|pure virtual)\b',
        "Interfaces": r'\b(interface|interfaces|implements|abstract interface)\b'
    },
    "Programming Fundamentals": {
        "Variables": r'\b(variable|variables|scope|local variable|global variable|constant)\b',
        "Data Types": r'\b(data type|integers?|floats?|doubles?|chars?|strings?|boolean|pointers?|references?)\b',
        "Control Flow": r'\b(control flow|if-else|switch|loops?|while|for loop|break|continue)\b',
        "Functions": r'\b(function|functions|procedure|call by value|call by reference|parameters?|arguments?|return)\b',
        "Pointers/References": r'\b(pointer|pointers|reference|references|address-of|dereference|nullptr)\b',
        "Complexity": r'\b(complexity|time complexity|space complexity|big-o|theta|omega|logarithmic|quadratic)\b',
        "Exception Handling": r'\b(exception|exceptions|throw|catch|try-catch|finally|nullpointer)\b'
    },
    "Quantitative Aptitude": {
        "Percentages": r'\b(percent|percentage|percentages|percent increase|discount)\b',
        "Profit & Loss": r'\b(profit|loss|cost price|selling price|markup)\b',
        "Time & Work": r'\b(work|days|complete work|efficiency|pipes|cistern)\b',
        "Time Speed Distance": r'\b(speed|distance|velocity|train|bridge|average speed|relative speed)\b',
        "Probability": r'\b(probability|coin|die|dice|cards?|king|queen|ace|red ball|blue ball)\b',
        "Ratio": r'\b(ratio|ratios|proportion|divide in ratio)\b',
        "Averages": r'\b(average|mean|averages)\b',
        "Permutation & Combination": r'\b(permutation|combination|permutations|combinations|choose|ways to arrange)\b'
    },
    "Logical Reasoning": {
        "Number Series": r'\b(series|sequence|missing number|next number|arithmetic progression|geometric progression)\b',
        "Coding-Decoding": r'\b(code|coded|cipher|coding|decoding|written as)\b',
        "Syllogisms": r'\b(syllogism|syllogisms|premises|conclusion|all roses|some flowers)\b',
        "Blood Relations": r'\b(relation|brother|sister|father|mother|uncle|aunt|cousin|son|daughter)\b',
        "Directions": r'\b(direction|north|south|east|west|left turn|right turn|facing)\b',
        "Puzzles": r'\b(puzzle|puzzles|arrangement|taller than|shorter than|seating arrangement)\b'
    },
    "Verbal Ability": {
        "Grammar": r'\b(grammar|preposition|verb|noun|pronoun|adjective|tense|agreement)\b',
        "Vocabulary": r'\b(vocabulary|synonym|antonym|closest meaning|opposite meaning)\b',
        "Sentence Correction": r'\b(sentence correction|spelled|spelling|correct sentence)\b',
        "Reading Comprehension": r'\b(reading comprehension|passage|comprehend|according to the text)\b',
        "Synonyms/Antonyms": r'\b(synonym|antonym|synonyms|antonyms)\b'
    }
}

# ----------------------------------------------------
# 2. Text Classification Rules
# ----------------------------------------------------
def classify_tech_question(q_text, domain=None, subdomain=None):
    """
    Classifies a CS question into our target technical categories.
    """
    text = q_text.lower()
    
    # 1. Use Domain/SubDomain metadata from CS-Bench if available
    if domain:
        d_lower = domain.lower()
        if "data structure" in d_lower:
            # Map subdomains
            if subdomain and "sort" in subdomain.lower():
                return "Algorithms", "Sorting"
            if subdomain and "search" in subdomain.lower():
                return "Algorithms", "Searching"
            return "Data Structures", None
        elif "network" in d_lower:
            return "Computer Networks", None
        elif "operating system" in d_lower:
            return "Operating Systems", None
        elif "organization" in d_lower:
            # CPU, Bus, architecture details map to Operating Systems or Programming Fundamentals
            return "Operating Systems", "File Systems"
            
    # 2. Heuristic check based on matching keywords
    # Mappings ordered by priority (specialized topics first)
    categories = [
        "Object-Oriented Programming",
        "DBMS / SQL",
        "Computer Networks",
        "Operating Systems",
        "Data Structures",
        "Algorithms",
        "Programming Fundamentals"
    ]
    
    for cat in categories:
        for topic, pattern in TOPIC_KEYWORDS[cat].items():
            if re.search(pattern, text):
                return cat, topic
                
    return "Programming Fundamentals", "Complexity"

def classify_quant_question(q_text, subject=None):
    """
    Maps math questions to Quantitative Aptitude and resolves sub-topic.
    """
    text = q_text.lower()
    cat = "Quantitative Aptitude"
    
    for topic, pattern in TOPIC_KEYWORDS[cat].items():
        if re.search(pattern, text):
            return cat, topic
            
    return cat, "Averages"

def classify_logic_question(q_text, subject=None):
    """
    Maps logical reasoning questions.
    """
    text = q_text.lower()
    cat = "Logical Reasoning"
    
    for topic, pattern in TOPIC_KEYWORDS[cat].items():
        if re.search(pattern, text):
            return cat, topic
            
    return cat, "Puzzles"

# ----------------------------------------------------
# 3. Processing Pipeline
# ----------------------------------------------------
def run_pipeline():
    print("=" * 60)
    print("AI PLACEMENT COACH ASSESSMENT PREPROCESSING PIPELINE")
    print("=" * 60)
    
    normalized_questions = []
    
    # Counter statistics
    stats = {
        "original_mmlu": 0,
        "original_csbench": 0,
        "relevant_mmlu": 0,
        "relevant_csbench": 0,
        "removed_duplicates": 0,
        "removed_invalid": 0,
        "final_questions": 0
    }
    
    category_counts = {cat: 0 for cat in TOPIC_KEYWORDS.keys()}
    topic_counts = {}
    
    # Track unique question texts to deduplicate
    seen_questions = set()
    
    # ----------------------------------------------------
    # PART A: Preprocess MMLU
    # ----------------------------------------------------
    mmlu_tasks = {
        "college_computer_science": {"cat_fn": classify_tech_question, "diff": "Hard"},
        "high_school_computer_science": {"cat_fn": classify_tech_question, "diff": "Easy"},
        "computer_security": {"cat_fn": classify_tech_question, "diff": "Medium"},
        "elementary_mathematics": {"cat_fn": classify_quant_question, "diff": "Easy"},
        "high_school_mathematics": {"cat_fn": classify_quant_question, "diff": "Medium"},
        "college_mathematics": {"cat_fn": classify_quant_question, "diff": "Hard"},
        "formal_logic": {"cat_fn": classify_logic_question, "diff": "Hard"},
        "logical_fallacies": {"cat_fn": classify_logic_question, "diff": "Medium"}
    }
    
    print("\n[Processing cais/mmlu]...")
    for config, meta in mmlu_tasks.items():
        print(f"  Loading MMLU configuration: {config}...")
        
        # Combine all splits for evaluation bank
        for split in ["test", "validation", "dev"]:
            try:
                ds = load_dataset("cais/mmlu", config, split=split)
                stats["original_mmlu"] += len(ds)
                
                for idx, row in enumerate(ds):
                    q_text = row["question"]
                    choices = row["choices"]
                    ans_idx = row["answer"]
                    
                    # 1. Quality Validation: exactly 4 choices
                    if len(choices) != 4 or ans_idx is None or ans_idx < 0 or ans_idx > 3 or not q_text.strip():
                        stats["removed_invalid"] += 1
                        continue
                        
                    # 2. Deduplication check
                    if q_text.strip() in seen_questions:
                        stats["removed_duplicates"] += 1
                        continue
                        
                    # 3. Classify category and subtopic
                    cat_fn = meta["cat_fn"]
                    category, topic = cat_fn(q_text)
                    
                    # Ensure topic is mapped if fallback occurred
                    if not topic:
                        topic = list(TOPIC_KEYWORDS[category].keys())[0]
                        
                    # 4. Standardize answer options
                    ans_label = ["A", "B", "C", "D"][ans_idx]
                    
                    # Create normalized schema object
                    q_id = f"mmlu_{config}_{split}_{idx}"
                    q_obj = {
                        "question_id": q_id,
                        "source_dataset": "MMLU",
                        "source_question_id": f"{config}_{split}_{idx}",
                        "category": category,
                        "topic": topic,
                        "question_text": q_text,
                        "option_a": choices[0],
                        "option_b": choices[1],
                        "option_c": choices[2],
                        "option_d": choices[3],
                        "correct_answer": ans_label,
                        "difficulty": meta["diff"],  # Derived from split subject
                        "explanation": ""  # MMLU has no explanations
                    }
                    
                    normalized_questions.append(q_obj)
                    seen_questions.add(q_text.strip())
                    stats["relevant_mmlu"] += 1
                    category_counts[category] += 1
                    topic_counts[topic] = topic_counts.get(topic, 0) + 1
                    
            except Exception as e:
                print(f"    Error reading MMLU config {config} split {split}: {e}")
                
    # ----------------------------------------------------
    # PART B: Preprocess CS-Bench
    # ----------------------------------------------------
    print("\n[Processing CS-Bench/CS-Bench]...")
    try:
        # Load test split
        ds_cs = load_dataset("CS-Bench/CS-Bench", split="test")
        stats["original_csbench"] += len(ds_cs)
        
        for idx, row in enumerate(ds_cs):
            # 1. Filter English-only questions
            if row.get("Language") != "English":
                continue
                
            q_text = row.get("Question")
            opt_a = row.get("A")
            opt_b = row.get("B")
            opt_c = row.get("C")
            opt_d = row.get("D")
            ans_val = row.get("Answer")
            explanation = row.get("Explanation", "")
            
            # 2. Quality validations: ensure options exist and answer matches
            if not opt_a or not opt_b or not opt_c or not opt_d or not ans_val or not q_text.strip():
                stats["removed_invalid"] += 1
                continue
                
            # Convert Answer to clean string label (A/B/C/D)
            ans_str = str(ans_val).strip().upper()
            if ans_str not in ["A", "B", "C", "D"]:
                stats["removed_invalid"] += 1
                continue
                
            # 3. Deduplication check
            if q_text.strip() in seen_questions:
                stats["removed_duplicates"] += 1
                continue
                
            # 4. Classify category and subdomain
            category, topic = classify_tech_question(
                q_text, domain=row.get("Domain"), subdomain=row.get("SubDomain")
            )
            
            if not topic:
                topic = list(TOPIC_KEYWORDS[category].keys())[0]
                
            # 5. Derived difficulty level logic
            # Higher-order reasoning maps to Hard, standard knowledge maps to Medium
            format_type = row.get("Format", "")
            diff_level = "Hard" if "reasoning" in format_type.lower() else "Medium"
            
            q_id = f"csbench_test_{row.get('ID', idx)}"
            q_obj = {
                "question_id": q_id,
                "source_dataset": "CS-Bench",
                "source_question_id": str(row.get('ID', idx)),
                "category": category,
                "topic": topic,
                "question_text": q_text,
                "option_a": str(opt_a),
                "option_b": str(opt_b),
                "option_c": str(opt_c),
                "option_d": str(opt_d),
                "correct_answer": ans_str,
                "difficulty": diff_level,
                "explanation": str(explanation)
            }
            
            normalized_questions.append(q_obj)
            seen_questions.add(q_text.strip())
            stats["relevant_csbench"] += 1
            category_counts[category] += 1
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
            
    except Exception as e:
        print(f"  Error loading CS-Bench: {e}")

    stats["final_questions"] = len(normalized_questions)
    
    # ----------------------------------------------------
    # 4. Write Processed Dataset to File
    # ----------------------------------------------------
    output_filepath = os.path.join(PROCESSED_DIR, "questions.json")
    with open(output_filepath, "w", encoding="utf-8") as out_f:
        json.dump(normalized_questions, out_f, indent=2, ensure_ascii=False)
        
    print("\n" + "=" * 50)
    print("PREPROCESSING PIPELINE COMPLETED")
    print("=" * 50)
    print(f"Total original MMLU rows      : {stats['original_mmlu']}")
    print(f"Total original CS-Bench rows  : {stats['original_csbench']}")
    print(f"Deduplicated questions removed : {stats['removed_duplicates']}")
    print(f"Malformed/Invalid questions   : {stats['removed_invalid']}")
    print(f"Final standardized questions  : {stats['final_questions']}")
    print(f"Processed output file location : {output_filepath}")
    
    # ----------------------------------------------------
    # 5. Generate Preprocessing Report Card
    # ----------------------------------------------------
    report_filepath = os.path.join(os.path.dirname(__file__), "dataset_report.md")
    
    with open(report_filepath, "w", encoding="utf-8") as rep_f:
        rep_f.write("# Preprocessing Report: Assessment Q&A Datasets\n\n")
        rep_f.write(f"This report card summarizes the dataset filtering, cleaning, and normalization results.\n\n")
        rep_f.write("## 1. Data Source Breakdown\n")
        rep_f.write(f"- **MMLU:** {stats['relevant_mmlu']} questions selected\n")
        rep_f.write(f"- **CS-Bench:** {stats['relevant_csbench']} questions selected\n")
        rep_f.write(f"- **Deduplication:** {stats['removed_duplicates']} records dropped\n")
        rep_f.write(f"- **Invalid Rows:** {stats['removed_invalid']} records dropped\n")
        rep_f.write(f"- **Total Normalized Output:** {stats['final_questions']} questions\n\n")
        
        rep_f.write("## 2. Category-Wise Distribution\n\n")
        rep_f.write("| Category | Question Count |\n")
        rep_f.write("| :--- | :---: |\n")
        for cat, count in category_counts.items():
            rep_f.write(f"| {cat} | {count} |\n")
            
        rep_f.write("\n*Note: Verbal Ability is mapped as 0 because MMLU and CS-Bench do not have English Grammar/Vocabulary tasks in their configs. The frontend's hardcoded Verbal Ability questions will serve as the default fallback.*\n\n")
        
        rep_f.write("## 3. Topic-Wise Distribution\n\n")
        rep_f.write("| Topic | Question Count |\n")
        rep_f.write("| :--- | :---: |\n")
        for topic, count in sorted(topic_counts.items()):
            rep_f.write(f"| {topic} | {count} |\n")
            
        rep_f.write("\n## 4. Derived Difficulty Summary\n")
        diff_counts = {"Easy": 0, "Medium": 0, "Hard": 0}
        for q in normalized_questions:
            diff_counts[q["difficulty"]] += 1
        for level, val in diff_counts.items():
            rep_f.write(f"- **{level}**: {val} questions\n")
            
    print(f"Generated data report card at  : {report_filepath}")

if __name__ == "__main__":
    run_pipeline()
