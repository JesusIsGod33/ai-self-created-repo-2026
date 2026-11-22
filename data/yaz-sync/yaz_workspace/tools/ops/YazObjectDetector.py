#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import cv2
import numpy as np
from flask import Flask, request, jsonify

# ==============================================================================
# YAZ REAL-TIME OBJECT DETECTION API (OPENCV DNN ENGINE)
# ==============================================================================

app = Flask(__name__)

# System Model Paths
PROTOTXT = os.path.expanduser("~/yaz_workspace/models/deploy.prototxt")
MODEL = os.path.expanduser("~/yaz_workspace/models/mobilenet_iter_73000.caffemodel")

# COCO Class Labels mapped by MobileNet-SSD
CLASSES = [
    "background", "aeroplane", "bicycle", "bird", "boat",
    "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
    "dog", "horse", "motorbike", "person", "pottedplant",
    "sheep", "sofa", "train", "tvmonitor"
]

class ObjectDetectionEngine:
    def __init__(self):
        if not os.path.exists(PROTOTXT) or not os.path.exists(MODEL):
            print("[ERROR] Model files not found. Ensure downloader ran successfully.")
            sys.exit(1)
        # Load the Caffe network natively inside OpenCV's DNN module
        self.net = cv2.dnn.readNetFromCaffe(PROTOTXT, MODEL)

    def process_image(self, image_bytes):
        # Convert raw incoming bytes to an OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Invalid image payload."}

        h, w = img.shape[:2]
        
        # Preprocess image: resize to 300x300 and normalize mean values
        blob = cv2.dnn.blobFromImage(cv2.resize(img, (300, 300)), 0.007843, (300, 300), 127.5)
        self.net.setInput(blob)
        detections = self.net.forward()

        results = []
        # Parse detections
        for i in range(detections.shape[2]):
            confidence = float(detections[0, 0, i, 2])
            
            # Filter out weak detections (Threshold: 20%)
            if confidence > 0.2:
                class_idx = int(detections[0, 0, i, 1])
                if class_idx < len(CLASSES):
                    label = CLASSES[class_idx]
                    box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                    (startX, startY, endX, endY) = box.astype("int")
                    
                    results.append({
                        "class": label,
                        "confidence": confidence,
                        "box": [int(startX), int(startY), int(endX), int(endY)]
                    })
        return results

# Initialize the inference engine in-process
detector = ObjectDetectionEngine()

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided in POST request."}), 400
    
    file = request.files['image']
    image_bytes = file.read()
    detection_results = detector.process_image(image_bytes)
    return jsonify(detection_results)

if __name__ == '__main__':
    # Start the local microservice on port 5000
    print("[SYSTEM] Starting Object Detection REST API on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=False)
