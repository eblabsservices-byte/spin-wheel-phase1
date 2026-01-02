"use client";

import { useState, useEffect } from "react";
import { Trash2, Upload, ImageIcon } from "lucide-react";

const PRIZES = [
  'iPhone 17',
  'Haier Smart TV',
  'iBell Airfryer',
  'JBL GO Speaker',
  'Shirt',
  'Saree',
  'Voucher'
];

export default function WinnerStoryManager() {
  const [stories, setStories] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/sys_9e4a/winner-stories");
      const json = await res.json();
      if (json.data) setStories(json.data);
    } catch (e) {
      console.error("Failed to fetch stories", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/sys_9e4a/winner-stories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStories(prev => prev.filter(s => s._id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      alert("Error deleting");
    }
  };

  /* ======================
     DRAG & DROP HANDLERS
     ====================== */
  const handleDrag = (e: React.DragEvent, prize: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prize);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, prize: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files), prize);
    }
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>, prize: string) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files), prize);
      e.target.value = ""; // Reset
    }
  };

  /* ======================
     FILE PROCESSING & COMPRESSION
     ====================== */
  const processFiles = async (files: File[], prizeLabel: string) => {
    setUploading(prizeLabel);
    const images: string[] = [];
    const MAX_SIZE_KB = 500;

    for (const file of files) {
      try {
        // Check basic type
        if (!file.type.startsWith("image/")) {
          console.warn(`Skipping non-image: ${file.name}`);
          continue;
        }

        let base64 = "";

        // If file is already small enough and is a supported web format, use as is (if user wants original).
        // BUT user requested auto-compress to avif/webp if approx 500kb.
        // Let's standardise: always try to compress if > 500KB or if it's not a web friendly format.
        // Actually, user said: "if img is about 500km , auto maticaly compres to to 500km with avif formte"
        // We'll implement a robust compressor.

        if (file.size / 1024 > MAX_SIZE_KB) {
          base64 = await compressImage(file, MAX_SIZE_KB);
        } else {
          // Determine if we should convert anyway (e.g. BMP/TIFF to WebP)
          // For simplicity, just convert everything to base64.
          // If it's small enough, we just read it. 
          // However, to ensure consistency (avif/webp preference), we might want to compress anyway?
          // Let's stick to: if > 500KB, compress. Else read directly (preserving quality).
          base64 = await readFileAsBase64(file);
        }

        images.push(base64);
      } catch (err) {
        console.error(`Error processing ${file.name}`, err);
      }
    }

    if (images.length > 0) {
      await uploadImages(images, prizeLabel);
    }
    setUploading(null);
  };

  const compressImage = (file: File, maxKb: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Initial max dimension constraint (e.g. 1920px) to help size
        const MAX_DIM = 1920;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject("Canvas error"); return; }

        ctx.drawImage(img, 0, 0, width, height);

        // Recursive compression attempt
        // Try AVIF first, then WebP, then JPEG
        const attemptCompression = (quality: number, format: "image/avif" | "image/webp" | "image/jpeg"): string => {
          const dataUrl = canvas.toDataURL(format, quality);
          return dataUrl;
        };

        // Simple Loop to find quality
        let quality = 0.9;
        let dataUrl = attemptCompression(quality, "image/avif"); // Try AVIF

        // Check if browser supports AVIF (returns data:image/avif). If not, it falls back to PNGusually (data:image/png) or just ignores arg.
        // If dataUrl starts with data:image/png, browser doesn't support avif/webp write probably.
        if (dataUrl.startsWith("data:image/png") && file.type !== "image/png") {
          // Fallback to jpeg if browser doesn't support modern writing
          dataUrl = attemptCompression(quality, "image/jpeg");
        } else if (!dataUrl.startsWith("data:image/avif")) {
          // fallback to webp
          dataUrl = attemptCompression(quality, "image/webp");
        }

        // Estimate size (Base64 length * 0.75)
        while (dataUrl.length * 0.75 > maxKb * 1024 && quality > 0.1) {
          quality -= 0.1;
          // If quality gets too low, we might need to resize further, but for now just quality
          dataUrl = attemptCompression(quality, "image/webp"); // Fallback to WebP heavily as it's safe
        }

        resolve(dataUrl);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = (e) => reject(e);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const uploadImages = async (images: string[], prizeLabel: string) => {
    try {
      const res = await fetch("/api/sys_9e4a/winner-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, prizeLabel })
      });
      if (res.ok) {
        await fetchStories();
      } else {
        alert("Upload failed.");
      }
    } catch (e) {
      alert("Upload error");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📸 Winner Story Gallery</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
          <ImageIcon size={14} /> Supports Drag & Drop (Auto-compress {'>'} 500KB)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRIZES.map(prize => {
          // If prize is 'Voucher', we want to show all voucher types (Voucher, ₹500 Voucher, ₹100 Voucher)
          const prizeStories = stories.filter(s => {
            if (prize === 'Voucher') {
              return s.prizeLabel === 'Voucher' || s.prizeLabel.includes('Voucher');
            }
            return s.prizeLabel === prize;
          });
          const isActive = dragActive === prize;

          return (
            <div
              key={prize}
              className={`border-2 rounded-xl p-4 transition-all relative ${isActive ? 'border-dashed border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50/50 hover:bg-white'
                }`}
              onDragEnter={(e) => handleDrag(e, prize)}
              onDragLeave={(e) => handleDrag(e, prize)}
              onDragOver={(e) => handleDrag(e, prize)}
              onDrop={(e) => handleDrop(e, prize)}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${prizeStories.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <h3 className="font-bold text-gray-700">{prize}</h3>
                  <span className="text-xs text-gray-400">({prizeStories.length})</span>
                </div>

                <label className={`cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={14} />
                  {uploading === prize ? "..." : "ADD"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleInput(e, prize)}
                    disabled={!!uploading}
                  />
                </label>
              </div>

              {/* Drop Overlay Hint */}
              {isActive && (
                <div className="absolute inset-0 bg-blue-100/80 z-20 flex items-center justify-center rounded-xl backdrop-blur-sm pointer-events-none">
                  <span className="text-blue-600 font-bold text-lg flex items-center gap-2">
                    <Upload /> Drop images here
                  </span>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {/* Preview only top 3 */}
                {prizeStories.slice(0, 3).map(story => (
                  <div key={story._id} className="relative group aspect-square bg-gray-200 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <img src={story.imageUrl} className="w-full h-full object-cover" loading="lazy" alt="prize winner" />
                    <button
                      onClick={() => handleDelete(story._id)}
                      className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Show View All if > 3 */}
                {prizeStories.length > 3 && (
                  <button
                    onClick={() => setViewAll(prize)}
                    className="aspect-square flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-200 transition text-gray-500 hover:text-gray-700"
                  >
                    <span className="text-xl font-bold">+{prizeStories.length - 3}</span>
                    <span className="text-xs">View All</span>
                  </button>
                )}

                {/* Empty State placeholder */}
                {prizeStories.length === 0 && !isActive && (
                  <div className="col-span-4 h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                    <span className="text-xs text-gray-400">Drag & Drop or click ADD</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Modal */}
      {viewAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{viewAll} Gallery</h3>
                <p className="text-xs text-gray-500">
                  Total {stories.filter(s => s.prizeLabel === viewAll || (viewAll === 'Voucher' && s.prizeLabel.includes('Voucher'))).length} images
                </p>
              </div>
              <button onClick={() => setViewAll(null)} className="p-2 hover:bg-red-100 hover:text-red-500 rounded-full transition w-10 h-10 flex items-center justify-center">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {stories.filter(s => {
                if (viewAll === 'Voucher') return s.prizeLabel === 'Voucher' || s.prizeLabel.includes('Voucher');
                return s.prizeLabel === viewAll;
              }).map(story => (
                <div key={story._id} className="relative group aspect-square bg-gray-200 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                  <img src={story.imageUrl} className="w-full h-full object-cover" loading="lazy" alt="prize winner" />
                  <button
                    onClick={() => handleDelete(story._id)}
                    className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

