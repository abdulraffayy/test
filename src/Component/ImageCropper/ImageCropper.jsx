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
      const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
      if (detections.length > 0) {
        const { x, y, width, height } = detections[0].box;
        const cropper = cropperRef.current.cropper;
        const imageData = cropper.getImageData();
        
        // Calculate the center of the face
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Calculate the crop box size
        const cropBoxWidth = Math.min(width * 2, imageData.naturalWidth);
        const cropBoxHeight = Math.min(height * 2, imageData.naturalHeight);

        // Set the crop box to center the face
        cropper.setCropBoxData({
          left: Math.max(centerX - cropBoxWidth / 2, 0),
          top: Math.max(centerY - cropBoxHeight / 2, 0),
          width: cropBoxWidth,
          height: cropBoxHeight,
        });
      }
    };
  };

  const getCroppedImage = () => {
    const cropper = cropperRef.current.cropper;
    const croppedImage = cropper.getCroppedCanvas().toDataURL();
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = 'cropped-image.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Image Cropping Tool</h1>
      <input
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="mb-4 p-2 border border-gray-300 rounded-md shadow-sm"
      />
      {image && (
        <div className="w-full max-w-2xl mb-4">
          <Cropper
            src={image}
            style={{ height: 400, width: '100%' }}
            aspectRatio={1} // Change this to 4/5 or 16/9 as needed
            guides={false}
            ref={cropperRef}
          />
        </div>
      )}
      <button
        onClick={getCroppedImage}
        className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 transition duration-300"
      >
        Download Cropped Image
      </button>
    </div>
  );
}

export default ImageCropper;