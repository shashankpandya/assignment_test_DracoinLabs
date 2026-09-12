import { Box, Button } from '@mui/material';
import { Add, FactCheck, WorkspacePremium } from '@mui/icons-material';
import { Link } from 'react-router-dom';

import { PageContentHeader } from '@/components/page-content-header';
import { CertificateData, WalletConnect } from '../components';
import { useWallet } from '../hooks';

export const ListCertificatesPage = () => {
  const wallet = useWallet();

  return (
    <>
      <Box sx={{ display: 'flex', mb: 1, gap: 1 }}>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            size='small'
            color='secondary'
            variant='contained'
            startIcon={<FactCheck />}
            component={Link}
            to='/app/certificates/verify'
          >
            Verify Certificate
          </Button>
          <Button
            size='small'
            color='primary'
            variant='contained'
            startIcon={<Add />}
            component={Link}
            to='/app/certificates/issue'
          >
            Issue Certificate
          </Button>
        </Box>
      </Box>
      <WalletConnect wallet={wallet} />
      <PageContentHeader icon={<WorkspacePremium sx={{ mr: 1 }} />} heading='Certificates' />
      <CertificateData wallet={wallet} />
    </>
  );
};
