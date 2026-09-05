import { Grid2 } from '@mui/material';
import { WorkspacePremium } from '@mui/icons-material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { PageContentHeader } from '@/components/page-content-header';
import { CertificateForm, WalletConnect } from '../components';
import { CertificateForm as CertificateFormType, CertificateFormSchema } from '../types';
import { useWallet } from '../hooks';

export const IssueCertificatePage = () => {
  const wallet = useWallet();
  const methods = useForm<CertificateFormType>({
    defaultValues: {
      studentId: 0,
      title: '',
      description: '',
      issuedDate: '',
      recipientAddress: ''
    },
    resolver: zodResolver(CertificateFormSchema)
  });

  return (
    <>
      <PageContentHeader icon={<WorkspacePremium sx={{ mr: 1 }} />} heading='Issue Certificate' />
      <WalletConnect wallet={wallet} />
      <Grid2 container columnSpacing={5} rowSpacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CertificateForm methods={methods} wallet={wallet} />
        </Grid2>
      </Grid2>
    </>
  );
};
