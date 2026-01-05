/**
 * Pinata IPFS Upload Service (Client-Side)
 * Direct upload to Pinata from browser
 */

const PINATA_JWT = import.meta.env.NEXT_PUBLIC_PINATA_JWT;

/**
 * Upload a file directly to Pinata IPFS
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, cid?: string, error?: string}>}
 */
export async function uploadToPinata(file) {
    if (!PINATA_JWT) {
        return { success: false, error: "Pinata JWT not configured. Set NEXT_PUBLIC_PINATA_JWT in .env" };
    }

    try {
        const formData = new FormData();
        formData.append("file", file);

        // Add metadata
        const metadata = JSON.stringify({
            name: file.name,
            keyvalues: {
                uploadedAt: new Date().toISOString(),
                type: "medical-record"
            }
        });
        formData.append("pinataMetadata", metadata);

        // Pin options
        const options = JSON.stringify({ cidVersion: 1 });
        formData.append("pinataOptions", options);

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            cid: result.IpfsHash,
            pinSize: result.PinSize,
            timestamp: result.Timestamp
        };
    } catch (error) {
        console.error("Pinata upload error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get the gateway URL for a CID
 * @param {string} cid - The IPFS CID
 * @returns {string} The gateway URL
 */
export function getIPFSUrl(cid) {
    const gateway = import.meta.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";
    return `${gateway}/${cid}`;
}
