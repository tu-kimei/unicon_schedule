import { useMemo, useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  onRemove?: (index: number) => void;
  editable?: boolean;
}

const isImageFile = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
const isPdfFile = (url: string) => /\.pdf(\?.*)?$/i.test(url);
const getFileName = (url: string) => {
  try {
    return decodeURIComponent(url.split('/').pop() || url);
  } catch {
    return url.split('/').pop() || url;
  }
};

export const ImageGallery = ({ images, onRemove, editable = false }: ImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const imageOnlyItems = useMemo(() => images.filter(isImageFile), [images]);

  if (!images || images.length === 0) {
    return <div className="text-gray-500 text-sm italic">Chưa có hình ảnh</div>;
  }

  const openLightbox = (url: string) => {
    const imageIndex = imageOnlyItems.findIndex((item) => item === url);
    if (imageIndex >= 0) {
      setCurrentImage(imageIndex);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % imageOnlyItems.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + imageOnlyItems.length) % imageOnlyItems.length);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, index) => {
          const isImage = isImageFile(url);
          const isPdf = isPdfFile(url);

          return (
            <div
              key={index}
              className={`relative group rounded border border-gray-200 bg-white overflow-hidden ${isImage ? 'cursor-pointer' : ''}`}
              onClick={() => isImage && openLightbox(url)}
            >
              {isImage ? (
                <>
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-28 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center pointer-events-none">
                    <svg
                      className="w-6 h-6 text-white opacity-0 group-hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center h-28 px-3 text-center hover:bg-gray-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isPdf ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {isPdf ? 'PDF' : 'FILE'}
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2 break-all">{getFileName(url)}</p>
                  <span className="mt-1 text-xs text-primary-600">Mở file</span>
                </a>
              )}

              {editable && onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {lightboxOpen && imageOnlyItems.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
          >
            ×
          </button>

          {imageOnlyItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white text-4xl hover:text-gray-300"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white text-4xl hover:text-gray-300"
              >
                ›
              </button>
            </>
          )}

          <img
            src={imageOnlyItems[currentImage]}
            alt={`Image ${currentImage + 1}`}
            className="max-w-[90%] max-h-[90%] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-white">
            {currentImage + 1} / {imageOnlyItems.length}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
