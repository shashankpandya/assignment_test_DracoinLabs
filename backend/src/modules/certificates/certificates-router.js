const express = require("express");
const router = express.Router();
const certificatesController = require("./certificates-controller");
const { checkApiAccess } = require("../../middlewares");
const { validateRequest } = require("../../utils");
const { AddCertificateSchema } = require("./certificates-schema");

router.get("/students", checkApiAccess, certificatesController.handleGetIssuableStudents);
router.get("/metadata/:cid", checkApiAccess, certificatesController.handleGetCertificateMetadata);
router.get("", checkApiAccess, certificatesController.handleGetCertificates);
router.post("", checkApiAccess, validateRequest(AddCertificateSchema), certificatesController.handleAddCertificate);
router.post("/:id/anchor", checkApiAccess, certificatesController.handleAnchorCertificate);
router.post("/:id/revoke", checkApiAccess, certificatesController.handleRevokeCertificate);
router.get("/:id", checkApiAccess, certificatesController.handleGetCertificate);

module.exports = { certificatesRoutes: router };
