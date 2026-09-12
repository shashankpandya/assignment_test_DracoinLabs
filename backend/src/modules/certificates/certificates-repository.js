const { processDBRequest } = require("../../utils");

const findCertificates = async (payload) => {
    const { studentId } = payload;
    let query = `
        SELECT
            t1.id,
            t1.title,
            t1.description,
            t1.issued_dt AS "issuedDate",
            t1.cert_id AS "certId",
            t1.ipfs_cid AS "ipfsCid",
            t1.is_pinned AS "isPinned",
            t1.metadata_hash AS "metadataHash",
            t1.recipient_address AS "recipientAddress",
            t1.contract_address AS "contractAddress",
            t1.chain_id AS "chainId",
            t1.tx_hash AS "txHash",
            t1.status,
            t1.student_id AS "studentId",
            t2.name AS "studentName"
        FROM certificates t1
        LEFT JOIN users t2 ON t1.student_id = t2.id
        WHERE 1=1
    `;
    let queryParams = [];
    if (studentId) {
        query += ` AND t1.student_id = $${queryParams.length + 1}`;
        queryParams.push(studentId);
    }

    query += ` ORDER BY t1.id DESC`;

    const { rows } = await processDBRequest({ query, queryParams });
    return rows;
}

const findCertificateById = async (id) => {
    const query = `
        SELECT
            t1.id,
            t1.title,
            t1.description,
            t1.issued_dt AS "issuedDate",
            t1.cert_id AS "certId",
            t1.ipfs_cid AS "ipfsCid",
            t1.is_pinned AS "isPinned",
            t1.metadata_hash AS "metadataHash",
            t1.recipient_address AS "recipientAddress",
            t1.issuer_address AS "issuerAddress",
            t1.contract_address AS "contractAddress",
            t1.chain_id AS "chainId",
            t1.tx_hash AS "txHash",
            t1.block_number AS "blockNumber",
            t1.status,
            t1.revoked_dt AS "revokedDate",
            t1.student_id AS "studentId",
            t2.name AS "studentName"
        FROM certificates t1
        LEFT JOIN users t2 ON t1.student_id = t2.id
        WHERE t1.id = $1
    `;
    const queryParams = [id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const findMetadataByCid = async (cid) => {
    const query = `
        SELECT
            ipfs_cid AS "ipfsCid",
            is_pinned AS "isPinned",
            metadata_json AS "metadataJson"
        FROM certificates
        WHERE ipfs_cid = $1
    `;
    const queryParams = [cid];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const addCertificate = async (payload) => {
    const {
        studentId,
        title,
        description,
        issuedDate,
        certId,
        ipfsCid,
        isPinned,
        metadataJson,
        metadataHash,
        recipientAddress
    } = payload;
    const query = `
        INSERT INTO certificates
            (student_id, title, description, issued_dt, cert_id, ipfs_cid, is_pinned,
             metadata_json, metadata_hash, recipient_address, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        RETURNING id
    `;
    const queryParams = [
        studentId,
        title,
        description,
        issuedDate,
        certId,
        ipfsCid,
        isPinned,
        metadataJson,
        metadataHash,
        recipientAddress
    ];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const updateCertificateAnchor = async (payload) => {
    const now = new Date();
    const { id, issuerId, issuerAddress, chainId, contractAddress, txHash, blockNumber } = payload;
    const query = `
        UPDATE certificates
        SET
            issuer_id = $2,
            issuer_address = $3,
            chain_id = $4,
            contract_address = $5,
            tx_hash = $6,
            block_number = $7,
            status = 'issued',
            updated_dt = $8
        WHERE id = $1
        AND status = 'pending'
    `;
    const queryParams = [id, issuerId, issuerAddress, chainId, contractAddress, txHash, blockNumber, now];
    const { rowCount } = await processDBRequest({ query, queryParams });
    return rowCount;
}

const updateCertificateRevocation = async (id) => {
    const now = new Date();
    const query = `
        UPDATE certificates
        SET
            status = 'revoked',
            revoked_dt = $2,
            updated_dt = $2
        WHERE id = $1
        AND status = 'issued'
    `;
    const queryParams = [id, now];
    const { rowCount } = await processDBRequest({ query, queryParams });
    return rowCount;
}

module.exports = {
    findCertificates,
    findCertificateById,
    findMetadataByCid,
    addCertificate,
    updateCertificateAnchor,
    updateCertificateRevocation
};
