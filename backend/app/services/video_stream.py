import cv2
import threading
import time
import os

source_env = os.getenv("CAMERA_SOURCE", "0")
if str(source_env).isdigit():
    source_env = int(source_env)

class VideoStreamProcessor:
    def __init__(self, source=0):
        print(f"Initializing VideoStreamProcessor with source: {source}")
        self.source = source
        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            print(f"Warning: Could not open video source {self.source}")
        self.frame = None
        self.running = False
        self.lock = threading.Lock()

    def start(self):
        self.running = True
        threading.Thread(target=self.update, daemon=True).start()

    def update(self):
        while self.running:
            if not self.cap.isOpened():
                time.sleep(2) # Wait before retry (good for RTSP reconnects)
                self.cap = cv2.VideoCapture(self.source)
                continue
                
            ret, frame = self.cap.read()
            if not ret:
                # Reconnect logic for RTSP or loop for Video file
                print("Warning: Stream lost or ended, attempting reconnect...")
                if isinstance(self.source, str) and not self.source.startswith("rtsp"):
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Video loop
                else:
                    self.cap.release()
                    time.sleep(2) # wait before RTSP reconnect
                continue

            with self.lock:
                self.frame = frame.copy()
            
            # Tiny sleep to yield thread and control FPS reading
            time.sleep(0.01)

    def read(self):
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
        return None

    def stop(self):
        self.running = False
        if self.cap.isOpened():
            self.cap.release()

video_stream = VideoStreamProcessor(source=source_env) 
video_stream.start()

def get_video_stream():
    return video_stream
