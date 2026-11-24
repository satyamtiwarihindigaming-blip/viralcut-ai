import os
from typing import List, Dict, Any
from scenedetect import open_video, SceneManager
from scenedetect.detectors import ContentDetector, AdaptiveDetector

class SceneDetectorService:
    def detect_scenes(
        self,
        video_path: str,
        threshold: float = 27.0,
        min_scene_len_sec: float = 1.5
    ) -> List[Dict[str, float]]:
        """
        Detect visual scene boundaries and shot transitions using PySceneDetect.
        Returns a list of scene segments: [{'scene': 1, 'start': 0.0, 'end': 4.2}, ...]
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        try:
            video = open_video(video_path)
            scene_manager = SceneManager()
            
            # Use ContentDetector for cuts and scene changes
            scene_manager.add_detector(ContentDetector(threshold=threshold, min_scene_len=int(min_scene_len_sec * video.frame_rate)))
            
            scene_manager.detect_scenes(video)
            scene_list = scene_manager.get_scene_list()

            results = []
            for i, (start_time, end_time) in enumerate(scene_list):
                results.append({
                    "scene": i + 1,
                    "start": round(start_time.get_seconds(), 2),
                    "end": round(end_time.get_seconds(), 2),
                    "duration": round((end_time - start_time).get_seconds(), 2)
                })

            # If no scenes were detected or video is a continuous shot
            if not results:
                total_duration = video.duration.get_seconds() if video.duration else 0.0
                results.append({
                    "scene": 1,
                    "start": 0.0,
                    "end": round(total_duration, 2),
                    "duration": round(total_duration, 2)
                })

            return results
        except Exception as e:
            # Fallback gracefully to whole video segment on any detection error
            return [{
                "scene": 1,
                "start": 0.0,
                "end": 999999.0,
                "duration": 999999.0
            }]

scene_detector_service = SceneDetectorService()
