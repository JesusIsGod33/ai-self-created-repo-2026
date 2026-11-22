import numpy as np
from skimage import io, filters
import cv2

def load_image(image_path):
    """Loads an image from a file path."""
    return io.imread(image_path)

def apply_grayscale(image):
    """Applies grayscale to an image."""
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def apply_blur(image):
    """Applies blur to an image."""
    return cv2.GaussianBlur(image, (5, 5), 0)

def save_image(image, output_path):
    """Saves an image to a file path."""
    io.imsave(output_path, image)

def main():
    # Example usage:
    image_path = "input_image.jpg"
    output_path = "output_image.jpg"
    
    image = load_image(image_path)
    grayscale_image = apply_grayscale(image)
    blurred_image = apply_blur(grayscale_image)
    
    save_image(blurred_image, output_path)

if __name__ == "__main__":
    main()