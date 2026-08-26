import cv2
import threading
import time

class VideoStreamProcessor:
    def __init__(self, source=0):
        self.source = source
        self.cap = cv2.VideoCapture(self.source)
        self.frame = None
        self.running = False
        self.lock = threading.Lock()
        
        # MOG2 background subtractor for "Fencing" and "Border" alerts
        self.backSub = cv2.createBackgroundSubtractorMOG2()

    def start(self):
        self.running = True
        threading.Thread(target=self.update, daemon=True).start()

    def update(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                # If stream ends (e.g., video file), loop it
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Apply MOG2
            fgMask = self.backSub.apply(frame)

            with self.lock:
                self.frame = frame.copy()
            time.sleep(0.03)

    def read(self):
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
        return None

    def stop(self):
        self.running = False
        if self.cap.isOpened():
            self.cap.release()

# Global stream instance for demo (In real app, manage per-camera)
video_stream = VideoStreamProcessor(source=0) 
video_stream.start()

def get_video_stream():
    return video_stream
