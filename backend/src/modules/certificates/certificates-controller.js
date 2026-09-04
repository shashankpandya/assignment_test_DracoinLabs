const asyncHandler = require("express-async-handler");
const {
    processGetCertificates,
    processGetCertificate,
    processGetIssuableStudents,
    processGetCertificateMetadata,
    processAddCertificate,
    processAnchorCertificate,
    processRevokeCertificate
} = require("./certificates-service");

const handleGetCertificates = asyncHandler(async (req, res) => {
    const { id: userId, roleId } = req.user;
    const certificates = await processGetCertificates({ userId, roleId });
    res.json({ certificates });
});

const handleGetCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const certificate = await processGetCertificate(id, req.user);
    res.json(certificate);
});

const handleGetIssuableStudents = asyncHandler(async (req, res) => {
    const students = await processGetIssuableStudents();
    res.json({ students });
});

const handleGetCertificateMetadata = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const metadata = await processGetCertificateMetadata(cid);
    res.json(metadata);
});

const handleAddCertificate = asyncHandler(async (req, res) => {
    const payload = req.body;
    const certificate = await processAddCertificate(payload);
    res.json(certificate);
});

const handleAnchorCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { id: issuerId } = req.user;
    const payload = req.body;
    const message = await processAnchorCertificate({ ...payload, id, issuerId });
    res.json(message);
});

const handleRevokeCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await processRevokeCertificate({ id });
    res.json(message);
});

module.exports = {
    handleGetCertificates,
    handleGetCertificate,
    handleGetIssuableStudents,
    handleGetCertificateMetadata,
    handleAddCertificate,
    handleAnchorCertificate,
    handleRevokeCertificate
};
