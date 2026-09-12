import * as React from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import { Block, VerifiedUser } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';

import { getErrorMsg } from '@/utils/helpers/get-error-message';
import { useGetCertificatesQuery } from '../api';
import { CertificateFormWithId } from '../types';
import { useWallet } from '../hooks';
import { CertificateStatus } from './certificate-status';
import { RevokeCertificate } from './revoke-certificate';

type CertificateDataProps = {
  wallet: ReturnType<typeof useWallet>;
};

export const CertificateData: React.FC<CertificateDataProps> = ({ wallet }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<{ id: number; certId: string } | null>(null);
  const { data, isLoading, isError, error } = useGetCertificatesQuery();

  const columns: MRT_ColumnDef<CertificateFormWithId>[] = [
    { accessorKey: 'studentName', header: 'STUDENT' },
    { accessorKey: 'title', header: 'TITLE' },
    { accessorKey: 'issuedDate', header: 'ACHIEVEMENT DATE' },
    {
      accessorKey: 'status',
      header: 'STATUS',
      Cell: ({ row }) => <CertificateStatus status={row.original.status} />
    }
  ];

  const openModal = (id: number, certId: string) => {
    setSelected({ id, certId });
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setSelected(null);
  };

  const table = useMaterialReactTable({
    data: isError ? [] : data?.certificates || [],
    columns,
    state: {
      isLoading,
      density: 'compact'
    },
    enableDensityToggle: false,
    getRowId: (row) => row?.id?.toString(),
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => {
      const {
        original: { id, certId, status }
      } = row;
      return (
        <>
          <IconButton
            title='Verify certificate'
            color='info'
            component={Link}
            to={`/app/certificates/verify?certId=${certId}`}
          >
            <VerifiedUser />
          </IconButton>
          <IconButton
            title='Revoke certificate'
            color='error'
            disabled={status !== 'issued'}
            onClick={() => openModal(id, certId)}
          >
            <Block />
          </IconButton>
        </>
      );
    },
    renderEmptyRowsFallback: () => {
      const errorMsg = isError ? getErrorMsg(error).message : 'No records to display';
      return <Box sx={{ textAlign: 'center', fontStyle: 'italic', my: 3 }}>{errorMsg}</Box>;
    }
  });

  return (
    <>
      <Box component={Paper} sx={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
        <MaterialReactTable table={table} />
      </Box>

      {isOpen && selected && (
        <RevokeCertificate
          certificateId={selected.id}
          certId={selected.certId}
          closeModal={closeModal}
          wallet={wallet}
        />
      )}
    </>
  );
};
