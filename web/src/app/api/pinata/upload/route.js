export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      return Response.json(
        { error: "Pinata JWT not configured" },
        { status: 500 },
      );
    }

    // Create FormData for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // Upload to Pinata
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: pinataFormData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata upload error:", errorText);
      return Response.json(
        { error: "Failed to upload to Pinata" },
        { status: response.status },
      );
    }

    const result = await response.json();

    return Response.json({
      cid: result.IpfsHash,
      success: true,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      {
        error: error.message || "Upload failed",
      },
      { status: 500 },
    );
  }
}
