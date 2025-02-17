import { useState, useRef, useEffect } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import * as faceapi from "face-api.js";

const ImageCropper = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const cropperRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    };
    loadModels();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = async () => {
          setImage(reader.result);

          // Detect face
          const detections = await faceapi.detectAllFaces(
            img,
            new faceapi.TinyFaceDetectorOptions()
          );
          if (detections.length > 0) {
            const face = detections[0].box;
            setFaceBox(face);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };


  const handleCrop = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      setCroppedImage(cropper.getCroppedCanvas().toDataURL());
    }
  };

  
  const handleDownload = () => {
    if (croppedImage) {
      const link = document.createElement("a");
      link.href = croppedImage;
      link.download = "cropped-face.png";
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Face Cropping Tool</h1>

     
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

     
        {image && (
          <div className="mb-4 relative">
            <Cropper
              src={image}
              style={{ height: 400, width: "100%" }}
              aspectRatio={1 / 1}
              guides={true}
              ref={cropperRef}
              cropBoxMovable={false}
              cropBoxResizable={false}
              autoCropArea={1}
              data={{
                x: faceBox?.x || 0,
                y: faceBox?.y || 0,
                width: faceBox?.width || 100,
                height: faceBox?.height || 100,
              }}
            />
          </div>
        )}

       
        <div className="flex space-x-4">
          <button
            onClick={handleCrop}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Crop Face
          </button>
          {croppedImage && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Download Cropped Image
            </button>
          )}
        </div>

        
        {croppedImage && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Cropped Face Preview</h2>
            <img
              src={croppedImage}
              alt="Cropped Face"
              className="max-w-full h-auto rounded-lg shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCropper;
