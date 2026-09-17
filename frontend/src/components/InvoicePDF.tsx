import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '2 solid #f1f5f9',
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#64748b',
    width: 100,
  },
  value: {
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  table: {
    width: '100%',
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCol1: { width: '50%', fontWeight: 'bold' },
  tableHeaderCol2: { width: '25%', fontWeight: 'bold', textAlign: 'right' },
  tableHeaderCol3: { width: '25%', fontWeight: 'bold', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottom: '1 solid #f1f5f9',
  },
  tableCol1: { width: '50%' },
  tableCol2: { width: '25%', textAlign: 'right' },
  tableCol3: { width: '25%', textAlign: 'right' },
  summaryBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    width: '50%',
    alignSelf: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { color: '#64748b' },
  summaryValue: { fontWeight: 'bold' },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 10,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  }
});

interface InvoicePDFProps {
  invoice: any;
  workshopName?: string;
  gstin?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, workshopName = 'GarageBook Pro', gstin = '' }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{workshopName}</Text>
            {gstin ? <Text style={styles.subtitle}>GSTIN: {gstin}</Text> : null}
            <Text style={styles.subtitle}>TAX INVOICE</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>{invoice.invoiceNo}</Text>
            <Text style={styles.subtitle}>Date: {new Date(invoice.createdAt || invoice.date || Date.now()).toLocaleDateString()}</Text>
            <Text style={styles.subtitle}>Status: {invoice.status}</Text>
          </View>
        </View>

        {/* Customer & Vehicle Info */}
        <View style={{ flexDirection: 'row', marginBottom: 30 }}>
          <View style={{ width: '50%' }}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Customer:</Text>
              <Text style={styles.value}>{invoice.customerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle No:</Text>
              <Text style={styles.value}>{invoice.vehicleNo}</Text>
            </View>
            {invoice.jobCardId ? (
              <View style={styles.row}>
                <Text style={styles.label}>Job Card Ref:</Text>
                <Text style={styles.value}>{invoice.jobCardId}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCol1}>Description</Text>
            <Text style={styles.tableHeaderCol3}>Amount</Text>
          </View>

          {invoice.partsTotal > 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Spare Parts & Consumables</Text>
              <Text style={styles.tableCol3}>Rs. {invoice.partsTotal.toFixed(2)}</Text>
            </View>
          ) : null}

          {invoice.laborTotal > 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Labor & Service Charges</Text>
              <Text style={styles.tableCol3}>Rs. {invoice.laborTotal.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>Rs. {(invoice.partsTotal + invoice.laborTotal).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({invoice.taxRate || 18}%):</Text>
            <Text style={styles.summaryValue}>Rs. {(invoice.taxAmount).toFixed(2)}</Text>
          </View>
          <View style={{ ...styles.summaryRow, marginTop: 10, paddingTop: 10, borderTop: '1 solid #cbd5e1' }}>
            <Text style={{ ...styles.summaryLabel, fontWeight: 'bold', color: '#0f172a' }}>Grand Total:</Text>
            <Text style={styles.grandTotal}>Rs. {(invoice.grandTotal).toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing {workshopName}. For any queries regarding this invoice, please contact support.</Text>
          <Text style={{ marginTop: 4 }}>This is a computer generated invoice and does not require a physical signature.</Text>
        </View>

      </Page>
    </Document>
  );
};
