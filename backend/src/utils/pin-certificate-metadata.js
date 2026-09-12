const crypto = require("crypto");
const { env } = require("../config");

const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

/**
 * Serialises the metadata to a Buffer exactly once, then hashes and pins those
 * same bytes, so the sha256 anchored on-chain is provably the hash of what a
 * gateway will later serve back.
 *
 * Pinning goes through pinFileToIPFS, never pinJSONToIPFS: the JSON endpoint
 * takes an object and re-serialises it server-side, and any difference in
 * whitespace, key order or unicode escaping would produce a CID whose bytes
 * hash to something other than the value we anchored. A file upload is pinned
 * as the literal bytes it receives.
 *
 * Two distinct outcomes when PINATA_JWT is set: success pins and returns the
 * real CID; failure throws, so the caller can refuse to create the certificate
 * rather than silently downgrading to the unpinned stub below.
 *
 * Only when PINATA_JWT is absent does this fall back to a local:// stub CID,
 * a shape no real CIDv0/CIDv1 ever takes, so it is self-evidently not pinned.
 * The metadata itself is kept in the certificates row, which is what makes
 * that stub resolvable through GET /api/v1/certificates/metadata/:cid.
 *
 * The serialised string is returned alongside the hash so the caller stores the
 * exact bytes that were hashed. It must be persisted verbatim as text: round
 * tripping it through a JSONB column reorders keys and changes the digest.
 */
const pinCertificateMetadata = async (metadata) => {
    const bytes = Buffer.from(JSON.stringify(metadata));
    const digest = crypto.createHash("sha256").update(bytes).digest("hex");
    const metadataHash = `0x${digest}`;

    const metadataJson = bytes.toString();

    if (!env.PINATA_JWT) {
        return { ipfsCid: `local://${digest}`, isPinned: false, metadataHash, metadataJson };
    }

    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: "application/json" }), "certificate.json");

    const response = await fetch(PINATA_PIN_FILE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.PINATA_JWT}` },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Pinata responded with ${response.status}`);
    }

    const { IpfsHash } = await response.json();
    if (!IpfsHash) {
        throw new Error("Pinata response did not contain an IpfsHash");
    }

    return { ipfsCid: IpfsHash, isPinned: true, metadataHash, metadataJson };
}

module.exports = { pinCertificateMetadata };
