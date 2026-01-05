"use client";

import { useState, useEffect } from "react";
import {
  connectWallet,
  getCurrentAccount,
  formatAddress,
} from "../utils/contract";

export default function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      const currentAccount = await getCurrentAccount();
      setAccount(currentAccount);
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (account) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-900">
          {formatAddress(account)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        {loading ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
