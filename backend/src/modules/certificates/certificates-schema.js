const { z } = require("zod");

const AddCertificateSchema = z.object({
    body: z.object({
        studentId: z.coerce.number().int().positive("Student is required"),
        title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
        description: z.string().max(400, "Description must be at most 400 characters").optional(),
        issuedDate: z.string().min(1, "Achievement date is required"),
        recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Recipient wallet address is invalid")
    })
});

module.exports = {
    AddCertificateSchema
};
