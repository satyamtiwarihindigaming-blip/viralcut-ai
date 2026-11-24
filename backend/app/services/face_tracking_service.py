import cv2
import os
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

class FaceTrackingService:
    def __init__(self):
        # Locate Haar Cascade face model from local app directory or cv2.data
        local_cascade = os.path.join(os.path.dirname(os.path.dirname(__file__)), "haarcascade_frontalface_default.xml")
        cv2_cascade = getattr(cv2.data, "haarcascades", "") + "haarcascade_frontalface_default.xml"
        
        cascade_path = None
        if os.path.exists(local_cascade):
            cascade_path = local_cascade
        elif os.path.exists(cv2_cascade):
            cascade_path = cv2_cascade

        if hasattr(cv2, "CascadeClassifier") and cascade_path and os.path.exists(cascade_path):
            try:
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception:
                self.face_cascade = None
        else:
            self.face_cascade = None

    def analyze_faces_in_clip(
        self,
        video_path: str,
        start_time: float,
        end_time: float,
        sample_fps: float = 4.0
    ) -> Dict[str, Any]:
        """
        Samples video frames within [start_time, end_time] and computes smoothed face trajectories,
        speaker distribution, and recommends the optimal framing layout.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video file: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        start_frame = int(start_time * video_fps)
        end_frame = min(total_frames, int(end_time * video_fps))

        step_frames = max(1, int(video_fps / sample_fps))

        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        frame_index = start_frame
        raw_detections: List[Dict[str, Any]] = []

        while frame_index <= end_frame:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            current_time = round(frame_index / video_fps, 2)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            detected_boxes = []
            if self.face_cascade is not None:
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.15,
                    minNeighbors=4,
                    minSize=(int(height * 0.08), int(height * 0.08)),
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                for (x, y, w, h) in faces:
                    detected_boxes.append({
                        "x": int(x),
                        "y": int(y),
                        "w": int(w),
                        "h": int(h),
                        "center_x": int(x + w / 2),
                        "center_y": int(y + h / 2),
                    })

            raw_detections.append({
                "time": current_time,
                "faces": detected_boxes,
                "face_count": len(detected_boxes)
            })

            frame_index += step_frames

        cap.release()

        # Analyze speaker presence & layout recommendation
        avg_face_count = 0
        if raw_detections:
            avg_face_count = sum(d["face_count"] for d in raw_detections) / len(raw_detections)

        # Classify recommended layout
        if avg_face_count >= 1.6:
            # Consistently 2 people (e.g. podcast interview)
            recommended_layout = "split_screen"
        elif avg_face_count >= 0.4:
            # Single main speaker
            recommended_layout = "speaker_tracking"
        else:
            # No clear face (e.g. screen recording, gameplay, wide landscape B-roll)
            recommended_layout = "blurred_bg"

        # Compute smoothed horizontal focal center trajectory (X-smoothing)
        smoothed_trajectory = self._compute_smoothed_trajectory(raw_detections, width, height)

        return {
            "recommended_layout": recommended_layout,
            "avg_faces_detected": round(avg_face_count, 2),
            "video_width": width,
            "video_height": height,
            "trajectory": smoothed_trajectory,
        }

    def _compute_smoothed_trajectory(
        self,
        detections: List[Dict[str, Any]],
        video_width: int,
        video_height: int
    ) -> List[Dict[str, float]]:
        """
        Calculates EMA-smoothed center of visual interest to eliminate erratic jitter.
        """
        default_center_x = video_width / 2.0
        smoothed = []
        last_smoothed_x = default_center_x
        alpha = 0.25 # Smoothing factor (0.0 to 1.0)

        for d in detections:
            faces = d.get("faces", [])
            if faces:
                # Find largest face (dominant subject)
                largest = max(faces, key=lambda f: f["w"] * f["h"])
                target_x = float(largest["center_x"])
            else:
                # Gentle decay back toward center if no face detected
                target_x = default_center_x

            # Apply exponential smoothing
            last_smoothed_x = alpha * target_x + (1 - alpha) * last_smoothed_x

            smoothed.append({
                "time": d["time"],
                "focal_x": round(last_smoothed_x, 1),
            })

        return smoothed

face_tracking_service = FaceTrackingService()
