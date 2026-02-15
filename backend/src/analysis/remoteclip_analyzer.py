"""
RemoteCLIP Analyzer Module
Analyzes satellite imagery using RemoteCLIP vision-language model to detect
and describe geographical changes over time.
"""

import os
import torch
import open_clip
from PIL import Image
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from huggingface_hub import hf_hub_download
import numpy as np


class RemoteCLIPAnalyzer:
    """
    RemoteCLIP-based analyzer for satellite/remote sensing imagery.
    Provides temporal change detection and natural language descriptions.
    """
    
    # Categories for remote sensing analysis
    LAND_USE_CATEGORIES = [
        "urban area with buildings and roads",
        "residential neighborhood with houses",
        "industrial zone with factories",
        "commercial district with shops",
        "agricultural land with crops",
        "farmland with fields",
        "dense forest",
        "sparse vegetation",
        "grassland and meadows",
        "water body like lake or river",
        "ocean or sea",
        "wetland or marsh",
        "desert or barren land",
        "snow or ice covered area",
        "construction site",
        "airport with runways",
        "port or harbor",
        "solar farm",
        "parking lot",
        "sports facility or stadium",
    ]
    
    CHANGE_DESCRIPTIONS = [
        "new construction and urban development",
        "deforestation and vegetation loss",
        "reforestation and vegetation growth",
        "urban expansion",
        "agricultural expansion",
        "water level changes",
        "infrastructure development",
        "industrial development",
        "natural disaster damage",
        "land degradation",
        "coastal erosion",
        "flooding",
        "drought effects",
        "seasonal vegetation changes",
        "no significant changes",
    ]

    def __init__(self, model_name: str = 'ViT-B-32', device: str = None):
        """
        Initialize RemoteCLIP analyzer.
        
        Args:
            model_name: One of 'RN50', 'ViT-B-32', or 'ViT-L-14'
            device: 'cuda' or 'cpu', auto-detected if None
        """
        self.model_name = model_name
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self._initialized = False
        
    def initialize(self):
        """Load RemoteCLIP model and weights."""
        if self._initialized:
            return
            
        print(f"🛰️ Loading RemoteCLIP ({self.model_name})...")
        
        # Create model
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(self.model_name)
        self.tokenizer = open_clip.get_tokenizer(self.model_name)
        
        # Download and load RemoteCLIP weights
        checkpoint_path = hf_hub_download(
            "chendelong/RemoteCLIP", 
            f"RemoteCLIP-{self.model_name}.pt",
            cache_dir=Path(__file__).parent.parent.parent / 'models' / 'pretrained'
        )
        
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        self.model.load_state_dict(checkpoint)
        self.model = self.model.to(self.device)
        self.model.eval()
        
        self._initialized = True
        print(f"✓ RemoteCLIP loaded successfully on {self.device}")
        
    def _encode_image(self, image_path: str) -> torch.Tensor:
        """Encode a single image to feature vector."""
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            image_features = self.model.encode_image(image_tensor)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
        return image_features
    
    def _encode_texts(self, texts: List[str]) -> torch.Tensor:
        """Encode text descriptions to feature vectors."""
        text_tokens = self.tokenizer(texts).to(self.device)
        
        with torch.no_grad():
            text_features = self.model.encode_text(text_tokens)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
        return text_features
    
    def classify_land_use(self, image_path: str, top_k: int = 3) -> List[Dict]:
        """
        Classify land use in a satellite image.
        
        Args:
            image_path: Path to satellite image
            top_k: Number of top predictions to return
            
        Returns:
            List of {category, confidence} dicts
        """
        if not self._initialized:
            self.initialize()
            
        image_features = self._encode_image(image_path)
        text_features = self._encode_texts(self.LAND_USE_CATEGORIES)
        
        # Compute similarity
        similarity = (image_features @ text_features.T).squeeze(0)
        probs = torch.softmax(similarity * 100, dim=0)
        
        # Get top-k predictions
        top_probs, top_indices = probs.topk(top_k)
        
        results = []
        for prob, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
            results.append({
                'category': self.LAND_USE_CATEGORIES[idx],
                'confidence': float(prob)
            })
            
        return results
    
    def compare_images(self, image1_path: str, image2_path: str) -> Dict:
        """
        Compare two satellite images and compute similarity.
        
        Args:
            image1_path: Path to first (earlier) image
            image2_path: Path to second (later) image
            
        Returns:
            Dictionary with similarity score and analysis
        """
        if not self._initialized:
            self.initialize()
            
        features1 = self._encode_image(image1_path)
        features2 = self._encode_image(image2_path)
        
        # Cosine similarity
        similarity = (features1 @ features2.T).item()
        
        # Classify both images
        class1 = self.classify_land_use(image1_path, top_k=1)[0]
        class2 = self.classify_land_use(image2_path, top_k=1)[0]
        
        # Determine if change occurred
        change_detected = similarity < 0.85 or class1['category'] != class2['category']
        
        return {
            'similarity': similarity,
            'change_detected': change_detected,
            'image1_classification': class1,
            'image2_classification': class2,
        }
    
    def detect_changes(self, image1_path: str, image2_path: str, top_k: int = 3) -> Dict:
        """
        Detect and describe changes between two temporal images.
        
        Args:
            image1_path: Path to earlier image
            image2_path: Path to later image
            top_k: Number of top change descriptions
            
        Returns:
            Dictionary with change analysis
        """
        if not self._initialized:
            self.initialize()
            
        # Get image features
        features1 = self._encode_image(image1_path)
        features2 = self._encode_image(image2_path)
        
        # Compute difference vector (representing change)
        diff_features = features2 - features1
        diff_features = diff_features / diff_features.norm(dim=-1, keepdim=True)
        
        # Match against change descriptions
        change_texts = [f"This area shows {desc}" for desc in self.CHANGE_DESCRIPTIONS]
        text_features = self._encode_texts(change_texts)
        
        # Use the later image with change context
        combined_features = (features2 + diff_features * 0.5)
        combined_features = combined_features / combined_features.norm(dim=-1, keepdim=True)
        
        similarity = (combined_features @ text_features.T).squeeze(0)
        probs = torch.softmax(similarity * 100, dim=0)
        
        top_probs, top_indices = probs.topk(top_k)
        
        changes = []
        for prob, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
            changes.append({
                'description': self.CHANGE_DESCRIPTIONS[idx],
                'confidence': float(prob)
            })
            
        # Compute overall similarity
        overall_similarity = (features1 @ features2.T).item()
        
        return {
            'overall_similarity': overall_similarity,
            'change_magnitude': 1 - overall_similarity,
            'detected_changes': changes,
        }
    
    def analyze_temporal_sequence(
        self, 
        image_paths: List[str], 
        dates: List[str] = None
    ) -> Dict:
        """
        Analyze a sequence of images over time.
        
        Args:
            image_paths: List of image paths in chronological order
            dates: Optional list of dates corresponding to images
            
        Returns:
            Comprehensive temporal analysis
        """
        if not self._initialized:
            self.initialize()
            
        if len(image_paths) < 2:
            raise ValueError("Need at least 2 images for temporal analysis")
            
        results = {
            'num_images': len(image_paths),
            'dates': dates,
            'individual_classifications': [],
            'pairwise_changes': [],
            'overall_trend': None,
        }
        
        # Classify each image
        all_features = []
        for i, path in enumerate(image_paths):
            features = self._encode_image(path)
            all_features.append(features)
            
            classification = self.classify_land_use(path, top_k=2)
            results['individual_classifications'].append({
                'index': i,
                'date': dates[i] if dates else None,
                'classification': classification
            })
        
        # Analyze pairwise changes
        for i in range(len(image_paths) - 1):
            change_analysis = self.detect_changes(image_paths[i], image_paths[i + 1])
            results['pairwise_changes'].append({
                'from_index': i,
                'to_index': i + 1,
                'from_date': dates[i] if dates else None,
                'to_date': dates[i + 1] if dates else None,
                'analysis': change_analysis
            })
        
        # Overall trend (first vs last)
        if len(image_paths) >= 2:
            overall_change = self.detect_changes(image_paths[0], image_paths[-1])
            first_class = results['individual_classifications'][0]['classification'][0]
            last_class = results['individual_classifications'][-1]['classification'][0]
            
            results['overall_trend'] = {
                'total_change_magnitude': overall_change['change_magnitude'],
                'primary_changes': overall_change['detected_changes'],
                'land_use_transition': {
                    'from': first_class['category'],
                    'to': last_class['category'],
                    'same_category': first_class['category'] == last_class['category']
                }
            }
        
        return results
    
    def generate_report(self, temporal_analysis: Dict) -> str:
        """
        Generate a natural language report from temporal analysis.
        
        Args:
            temporal_analysis: Output from analyze_temporal_sequence
            
        Returns:
            Human-readable analysis report
        """
        report_lines = []
        report_lines.append("=" * 60)
        report_lines.append("GEOSPATIAL TEMPORAL ANALYSIS REPORT")
        report_lines.append("Powered by RemoteCLIP | IEEE TGRS 2024")
        report_lines.append("=" * 60)
        report_lines.append("")
        
        # Overview
        num_images = temporal_analysis['num_images']
        dates = temporal_analysis.get('dates', [])
        if dates and len(dates) >= 2:
            report_lines.append(f"📅 Analysis Period: {dates[0]} to {dates[-1]}")
        report_lines.append(f"🖼️ Images Analyzed: {num_images}")
        report_lines.append("")
        
        # Land use classifications
        report_lines.append("📍 LAND USE CLASSIFICATION:")
        report_lines.append("-" * 40)
        for item in temporal_analysis['individual_classifications']:
            date_str = f" ({item['date']})" if item['date'] else ""
            top_class = item['classification'][0]
            report_lines.append(
                f"  Image {item['index'] + 1}{date_str}: "
                f"{top_class['category']} ({top_class['confidence']*100:.1f}%)"
            )
        report_lines.append("")
        
        # Changes detected
        report_lines.append("🔄 TEMPORAL CHANGES:")
        report_lines.append("-" * 40)
        for change in temporal_analysis['pairwise_changes']:
            from_date = change.get('from_date', f"Image {change['from_index']+1}")
            to_date = change.get('to_date', f"Image {change['to_index']+1}")
            analysis = change['analysis']
            
            report_lines.append(f"  {from_date} → {to_date}:")
            report_lines.append(f"    Change magnitude: {analysis['change_magnitude']*100:.1f}%")
            
            top_change = analysis['detected_changes'][0]
            report_lines.append(
                f"    Primary change: {top_change['description']} "
                f"({top_change['confidence']*100:.1f}%)"
            )
        report_lines.append("")
        
        # Overall trend
        if temporal_analysis.get('overall_trend'):
            trend = temporal_analysis['overall_trend']
            report_lines.append("📊 OVERALL TREND:")
            report_lines.append("-" * 40)
            
            transition = trend['land_use_transition']
            if transition['same_category']:
                report_lines.append(f"  Land use: Remained as {transition['from']}")
            else:
                report_lines.append(f"  Land use transition: {transition['from']} → {transition['to']}")
            
            report_lines.append(f"  Total change magnitude: {trend['total_change_magnitude']*100:.1f}%")
            
            report_lines.append("  Key changes detected:")
            for change in trend['primary_changes'][:3]:
                report_lines.append(f"    • {change['description']} ({change['confidence']*100:.1f}%)")
        
        report_lines.append("")
        report_lines.append("=" * 60)
        
        return "\n".join(report_lines)


# Singleton instance for reuse
_analyzer_instance: Optional[RemoteCLIPAnalyzer] = None

def get_analyzer(model_name: str = 'ViT-B-32') -> RemoteCLIPAnalyzer:
    """Get or create a RemoteCLIP analyzer instance."""
    global _analyzer_instance
    if _analyzer_instance is None or _analyzer_instance.model_name != model_name:
        _analyzer_instance = RemoteCLIPAnalyzer(model_name)
    return _analyzer_instance
