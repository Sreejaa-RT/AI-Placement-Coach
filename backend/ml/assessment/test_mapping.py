import sys
import os
import re
from datasets import load_dataset

# Prevent Windows terminal encoding issues
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def classify_technical_question(q_text):
    """
    Classifies a computer science question text into one of our technical categories.
    """
    text = q_text.lower()
    
    # 1. Object-Oriented Programming
    if re.search(r'\b(class|object|inheritance|polymorphism|encapsulation|abstraction|constructor|destructor|polymorphic|subclass|superclass|base class|derived class)\b', text):
        return "Object-Oriented Programming"
    
    # 2. DBMS / SQL
    if re.search(r'\b(sql|database|query|joins?|primary key|foreign key|normalization|transactions?|acid|indexing|b-tree|relational model|er model|dbms)\b', text):
        return "DBMS / SQL"
        
    # 3. Computer Networks
    if re.search(r'\b(ip address|tcp/ip|http|https|dns|routing|router|switch|hub|osi layer|transport layer|network layer|data link|physical layer|arp|dhcp|udp|sockets?|subnet)\b', text):
        return "Computer Networks"
        
    # 4. Operating Systems
    if re.search(r'\b(process|thread|scheduling|deadlock|memory management|paging|virtual memory|thrashing|mutex|semaphore|context switch|critical section|banker\'s algorithm|page fault)\b', text):
        return "Operating Systems"

    # 5. Data Structures
    if re.search(r'\b(array|linked list|stack|queue|binary tree|bst|avl|heap|hashing|hash table|graph|vertices|edges|adjacency list|adjacency matrix|pointers?)\b', text):
        return "Data Structures"
        
    # 6. Algorithms
    if re.search(r'\b(sorting|searching|binary search|merge sort|quick sort|dijkstra|greedy|dynamic programming|complexity|big-o|recursion|divide and conquer|kruskal|prim|complexity class)\b', text):
        return "Algorithms"

    # 7. Programming Fundamentals
    if re.search(r'\b(variable|data type|control flow|function|loop|exception|try-catch|collections?|recursion|pointers?|compilers?|interpreter)\b', text):
        return "Programming Fundamentals"

    return "Programming Fundamentals" # default fallback for CS tasks

def run_test():
    print("=== TESTING DATASET ACQUISITION & MAPPING ===")
    
    # 1. MMLU Test
    print("\n[MMLU] Loading sample mathematics data...")
    ds_math = load_dataset("cais/mmlu", "elementary_mathematics", split="validation")
    print(f"Loaded {len(ds_math)} rows.")
    mapped_quant = 0
    for row in ds_math:
        # Every question in elementary_mathematics maps to Quantitative Aptitude
        mapped_quant += 1
    print(f"Mapped to Quantitative Aptitude: {mapped_quant}")

    # 2. CS-Bench Test
    print("\n[CS-Bench] Loading test split...")
    ds_cs = load_dataset("CS-Bench/CS-Bench", split="test")
    print(f"Loaded {len(ds_cs)} rows.")
    
    counts = {}
    for i in range(min(500, len(ds_cs))):
        row = ds_cs[i]
        q_text = row["Question"]
        domain = row["Domain"]
        subdomain = row["SubDomain"]
        
        # Determine category based on CS-Bench metadata + classification rules
        category = classify_technical_question(q_text)
        counts[category] = counts.get(category, 0) + 1
        
    print("\nSample CS-Bench classification counts (first 500 rows):")
    for cat, count in counts.items():
        print(f"  - {cat}: {count}")

if __name__ == "__main__":
    run_test()
