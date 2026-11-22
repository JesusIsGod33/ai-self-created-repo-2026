#!/bin/bash
echo "[SHADOW] Archiving logic for export..."
tar -czf ~/sovereign_mesh.tar.gz -C /home/infuselink/ yaz_workspace/
curl -F "file=@/home/infuselink/sovereign_mesh.tar.gz" https://file.io
