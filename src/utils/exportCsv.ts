import { Lead } from '../types';

export function exportLeadsToCsv(leads: Lead[], filename = 'sproute-leads.csv') {
  const headers = [
    'Name',
    'Category',
    'Address',
    'Phone',
    'Website',
    'Rating',
    'Status',
    'Saved Date',
    'Notes',
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.category,
    lead.address,
    lead.phone ?? '',
    lead.website ?? '',
    lead.rating ?? '',
    lead.status,
    new Date(lead.savedAt).toLocaleDateString(),
    lead.notes ?? '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}