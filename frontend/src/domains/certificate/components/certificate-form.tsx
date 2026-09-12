import * as React from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { Controller, UseFormReturn } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import { parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { LoadingButton } from '@mui/lab';
import { useNavigate } from 'react-router-dom';
import { BrowserProvider } from 'ethers';

import { getErrorMsg } from '@/utils/helpers/get-error-message';
import { API_DATE_FORMAT, DATE_FORMAT, getFormattedDate } from '@/utils/helpers/date';
import { getRegistryContract } from '../util';
import { useWallet } from '../hooks';
import {
  useAddCertificateMutation,
  useAnchorCertificateMutation,
  useGetIssuableStudentsQuery
} from '../api';
import { CertificateForm as CertificateFormType } from '../types';

type CertificateFormProps = {
  methods: UseFormReturn<CertificateFormType>;
  wallet: ReturnType<typeof useWallet>;
};

export const CertificateForm: React.FC<CertificateFormProps> = ({ methods, wallet }) => {
  const { data: studentsData, isLoading: isLoadingStudents } = useGetIssuableStudentsQuery();
  const [addCertificate, { isLoading: isAddingCertificate }] = useAddCertificateMutation();
  const [anchorCertificate, { isLoading: isAnchoringCertificate }] = useAnchorCertificateMutation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = methods;

  const { account, isCorrectChain, hasIssuerRole } = wallet;
  const canIssue = Boolean(account) && isCorrectChain && hasIssuerRole;
  const isSaving = isAddingCertificate || isAnchoringCertificate;

  const handleIssue = async (data: CertificateFormType) => {
    try {
      const { issuedDate, ...rest } = data;
      const payload: CertificateFormType = {
        ...rest,
        issuedDate: getFormattedDate(issuedDate, API_DATE_FORMAT)
      };

      const created = await addCertificate(payload).unwrap();

      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const registry = getRegistryContract(signer);

      const tx = await registry.issueCertificate(
        created.certId,
        payload.recipientAddress,
        created.ipfsCid,
        created.metadataHash
      );
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction did not confirm. Please try again.');
      }

      const network = await provider.getNetwork();

      await anchorCertificate({
        id: created.id,
        issuerAddress: await signer.getAddress(),
        chainId: Number(network.chainId),
        contractAddress: await registry.getAddress(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }).unwrap();

      reset();
      toast.info('Certificate issued successfully');
      navigate('/app/certificates');
    } catch (error) {
      toast.error(getErrorMsg(error as FetchBaseQueryError | SerializedError).message);
    }
  };

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Typography variant='subtitle1' sx={{ mb: 3 }}>
        Issue Certificate
      </Typography>
      <form onSubmit={handleSubmit(handleIssue)}>
        <FormControl fullWidth sx={{ mt: 1 }} size='small'>
          <InputLabel id='student-dropdown' shrink>
            Student
          </InputLabel>
          <Controller
            name='studentId'
            control={control}
            render={({ field: { onChange, value } }) => (
              <Select
                labelId='student-dropdown'
                label='Student'
                value={value || ''}
                onChange={onChange}
                notched
                disabled={isLoadingStudents}
              >
                {studentsData?.students?.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          <FormHelperText error={!!errors.studentId}>{errors.studentId?.message}</FormHelperText>
        </FormControl>

        <TextField
          {...register('title')}
          label='Title'
          fullWidth
          size='small'
          sx={{ mt: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
          error={!!errors.title}
          helperText={errors.title?.message}
        />

        <TextField
          {...register('description')}
          label='Description'
          fullWidth
          multiline
          rows={3}
          size='small'
          sx={{ mt: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
          error={!!errors.description}
          helperText={errors.description?.message}
        />

        <Controller
          name='issuedDate'
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <DatePicker
              label='Achievement Date'
              sx={{ mt: 2, width: '100%' }}
              slotProps={{
                textField: {
                  helperText:
                    error?.message ||
                    'The date the achievement was earned, not the on-chain issuance date.',
                  size: 'small',
                  InputLabelProps: { shrink: true }
                }
              }}
              format={DATE_FORMAT}
              value={typeof value === 'string' ? (value ? parseISO(value) : null) : value}
              onChange={(newDt) => onChange(newDt)}
            />
          )}
        />

        <TextField
          {...register('recipientAddress')}
          label='Recipient Wallet Address'
          fullWidth
          size='small'
          sx={{ mt: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
          error={!!errors.recipientAddress}
          helperText={
            errors.recipientAddress?.message ||
            "The wallet this certificate will be associated with, confirmed with the student out of band. It is not a stored, verified address on the student's account."
          }
        />

        <Box textAlign='center'>
          <Tooltip
            title={
              canIssue
                ? ''
                : 'Connect a wallet on the correct network with issuer access to issue a certificate.'
            }
          >
            <span>
              <LoadingButton
                type='submit'
                size='small'
                variant='contained'
                sx={{ mt: 4 }}
                loading={isSaving}
                disabled={!canIssue}
              >
                Issue Certificate
              </LoadingButton>
            </span>
          </Tooltip>
        </Box>
      </form>
    </Box>
  );
};
