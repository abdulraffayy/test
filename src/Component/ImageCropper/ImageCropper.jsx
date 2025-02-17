import { useRef, useState, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import * as faceapi from 'face-api.js';

function ImageCropper() {
  const [image, setImage] = useState(null);
  const cropperRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    };
    loadModels();
  }, []);

  const onImageChange = (e) => {
    e.preventDefault();
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      detectFaces(reader.result);
    };
    reader.readAsDataURL(files[0]);
  };

  const detectFaces = async (imageSrc) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
      if (detections.length > 0) {
        const { x, y, width, height } = detections[0].box;
        const cropper = cropperRef.current.cropper;

        // Set the crop box to the detected face's bounding box
        cropper.setCropBoxData({
          left: x,
          top: y,
          width: width,
          height: height,
        });
      }
    };
  };

  const getCroppedImage = () => {
    const cropper = cropperRef.current.cropper;
    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedImage = croppedCanvas.toDataURL();
    const previewImageElement = document.getElementById('previewImage');
    if (previewImageElement) {
      previewImageElement.src = croppedImage;
    }
    
    // Create a circular mask on the cropped image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = Math.min(croppedCanvas.width, croppedCanvas.height);
    canvas.width = size;
    canvas.height = size;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(croppedCanvas, 0, 0, size, size);

    const circularImage = canvas.toDataURL();
    const link = document.createElement('a');
    link.href = circularImage;
    link.download = 'circular-cropped-image.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Image Cropping Tool</h1>
      <input
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="mb-4 p-2 border border-gray-300 rounded-xl shadow-sm"
      />
      {image && (
        <div className="w-full max-w-2xl mb-4">
          <Cropper
            src={image}
            style={{ height: 400, width: '100%' }}
            aspectRatio={1} // Aspect ratio set to 1:1 for square crop
            guides={false}
            ref={cropperRef}
          />
        </div>
      )}
      <button
        onClick={getCroppedImage}
        className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 transition duration-300"
      >
        Download Circular Cropped Image
      </button>
    </div>
  );
}

export default ImageCropper;