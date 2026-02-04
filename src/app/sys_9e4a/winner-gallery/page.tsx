"use client";

import AdminNavbar from "@/components/AdminNavbar";
import WinnerStoryManager from "@/components/WinnerStoryManager";

export default function WinnerGalleryPage() {
  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-8 text-black relative pt-24">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Winner Gallery Management</h1>
                <p className="text-gray-500">Upload and manage photos for the Bento Grid display on the homepage.</p>
            </div>
          <WinnerStoryManager />
        </div>
      </div>
    </>
  );
}
