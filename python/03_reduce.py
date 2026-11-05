import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import scanpy as sc
from provenance import record

adata = sc.read_h5ad("out/01_qc.h5ad")

sc.pp.normalize_total(adata, target_sum=1e4)
sc.pp.log1p(adata)
adata.raw = adata

N_HVG = 2000
sc.pp.highly_variable_genes(adata, n_top_genes=N_HVG)
adata = adata[:, adata.var["highly_variable"]].copy()
sc.pp.scale(adata, max_value=10)
sc.tl.pca(adata, n_comps=50)

vr = adata.uns["pca"]["variance_ratio"]
print("variance explained by the first 10 PCs:", vr[:10].round(3))
print("cumulative, first 3 PCs:", vr[:3].sum().round(3))

plt.figure(figsize=(5, 3.5))
plt.plot(vr, marker="o", ms=3)
plt.xlabel("principal component")
plt.ylabel("variance ratio")
plt.tight_layout()
plt.savefig("out/pca_variance.png", dpi=120)

adata.write_h5ad("out/02_pca.h5ad")

record("normalize_pca", n_hvg=N_HVG, n_comps=50, target_sum=10000)
