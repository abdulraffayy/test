import { useState, useRef, useEffect } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import * as faceapi from "face-api.js";

const ImageCropper = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1 / 1);
  const cropperRef = useRef(null);
  const imageRef = useRef(new Image());

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
          imageRef.current = img;
          setImage(reader.result);

          const detections = await faceapi.detectSingleFace(
            img,
            new faceapi.TinyFaceDetectorOptions()
          );

          if (detections) {
            adjustCropBox(detections.box, img);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustCropBox = (face, img) => {
    setTimeout(() => {
      if (cropperRef.current) {
        const cropper = cropperRef.current.cropper;

        const scaleX = img.width / cropper.getImageData().naturalWidth;
        const scaleY = img.height / cropper.getImageData().naturalHeight;

        const x = face.x / scaleX;
        const y = face.y / scaleY;
        const width = face.width / scaleX;
        const height = face.height / scaleY;

        cropper.setData({
          x: x,
          y: y,
          width: width,
          height: height,
        });
      }
    }, 500);
  };

  const handleCrop = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      const canvas = cropper.getCroppedCanvas();
      const newCanvas = document.createElement("canvas");
      const ctx = newCanvas.getContext("2d");

      let targetWidth, targetHeight;
      if (aspectRatio === 1 / 1) {
        targetWidth = 300;
        targetHeight = 300;
      } else if (aspectRatio === 4 / 5) {
        targetWidth = 300;
        targetHeight = 375;
      } else if (aspectRatio === 16 / 9) {
        targetWidth = 400;
        targetHeight = 225;
      }

      newCanvas.width = targetWidth;
      newCanvas.height = targetHeight;

      ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      setCroppedImage(newCanvas.toDataURL());
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
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          Face Cropping Tool
        </h1>

  
        <div className="flex justify-center mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full max-w-xs text-sm text-gray-500 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
          />
        </div>

       

      
        {image && (
          <div className="grid grid-cols-2 gap-6">
            <div className="relative border rounded-lg overflow-hidden shadow-md">
              <Cropper
                src={image}
                style={{ height: 400, width: "100%" }}
                aspectRatio={aspectRatio}
                guides={true}
                ref={cropperRef}
                cropBoxMovable={false}
                cropBoxResizable={false}
                autoCropArea={1}
              />
            </div>

        
            {croppedImage ? (
              <div className="flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold mb-3">Cropped Face</h2>
                <img
                  src={croppedImage}
                  alt="Cropped Face"
                  className="w-64 h-64 object-cover rounded-lg border shadow-md"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center border rounded-lg p-6 text-gray-500 text-center">
                <p>No Cropped Image Yet</p>
              </div>
            )}
          </div>
        )}


        
         <div className="mt-4 flex justify-center space-x-4 mb-4">
          <button
            onClick={() => setAspectRatio(1 / 1)}
            className={`px-4 py-2 rounded-lg ${
              aspectRatio === 1 / 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            1:1
          </button>
          <button
            onClick={() => setAspectRatio(4 / 5)}
            className={`px-4 py-2 rounded-lg ${
              aspectRatio === 4 / 5 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            4:5
          </button>
          <button
            onClick={() => setAspectRatio(16 / 9)}
            className={`px-4 py-2 rounded-lg ${
              aspectRatio === 16 / 9 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            16:9
          </button>
        </div>

    
        <div className="mt-6 flex justify-center space-x-4">
          {image && (
            <button
              onClick={handleCrop}
              className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              Crop Face
            </button>
          )}

          {croppedImage && (
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              Download Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
