# Lab 1 Notes – CellScope

## 1. Coordinate spaces from emb_pca.f32 to a pixel

A cell position stored in emb_pca.f32 passes through the following spaces:

1. **Model space**  
   The raw coordinates read from the binary file (already normalized to roughly [-1, 1]).  
   Matrix: none yet (or identity).

2. **World space**  
   After applying the object’s transformation (position, rotation, scale of the Points object).  
   Matrix: points.matrixWorld

3. **View (camera) space**  
   After transforming into the camera’s coordinate system.  
   Matrix: camera.matrixWorldInverse

4. **Clip space**  
   After applying the projection matrix.  
   Matrix: camera.projectionMatrix

5. **NDC (Normalized Device Coordinates)**  
   Perspective divide: (x/w, y/w, z/w). Coordinates are in [-1, 1].  
   No matrix; just division.

6. **Screen (pixel) space**  
   Mapped from NDC to the canvas size (and y is flipped).  
   Done by the viewport transform (not a matrix we control directly).

## 2. Extreme near/far values

Setting very small 
ear (e.g. 0.0001) and very large ar (e.g. 1e6) causes **z-fighting** and precision problems.  
The depth buffer has limited precision. When the near/far range is extremely large, the depth values become compressed and objects that are close in depth can flicker or disappear. Orbiting makes the problem more visible.

## 3. Perspective vs Orthographic camera

- **Orthographic camera** is better for judging **distances between clusters**, because parallel lines stay parallel and relative sizes are preserved regardless of depth.
- **Perspective camera** is better for judging **depth**, because closer objects appear larger and farther objects appear smaller, giving a stronger sense of 3D space.

## 4. Why rescale the embedding in Python?

We rescale in Python so that the data already fits nicely in a unit cube when it reaches JavaScript. This avoids large numbers that can cause floating-point precision issues in the GPU, and makes the visualization code simpler.

We use **one common scale for all three axes** so that the relative distances and shapes are preserved. If we scaled each axis independently, the cloud would be stretched or squashed and the visual distances would no longer correspond to the true PCA distances.

To keep the step reversible we must store the **center** (mean of each axis) and the **scale** factor. With these two values we can always go back to the original PCA coordinates.

---

**Checkpoint reached:**  
- 
pm run dev shows the PCA point cloud with HUD.  
- python run_pipeline.py regenerates the data files.  
- provenance.json lists the processing steps.

## Lab 2 Performance

| Variant          | N      | Draw calls | Triangles | FPS  | Notes          |
|------------------|--------|------------|-----------|------|----------------|
| Points + shader  | ~2.6k  | 1          | 0         | 230  | Real data      |
| Points + shader  | 100k   | 1          | 0         | 216  | Synthetic      |
| Points + shader  | 500k   | 1          | 0         | 195  | Synthetic      |

Machine: Windows PC, Chrome browser.

**Lab 2 Checkpoint:**
- Clusters, markers and synthetic data produced.
- Cells coloured by cluster with custom shaders.
- Highlight on hover and tooltip with raycasting.
- Performance table completed.