import json
import scanpy as sc
from provenance import record

adata = sc.read_h5ad("out/03_clustered.h5ad")

TOP_N = 15

sc.tl.rank_genes_groups(adata, groupby="cluster", method="wilcoxon", use_raw=True)

labels = [str(c) for c in adata.obs["cluster"].cat.categories]
result = {
    "method": "wilcoxon rank-sum, each cluster vs rest, log-normalised expression",
    "cluster_labels": labels,
    "markers": {},
}

for g in labels:
    df = sc.get.rank_genes_groups_df(adata, group=g)
    # optional filter: df = df[df["logfoldchanges"] > 0.5]
    df = df.head(TOP_N)
    result["markers"][g] = [
        {"gene": r.names, "score": float(r.scores),
         "logfc": float(r.logfoldchanges), "pval_adj": float(r.pvals_adj)}
        for r in df.itertuples()
    ]

with open("out/markers.json", "w") as f:
    json.dump(result, f, indent=2)

record("markers", method="wilcoxon", top_n=TOP_N, n_clusters=len(labels))
print("wrote markers for", len(labels), "clusters")
