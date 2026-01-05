"use client";

import { useState, useEffect } from "react";
import WalletConnect from "@/components/WalletConnect";
import { getCurrentAccount, getContract, getProvider, getSigner } from "@/utils/contract";

export default function DoctorPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientAddress, setPatientAddress] = useState("");
  const [patientRecords, setPatientRecords] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const current = await getCurrentAccount();
      if (!current) {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return;
      }
      setAccount(current);

      // Verify user is a doctor
      const provider = await getProvider();
      const contract = await getContract(provider);
      const isDoctor = await contract.isDoctor(current);

      if (!isDoctor) {
        setError("You are not registered as a doctor");
      }
    } catch (err) {
      console.error("Init error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatient = async () => {
    if (!patientAddress) {
      setError("Please enter a patient address");
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setPatientRecords([]);
      setHasAccess(false);

      // Use signer for access checks (needs msg.sender)
      const signer = await getSigner();
      const contract = await getContract(signer);

      // Check access
      const canAccess = await contract.canAccessPatient(patientAddress);
      setHasAccess(canAccess);

      if (canAccess) {
        const records = await contract.getPatientRecords(patientAddress);
        setPatientRecords(records);
      } else {
        setError("You do not have access to this patient's records");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const getIPFSUrl = (cid) => {
    const gateway =
      import.meta.env.NEXT_PUBLIC_PINATA_GATEWAY ||
      "https://gateway.pinata.cloud/ipfs";
    return `${gateway}/${cid}`;
  };

  const goBack = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
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
              <h1 className="text-2xl font-bold text-gray-900">
                Doctor Portal
              </h1>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Search Patient */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search Patient Records
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="Enter patient wallet address (0x...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSearchPatient}
              disabled={searching}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              {searching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Patient Records */}
        {hasAccess && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Patient Records
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Patient: <span className="font-mono">{patientAddress}</span>
            </p>

            {patientRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                This patient has no medical records
              </p>
            ) : (
              <div className="space-y-3">
                {patientRecords.map((cid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Record #{index + 1}
                      </p>
                      <p className="text-sm text-gray-500 font-mono break-all">
                        {cid}
                      </p>
                    </div>
                    <a
                      href={getIPFSUrl(cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasAccess && patientAddress && !searching && !error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-900">
              You need to be approved by this patient to view their records
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
