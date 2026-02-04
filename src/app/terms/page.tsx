import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto pt-20">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Terms & Conditions
        </h1>
        <div className="space-y-6 text-slate-300">
          <p>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Participants must be residents of India.</li>
            <li>One entry per person. Duplicate entries will be verified.</li>
            <li>Winners must present valid identification to claim prizes.</li>
            <li>The decision of the judges is final and binding.</li>
            <li>Prizes are non-transferable and cannot be exchanged for cash (unless specified).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
