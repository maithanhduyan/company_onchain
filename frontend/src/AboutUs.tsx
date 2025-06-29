import React from "react";

export default function AboutUs() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">About Us</h1>
      <p className="text-lg text-gray-700 max-w-xl text-center mb-8">
        Welcome to our demo! This page is styled with <span className="font-semibold text-blue-500">Tailwind CSS</span>.<br/>
        You can freely customize and use utility classes for rapid UI development.
      </p>
      <div className="flex gap-4">
        <ProfileCard name="Alice" role="Frontend Developer" />
        <ProfileCard name="Bob" role="Backend Developer" />
      </div>
    </div>
  );
}

function ProfileCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-60 flex flex-col items-center border border-gray-200">
      <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-2xl font-bold text-blue-700 mb-2">
        {name.charAt(0)}
      </div>
      <div className="font-semibold text-lg mb-1">{name}</div>
      <div className="text-gray-500 text-sm">{role}</div>
    </div>
  );
}
