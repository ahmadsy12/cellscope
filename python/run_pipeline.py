import os, subprocess, sys

if os.path.exists("out/provenance.json"):
    os.remove("out/provenance.json")

for script in ["02_qc.py", "03_reduce.py", "04_export.py",
               "05_cluster.py", "06_markers.py", "07_export_clusters.py", "08_synthetic.py"]: