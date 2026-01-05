"use client";

import { useState, useEffect } from "react";
import WalletConnect from "@/components/WalletConnect";
import {
  getCurrentAccount,
  getContract,
  getSigner,
  getProvider,
} from "@/utils/contract";
import { uploadToPinata } from "@/utils/pinata";

export default function PatientPage() {
  const [account, setAccount] = useState(null);
  const [records, setRecords] = useState([]);
  const [fileNames, setFileNames] = useState({});  // CID -> filename mapping
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [doctorAddress, setDoctorAddress] = useState("");

  // Load file names from localStorage
  const loadFileNames = () => {
    try {
      const stored = localStorage.getItem('medicalRecordFileNames');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Save file name to localStorage
  const saveFileName = (cid, filename) => {
    try {
      const current = loadFileNames();
      current[cid] = filename;
      localStorage.setItem('medicalRecordFileNames', JSON.stringify(current));
      setFileNames(current);
    } catch (e) {
      console.error('Error saving filename:', e);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setFileNames(loadFileNames());  // Load saved file names
      const current = await getCurrentAccount();
      if (!current) {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return;
      }
      setAccount(current);
      await loadRecords();
      await loadApprovedDoctors();
    } catch (err) {
      console.error("Init error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      console.log("Loading records...");
      // Use signer instead of provider - getMyRecords() needs msg.sender context
      const signer = await getSigner();
      const contract = await getContract(signer);
      console.log("Calling getMyRecords...");
      const recordCIDs = await contract.getMyRecords();
      console.log("Records from contract:", recordCIDs);
      console.log("Records length:", recordCIDs.length);
      // Convert to regular array if needed
      const recordsArray = Array.isArray(recordCIDs) ? recordCIDs : [...recordCIDs];
      console.log("Records array:", recordsArray);
      setRecords(recordsArray);
    } catch (err) {
      console.error("Error loading records:", err);
    }
  };

  const loadApprovedDoctors = async () => {
    try {
      // Use signer - isDoctorApproved needs msg.sender context
      const signer = await getSigner();
      const contract = await getContract(signer);
      const allDoctors = await contract.getAllDoctors();

      const approved = [];
      for (const doctor of allDoctors) {
        const isApproved = await contract.isDoctorApproved(doctor);
        if (isApproved) {
          approved.push(doctor);
        }
      }
      setApprovedDoctors(approved);
    } catch (err) {
      console.error("Error loading approved doctors:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Upload to Pinata directly (client-side)
      console.log("Uploading to Pinata...");
      const uploadResult = await uploadToPinata(file);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload to IPFS");
      }

      const cid = uploadResult.cid;
      console.log("Uploaded to IPFS with CID:", cid);

      // Save filename to localStorage
      saveFileName(cid, file.name);

      // Add record to smart contract
      console.log("Getting signer...");
      const signer = await getSigner();
      console.log("Getting contract...");
      const contract = await getContract(signer);
      console.log("Calling addRecord with CID:", cid);
      const tx = await contract.addRecord(cid);
      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");
      await tx.wait();
      console.log("Transaction confirmed!");

      setSuccess("Record uploaded successfully!");
      console.log("Reloading records...");
      await loadRecords();
      e.target.value = "";
    } catch (err) {
      console.error("Upload error:", err);
      // Don't show error if user cancelled the transaction
      if (err.code === "ACTION_REJECTED" || err.message?.includes("user rejected")) {
        // User cancelled - no error message needed
        return;
      }
      // Show friendly error message for other errors
      setError(err.reason || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRecord = async (index) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      setError(null);
      const signer = await getSigner();
      const contract = await getContract(signer);
      const tx = await contract.deleteRecord(index);
      await tx.wait();
      setSuccess("Record deleted successfully!");
      await loadRecords();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
    }
  };

  const handleApproveDoctor = async () => {
    if (!doctorAddress) {
      setError("Please enter a doctor address");
      return;
    }

    try {
      setError(null);
      const signer = await getSigner();
      const contract = await getContract(signer);
      const tx = await contract.approveDoctor(doctorAddress);
      await tx.wait();
      setSuccess("Doctor approved successfully!");
      setDoctorAddress("");
      await loadApprovedDoctors();
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message);
    }
  };

  const handleRevokeDoctor = async (doctor) => {
    if (!confirm("Revoke access for this doctor?")) return;

    try {
      setError(null);
      const signer = await getSigner();
      const contract = await getContract(signer);
      const tx = await contract.revokeDoctor(doctor);
      await tx.wait();
      setSuccess("Doctor access revoked!");
      await loadApprovedDoctors();
    } catch (err) {
      console.error("Revoke error:", err);
      setError(err.message);
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Portal
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
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Medical Record
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-gray-600 mb-2">
                  {uploading
                    ? "Uploading..."
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-500">
                  PDF, PNG, JPG, DOC up to 10MB
                </p>
              </label>
            </div>
          </div>

          {/* Manage Doctors */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Manage Doctor Access
            </h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
                placeholder="Doctor wallet address (0x...)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleApproveDoctor}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Approve
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Approved Doctors:
              </p>
              {approvedDoctors.length === 0 ? (
                <p className="text-gray-500 text-sm">No approved doctors</p>
              ) : (
                approvedDoctors.map((doctor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-sm font-mono text-gray-700">
                      {doctor}
                    </span>
                    <button
                      onClick={() => handleRevokeDoctor(doctor)}
                      className="text-red-600 hover:text-red-700"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            My Medical Records
          </h2>
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No records uploaded yet
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((cid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {fileNames[cid] || `Record #${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-500 font-mono break-all">
                      {cid}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={getIPFSUrl(cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200"
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
                    <button
                      onClick={() => handleDeleteRecord(index)}
                      className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
