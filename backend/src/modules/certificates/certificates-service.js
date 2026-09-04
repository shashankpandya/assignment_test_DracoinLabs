const crypto = require("crypto");
const { ApiError, pinCertificateMetadata } = require("../../utils");
const { findAllStudents } = require("../students/students-repository");
const {
    findCertificates,
    findCertificateById,
    findMetadataByCid,
    addCertificate,
    updateCertificateAnchor,
    updateCertificateRevocation
} = require("./certificates-repository");

const ADMIN_ROLE_ID = 1;

const processGetCertificates = async (payload) => {
    const { userId, roleId } = payload;
    const filter = Number(roleId) === ADMIN_ROLE_ID ? {} : { studentId: userId };
    // an empty list is the normal state of a brand new feature, so this returns []
    // rather than throwing 404 the way getAllStudents and processGetAllStaffs do
    return await findCertificates(filter);
}

const processGetCertificate = async (id, user) => {
    const certificate = await findCertificateById(id);
    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }
    if (Number(user.roleId) !== ADMIN_ROLE_ID && certificate.studentId !== user.id) {
        throw new ApiError(403, "You are not allowed to view this certificate");
    }
    return certificate;
}

const processGetIssuableStudents = async () => {
    // reuses the students repository directly: the students service throws 404 on an
    // empty result set, and its controller layer is not implemented yet
    return await findAllStudents({});
}

const processGetCertificateMetadata = async (cid) => {
    const metadata = await findMetadataByCid(cid);
    if (!metadata) {
        throw new ApiError(404, "Certificate metadata not found");
    }
    return metadata;
}

const processAddCertificate = async (payload) => {
    const { studentId, title, description, issuedDate, recipientAddress } = payload;

    const students = await findAllStudents({});
    const student = students.find((item) => item.id === Number(studentId));
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const metadataJson = {
        name: title,
        description: description || "",
        recipient: student.name,
        issuedDate,
        attributes: [
            { trait_type: "Recipient Wallet", value: recipientAddress },
            { trait_type: "Achievement Date", value: issuedDate }
        ]
    };

    let pinned;
    try {
        pinned = await pinCertificateMetadata(metadataJson);
    } catch (error) {
        throw new ApiError(502, "Unable to pin certificate metadata to IPFS. Please try again.");
    }

    const certId = `0x${crypto.randomBytes(32).toString("hex")}`;
    const { id } = await addCertificate({
        studentId,
        title,
        description,
        issuedDate,
        certId,
        ipfsCid: pinned.ipfsCid,
        isPinned: pinned.isPinned,
        metadataJson: pinned.metadataJson,
        metadataHash: pinned.metadataHash,
        recipientAddress
    });

    return {
        id,
        certId,
        ipfsCid: pinned.ipfsCid,
        isPinned: pinned.isPinned,
        metadataHash: pinned.metadataHash,
        recipientAddress
    };
}

const processAnchorCertificate = async (payload) => {
    const { id } = payload;
    const certificate = await findCertificateById(id);
    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }
    if (certificate.status !== "pending") {
        throw new ApiError(409, "Certificate is not awaiting issuance");
    }

    const affectedRow = await updateCertificateAnchor(payload);
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to record certificate issuance");
    }

    return { message: "Certificate issued successfully" };
}

const processRevokeCertificate = async (payload) => {
    const { id } = payload;
    const certificate = await findCertificateById(id);
    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }
    if (certificate.status !== "issued") {
        throw new ApiError(409, "Only an issued certificate can be revoked");
    }

    const affectedRow = await updateCertificateRevocation(id);
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to record certificate revocation");
    }

    return { message: "Certificate revoked successfully" };
}

module.exports = {
    processGetCertificates,
    processGetCertificate,
    processGetIssuableStudents,
    processGetCertificateMetadata,
    processAddCertificate,
    processAnchorCertificate,
    processRevokeCertificate
};
