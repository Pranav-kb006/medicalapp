"use client";

import { useState, useEffect } from "react";
import WalletConnect from "@/components/WalletConnect";
import { getCurrentAccount, getContract, getProvider } from "@/utils/contract";

export default function DashboardPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    checkAccountAndRole();
  }, []);

  const checkAccountAndRole = async () => {
    try {
      setLoading(true);
      const current = await getCurrentAccount();

      if (!current) {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return;
      }

      setAccount(current);

      // Check role
      const provider = await getProvider();
      const contract = await getContract(provider);

      const adminAddress = await contract.admin();
      const isDoctorUser = await contract.isDoctor(current);

      if (current.toLowerCase() === adminAddress.toLowerCase()) {
        setRole("admin");
      } else if (isDoctorUser) {
        setRole("doctor");
      } else {
        setRole("patient");
      }
    } catch (err) {
      console.error("Error checking role:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigateTo("/")}
          >
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Patient Dashboard */}
          <button
            onClick={() => navigateTo("/patient")}
            className={`bg-white rounded-xl p-8 shadow-sm border-2 transition-all text-left hover:shadow-md ${role === "patient"
                ? "border-blue-500"
                : "border-gray-200 hover:border-blue-300"
              }`}
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Patient Portal
            </h3>
            <p className="text-gray-600 mb-4">
              Upload and manage your medical records. Control doctor access.
            </p>
            {role === "patient" && (
              <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                Your Role
              </span>
            )}
          </button>

          {/* Doctor Dashboard */}
          <button
            onClick={() => navigateTo("/doctor")}
            className={`bg-white rounded-xl p-8 shadow-sm border-2 transition-all text-left hover:shadow-md ${role === "doctor"
                ? "border-purple-500"
                : "border-gray-200 hover:border-purple-300"
              }`}
          >
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Doctor Portal
            </h3>
            <p className="text-gray-600 mb-4">
              Access patient records with permission. View medical history.
            </p>
            {role === "doctor" && (
              <span className="inline-block bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">
                Your Role
              </span>
            )}
          </button>

          {/* Admin Dashboard */}
          <button
            onClick={() => navigateTo("/admin")}
            className={`bg-white rounded-xl p-8 shadow-sm border-2 transition-all text-left hover:shadow-md ${role === "admin"
                ? "border-green-500"
                : "border-gray-200 hover:border-green-300"
              }`}
          >
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Admin Panel
            </h3>
            <p className="text-gray-600 mb-4">
              Register and manage doctors. System administration.
            </p>
            {role === "admin" && (
              <span className="inline-block bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                Your Role
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
