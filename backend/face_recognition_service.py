import os
import time
import cv2
import uuid
import face_recognition
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore, storage
from datetime import datetime

# =======================================================
# CONFIGURATION
# =======================================================
RTSP_URL = 0 # Use 0 for webcam, or "rtsp://..." for CCTV
KNOWN_FACES_DIR = "known_faces"
COOLDOWN_SECONDS = 10 # Don't log the same person within 10s
CAMERA_ID = "CAM-TRACK-01"

# =======================================================
# FIREBASE SETUP
# =======================================================
# Make sure to place your serviceAccountKey.json in the backend folder
SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"

try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    # Initialize Firebase. Replace 'your-storage-bucket.appspot.com' with your actual storage bucket name from Firebase Console.
    # Note: For the script to fully work with Storage, provide the exact bucket name in the line below.
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'your-storage-bucket.appspot.com' 
    })
    db = firestore.client()
    bucket = storage.bucket()
    print("[INFO] Firebase initialized successfully.")
    FIREBASE_ENABLED = True
except Exception as e:
    print(f"[WARNING] Firebase initialization failed. Logs will not be sent to Firestore. Ensure '{SERVICE_ACCOUNT_FILE}' exists.")
    print(f"Error: {e}")
    FIREBASE_ENABLED = False

# =======================================================
# LOAD KNOWN FACES
# =======================================================
known_face_encodings = []
known_face_names = []

if not os.path.exists(KNOWN_FACES_DIR):
    os.makedirs(KNOWN_FACES_DIR)
    print(f"[INFO] Created '{KNOWN_FACES_DIR}' directory. Add images here.")

print("[INFO] Loading known faces...")
for filename in os.listdir(KNOWN_FACES_DIR):
    if filename.endswith((".jpg", ".jpeg", ".png")):
        path = os.path.join(KNOWN_FACES_DIR, filename)
        name = os.path.splitext(filename)[0]
        try:
            image = face_recognition.load_image_file(path)
            # Assuming one face per image for known database
            encodings = face_recognition.face_encodings(image)
            if encodings:
                known_face_encodings.append(encodings[0])
                known_face_names.append(name)
                print(f"[INFO] Loaded known face: {name}")
            else:
                print(f"[WARNING] No face found in {filename}")
        except Exception as e:
            print(f"[ERROR] Could not process {filename}: {e}")

# Track last seen times for cooldown
last_seen = {}

# =======================================================
# MAIN VIDEO LOOP
# =======================================================
def process_video():
    print(f"[INFO] Starting video stream: {RTSP_URL}")
    video_capture = cv2.VideoCapture(RTSP_URL)

    if not video_capture.isOpened():
        print("[ERROR] Cannot open video stream.")
        return

    # Process every nth frame to save CPU
    process_this_frame = True

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("[WARNING] Frame capture failed. Retrying...")
            time.sleep(1)
            continue

        # Resize frame of video to 1/4 size for faster face recognition processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_small_frame = np.ascontiguousarray(small_frame[:, :, ::-1])

        if process_this_frame:
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

            face_names = []
            for face_encoding, face_location in zip(face_encodings, face_locations):
                matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
                name = "Unknown"

                # Use the known face with the smallest distance to the new face
                face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = known_face_names[best_match_index]

                face_names.append(name)
                
                # Check cooldown
                now = time.time()
                last_time = last_seen.get(name, 0)
                
                if now - last_time > COOLDOWN_SECONDS:
                    last_seen[name] = now
                    print(f"[DETECT] Detected {name} at {datetime.now().strftime('%H:%M:%S')}")
                    
                    if FIREBASE_ENABLED:
                        # Extract face for uploading
                        top, right, bottom, left = face_location
                        # Scale back up face locations since the frame we detected in was scaled to 1/4 size
                        top *= 4
                        right *= 4
                        bottom *= 4
                        left *= 4
                        
                        # Add some padding to the crop
                        h, w, _ = frame.shape
                        pad = 30
                        crop_top = max(0, top - pad)
                        crop_bottom = min(h, bottom + pad)
                        crop_left = max(0, left - pad)
                        crop_right = min(w, right + pad)
                        
                        face_image = frame[crop_top:crop_bottom, crop_left:crop_right]
                        
                        # Save temp image
                        temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
                        cv2.imwrite(temp_filename, face_image)
                        
                        # Upload to Storage and Firestore in background (or synchronous here)
                        try:
                            # 1. Upload image to Storage
                            storage_path = f"face_logs/{temp_filename}"
                            blob = bucket.blob(storage_path)
                            blob.upload_from_filename(temp_filename)
                            blob.make_public()
                            image_url = blob.public_url
                            
                            # 2. Log to Firestore
                            doc_ref = db.collection('face_logs').document()
                            doc_ref.set({
                                'name': name,
                                'status': 'Known' if name != 'Unknown' else 'Unknown',
                                'cameraId': CAMERA_ID,
                                'timestamp': firestore.SERVER_TIMESTAMP,
                                'imageUrl': image_url
                            })
                            print(f"[INFO] Logged {name} to Firebase.")
                        except Exception as e:
                            print(f"[ERROR] Failed to upload to Firebase: {e}")
                        finally:
                            if os.path.exists(temp_filename):
                                os.remove(temp_filename)

        process_this_frame = not process_this_frame

        # Display the results
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(frame, name, (left + 6, bottom - 6), font, 0.7, (255, 255, 255), 1)

        cv2.imshow('Video', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    process_video()
