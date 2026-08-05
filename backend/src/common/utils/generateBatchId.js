export const generateBatchId = (factoryCode = 'F1', productCode = 'JUICE', date = new Date(), sequence = 1) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const seqStr = String(sequence).padStart(3, '0');
  
  const cleanProduct = String(productCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanFactory = String(factoryCode).toUpperCase().replace(/[^A-Z0-9]/g, '');

  return `${cleanFactory}-${cleanProduct}-${dateStr}-${seqStr}`;
};
