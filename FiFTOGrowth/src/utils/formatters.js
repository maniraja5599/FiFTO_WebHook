export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatNumber = (number) => {
    if (number === undefined || number === null) return '0';
    return new Intl.NumberFormat('en-IN').format(number);
};
