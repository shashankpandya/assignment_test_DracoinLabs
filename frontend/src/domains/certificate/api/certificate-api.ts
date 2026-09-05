import { api, Tag } from '@/api';
import {
  AddCertificateResponse,
  AnchorCertificatePayload,
  CertificateData,
  CertificateForm,
  CertificateFormWithId,
  CertificateMetadataResponse,
  IssuableStudentsData
} from '../types';

const certificateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCertificates: builder.query<CertificateData, void>({
      query: () => `/certificates`,
      providesTags: (result) =>
        result?.certificates?.map(({ id }) => {
          return { type: Tag.CERTIFICATES, id };
        }) || [{ type: Tag.CERTIFICATES }]
    }),
    getCertificate: builder.query<CertificateFormWithId, number>({
      query: (id) => `/certificates/${id}`,
      providesTags: (result) => (result ? [{ type: Tag.CERTIFICATES, id: result.id }] : [])
    }),
    getIssuableStudents: builder.query<IssuableStudentsData, void>({
      query: () => `/certificates/students`
    }),
    getCertificateMetadata: builder.query<CertificateMetadataResponse, string>({
      query: (cid) => `/certificates/metadata/${encodeURIComponent(cid)}`
    }),
    // Overrides the shared 10s baseQuery timeout: this request pins the metadata to IPFS
    // server-side before responding, which can run long on a slow Pinata round-trip.
    addCertificate: builder.mutation<AddCertificateResponse, CertificateForm>({
      query: (payload) => ({
        url: `/certificates`,
        method: 'POST',
        body: payload,
        timeout: 30000
      }),
      invalidatesTags: (result) => (result ? [Tag.CERTIFICATES] : [])
    }),
    anchorCertificate: builder.mutation<{ message: string }, AnchorCertificatePayload>({
      query: ({ id, ...body }) => ({
        url: `/certificates/${id}/anchor`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, _error, { id }) => (result ? [{ type: Tag.CERTIFICATES, id }] : [])
    }),
    revokeCertificate: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/certificates/${id}/revoke`,
        method: 'POST'
      }),
      invalidatesTags: (result, _error, id) => (result ? [{ type: Tag.CERTIFICATES, id }] : [])
    })
  })
});

export const {
  useGetCertificatesQuery,
  useGetCertificateQuery,
  useGetIssuableStudentsQuery,
  useLazyGetCertificateMetadataQuery,
  useAddCertificateMutation,
  useAnchorCertificateMutation,
  useRevokeCertificateMutation
} = certificateApi;
