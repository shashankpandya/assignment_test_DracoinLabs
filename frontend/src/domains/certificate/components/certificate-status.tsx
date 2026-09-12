import * as React from 'react';
import { Block, Done, Pending } from '@mui/icons-material';
import { Chip } from '@mui/material';

import { CertificateStatus as CertificateStatusType } from '../types';

type StatusMap = {
  [key in CertificateStatusType]: ['default' | 'success' | 'error', JSX.Element];
};

const statusMap: StatusMap = {
  pending: ['default', <Pending />],
  issued: ['success', <Done />],
  revoked: ['error', <Block />]
};

type CertificateStatusProps = {
  status: CertificateStatusType;
};

export const CertificateStatus: React.FC<CertificateStatusProps> = ({ status }) => {
  const [color, icon] = statusMap[status] || ['default', null];

  return <Chip icon={icon} label={status} color={color} sx={{ textTransform: 'capitalize' }} />;
};
