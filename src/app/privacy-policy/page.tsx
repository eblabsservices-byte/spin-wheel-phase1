import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto pt-20">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Privacy Policy
        </h1>
        <div className="space-y-6 text-slate-300">
          <p>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p>
            At Yes Bharath Lucky Spinner, we verify every winner directly. We respect your privacy and represent that all data collected is solely for the purpose of the contest and prize distribution.
          </p>
          <p>
            We do not share your personal information with third parties unrelated to the contest administration.
          </p>
        </div>
      </div>
    </div>
  );
}
