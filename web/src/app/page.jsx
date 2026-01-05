"use client";

import { useState, useEffect } from "react";
import WalletConnect from "@/components/WalletConnect";
import { getCurrentAccount } from "@/utils/contract";

export default function HomePage() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    checkAccount();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChange);
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
      }
    };
  }, []);

  const checkAccount = async () => {
    const current = await getCurrentAccount();
    setAccount(current);
  };

  const handleAccountChange = (accounts) => {
    setAccount(accounts[0] || null);
  };

  const goToDashboard = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">MedChain</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Decentralized Medical Records
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Secure, private, and accessible medical records on the blockchain.
            Control who sees your health data with complete transparency.
          </p>

          {account ? (
            <button
              onClick={goToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              Go to Dashboard
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-yellow-900 font-medium">
                Connect your wallet to access the platform
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
            <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Secure Storage
            </h3>
            <p className="text-gray-600">
              Your medical records are encrypted and stored on IPFS, ensuring
              privacy and security.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
            <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Controlled Access
            </h3>
            <p className="text-gray-600">
              You decide which doctors can access your records. Approve or
              revoke access anytime.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
            <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Always Available
            </h3>
            <p className="text-gray-600">
              Access your records from anywhere, anytime. No single point of
              failure.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
