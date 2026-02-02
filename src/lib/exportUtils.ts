
/**
 * Utility to export an array of objects to a CSV file.
 * @param data Array of objects to export
 * @param filename Desired filename (without extension)
 * @param headers Optional custom headers mapping { key: 'Display Name' }
 */
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
    if (!data || data.length === 0) return;

    const keys = Object.keys(headers || data[0]);
    const headerRow = keys.map(key => headers ? headers[key] : key).join(',');

    const rows = data.map(item => {
        return keys.map(key => {
            let val = item[key];
            if (val === null || val === undefined) val = '';
            if (typeof val === 'string') {
                // Escape quotes and wrap in quotes if contains comma
                val = val.replace(/"/g, '""');
                if (val.includes(',')) val = `"${val}"`;
            }
            return val;
        }).join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
