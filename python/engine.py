import cv2  # type: ignore
import numpy as np  # type: ignore
from pyzbar.pyzbar import decode  # type: ignore
import json
from time import time as get_time
import requests  # type: ignore

# 1. Initialize Camera (Using Pre-recorded Demo Video)
cap = cv2.VideoCapture('demo_scan.mp4')
# Not setting fixed width/height so it respects the video's original resolution

# 2. State Management
current_scanned_part = None
current_scanned_location = "UNASSIGNED"
inventory_database: dict[str, dict[str, str]] = {}
scanned_codes: set[str] = set()  # Once scanned, never re-scanned

FASTAPI_URL = "http://127.0.0.1:8000/api/scan-item" 
FRAME_POST_URL = "http://127.0.0.1:8000/api/video-frame"
posted_parts: set[str] = set()  # Parts already sent to API

print("VISION ENGINE STARTED. Awaiting scans...")

import time

while True:
    ret, frame = cap.read()
    
    # If the video ended, loop it back to frame 0
    if not ret:
        print("--- DEMO VIDEO LOOPING ---")
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        # Clear the scan caches so it can re-scan the codes in the video!
        scanned_codes.clear()
        posted_parts.clear()
        continue
        
    # Slow the video processing to natural 25-30 fps
    time.sleep(0.04)
    
    # Keep the original frame for scanning
    scannable_frame = frame.copy()
    
    # Let's resize it slightly if it's a massive 4K phone video so it fits on screen nicely
    height, width, _ = frame.shape
    if width > 1280 or height > 1280:
        scale = 1280 / max(width, height)
        scannable_frame = cv2.resize(scannable_frame, (0,0), fx=scale, fy=scale)
        frame = cv2.resize(frame, (0,0), fx=scale, fy=scale)
        
    # We DO NOT flip the frame for a pre-recorded video since phone cameras record normally
    # frame = cv2.flip(frame, 1)
    
    height, width, _ = frame.shape

    # ==========================================
    # BARCODE / QR SCANNER
    # ==========================================
    gray_frame = cv2.cvtColor(scannable_frame, cv2.COLOR_BGR2GRAY)
    
    # Multi-pass decoding for better detection
    detected_codes = decode(gray_frame)
    
    if not detected_codes:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray_frame)
        detected_codes = decode(enhanced)
    
    if not detected_codes:
        _, thresh = cv2.threshold(gray_frame, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        detected_codes = decode(thresh)

    for code in detected_codes:
        data = code.data.decode('utf-8')
        code_type = code.type

        # Build unique ID
        raw_id = data if data.startswith(("LOC-", "PART-")) else f"{code_type}-{data}"

        # Skip if already scanned (permanent — no rescan)
        if raw_id in scanned_codes:
            continue
        scanned_codes.add(raw_id)
        
        # Draw on the frame (no flipping needed since we didn't mirror it)
        pts = np.array([code.polygon], np.int32)
        cv2.polylines(frame, [pts], True, (0, 255, 0), 3)
        
        text_x = width - code.rect.left - code.rect.width
        
        if data.startswith("LOC-"):
            current_scanned_location = data
            cv2.putText(frame, f"SET LOC: {data}", (text_x, code.rect.top - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        else:
            part_id = data if data.startswith("PART-") else f"{code_type}-{data}"
            current_scanned_part = part_id
            
            print(f"[SCAN] New item: {part_id} (Type: {code_type})")
            
            cv2.putText(frame, f"SCANNED: {part_id}", (text_x, code.rect.top - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
                                        
            if current_scanned_part is not None:
                assert isinstance(current_scanned_part, str)
                
                if current_scanned_part not in inventory_database:
                    inventory_database[current_scanned_part] = {
                        "assigned_location": current_scanned_location,
                        "physical_location": "SCANNED",
                        "status": "LOGGED",
                        "detected_shape": "N/A"
                    }

    # ==========================================
    # POST SCAN TO FASTAPI (once per part, permanently)
    # ==========================================
    if current_scanned_part is not None and current_scanned_part in inventory_database:
        if current_scanned_part not in posted_parts:
            now = get_time()
            part_data_to_post: dict[str, str] = inventory_database[current_scanned_part] # type: ignore
            try:
                payload = {
                    "part_id": current_scanned_part,
                    "assigned_location": part_data_to_post.get("assigned_location", "UNASSIGNED"),
                    "physical_location": part_data_to_post.get("physical_location", "SCANNED"),
                    "status": part_data_to_post.get("status", "LOGGED"),
                    "detected_shape": "N/A"
                }
                requests.post(FASTAPI_URL, json=payload, timeout=0.5)
                posted_parts.add(current_scanned_part)
            except Exception:
                pass

    # Save to database.json
    try:
        with open('database.json', 'w') as f:
            json.dump(inventory_database, f, indent=4)
    except Exception:
        pass

    # ==========================================
    # STREAM FRAME TO BROWSER VIA FASTAPI
    # ==========================================
    try:
        _, jpeg_buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        requests.post(FRAME_POST_URL, data=jpeg_buf.tobytes(),
                      headers={"Content-Type": "image/jpeg"}, timeout=0.3)
    except Exception:
        pass

    cv2.imshow("Unified Vision Engine", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()
