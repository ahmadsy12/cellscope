import numpy as np
from contract import OUT, load_manifest, save_manifest, write_f32, write_u8, sync_provenance
from provenance import record

rng = np.random.default_rng(0)
manifest = load_manifest()
n = manifest["n_cells"]

pos = np.fromfile(f"{OUT}/emb_pca.f32", dtype="<f4").reshape(n, 3)
codes = np.fromfile(f"{OUT}/obs_cluster.u8", dtype=np.uint8)

JITTER = 0.03
for label, size in [("100k", 100_000), ("500k", 500_000)]:
    idx = rng.integers(0, n, size=size)
    synth = pos[idx] + rng.normal(0.0, JITTER, size=(size, 3)).astype(np.float32)
    write_f32(f"emb_synth_{label}.f32", synth)
    write_u8(f"obs_synth_{label}_cluster.u8", codes[idx])
    manifest["embeddings"][f"synth_{label}"] = {
        "file": f"emb_synth_{label}.f32",
        "n_cells": size,
        "synthetic": True,
        "cluster_file": f"obs_synth_{label}_cluster.u8",
    }

save_manifest(manifest)
record("synthetic_data", sizes=[100000, 500000], jitter=JITTER, seed=0, purpose="performance testing only")
sync_provenance()
print("wrote synthetic embeddings")
