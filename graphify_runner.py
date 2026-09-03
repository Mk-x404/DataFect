import os, sys, json
from pathlib import Path

os.makedirs('graphify-out', exist_ok=True)
with open('graphify-out/.graphify_python', 'w', encoding='utf-8') as f:
    f.write(sys.executable)
with open('graphify-out/.graphify_root', 'w', encoding='utf-8') as f:
    f.write(os.path.abspath('.'))

from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

result = detect(Path('.'))
with open('graphify-out/.graphify_detect.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Corpus: {result.get('total_files', 0)} files, ~{result.get('total_words', 0)} words")
for k, v in result.get('files', {}).items():
    if v:
        print(f"  {k}: {len(v)} files")

code_files = []
for f in result.get('files', {}).get('code', []):
    p = Path(f)
    if 'node_modules' in str(p) or '.agents' in str(p) or 'dist' in str(p):
        continue
    code_files.extend(collect_files(p) if p.is_dir() else [p])

print(f"Extracting AST from {len(code_files)} code files...")
ast_res = extract(code_files, cache_root=Path('.'))
with open('graphify-out/.graphify_ast.json', 'w', encoding='utf-8') as f:
    json.dump(ast_res, f, ensure_ascii=False, indent=2)

print(f"AST: {len(ast_res['nodes'])} nodes, {len(ast_res['edges'])} edges")

# Semantic empty for fast path or doc extraction
sem_res = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
with open('graphify-out/.graphify_semantic.json', 'w', encoding='utf-8') as f:
    json.dump(sem_res, f, ensure_ascii=False, indent=2)

# Merge
seen = {n['id'] for n in ast_res['nodes']}
merged_nodes = list(ast_res['nodes'])
for n in sem_res['nodes']:
    if n['id'] not in seen:
        merged_nodes.append(n)
        seen.add(n['id'])

merged = {
    'nodes': merged_nodes,
    'edges': ast_res['edges'] + sem_res['edges'],
    'hyperedges': sem_res.get('hyperedges', []),
    'input_tokens': 0,
    'output_tokens': 0
}
with open('graphify-out/.graphify_extract.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)

# Build graph
G = build_from_json(merged, root='.', directed=False)
print(f"Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
if G.number_of_nodes() > 0:
    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': 0, 'output': 0}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    wrote = to_json(G, communities, 'graphify-out/graph.json')
    report = generate(G, communities, cohesion, labels, gods, surprises, result, tokens, '.', suggested_questions=questions)
    with open('graphify-out/GRAPH_REPORT.md', 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"Graph complete: {len(communities)} communities. Report generated at graphify-out/GRAPH_REPORT.md")
