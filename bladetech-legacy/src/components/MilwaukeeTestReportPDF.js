// src/components/MilwaukeeTestReportPDF.js

import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Register a font (optional)
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me5Q.ttf',
});

// Define styles with enhanced colors and layout
const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 12,
    fontFamily: 'Roboto',
    lineHeight: 1.5,
    backgroundColor: '#f4f4f4',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#4eb857',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    height: 20,
    textAlign: 'center',
    fontSize: 10,
    color: '#888888',
  },
  logo: {
    width: 100,
    height: 30,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
    color: '#4eb857',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    // React PDF doesn't support boxShadow; consider using borders or other styling
    borderWidth: 1,
    borderColor: '#4eb857',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ffffff',
    backgroundColor: '#4eb857',
    padding: 5,
    borderRadius: 3,
    textAlign: 'center',
  },
  fieldContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#555555',
  },
  value: {
    width: '60%',
    color: '#000000',
  },
  measurementsTable: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#4eb857',
    borderRadius: 5,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#4eb857',
    backgroundColor: '#4eb857',
    padding: 5,
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#4eb857',
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableCell: {
    fontSize: 12,
    color: '#000000',
  },
});

// Component to render the PDF
const MilwaukeeTestReportPDF = ({ report }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image src="/images/logo.svg" style={styles.logo} />
        <Text>Milwaukee Test Report</Text>
      </View>

      {/* Footer */}
      <View
        style={styles.footer}
        // React PDF doesn't support dynamic rendering like  components.
        // To include page numbers, use <Text> with 'pageNumber' and 'totalPages' properties.
      >
        <Text
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>Milwaukee Test Report</Text>

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Details</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {report.date && report.date.toDate
              ? report.date.toDate().toLocaleDateString()
              : report.date || 'N/A'}
          </Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Product (SKU):</Text>
          <Text style={styles.value}>{report.sku || 'N/A'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Invoice:</Text>
          <Text style={styles.value}>{report.invoice || 'N/A'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Machine:</Text>
          <Text style={styles.value}>{report.machine || 'N/A'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Sample Count:</Text>
          <Text style={styles.value}>{report.sampleCount || 'N/A'}</Text>
        </View>
      </View>

      {/* Measurements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        {/* Table for Measurements */}
        <View style={styles.measurementsTable}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Measurement</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Value</Text>
            </View>
          </View>
          {/* Table Rows */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Height</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.height || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Blade Width</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.bladeWidth || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Blade Body</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.bladeBody || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Blade Bottom</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.bladeBottom || 'N/A'}</Text>
            </View>
          </View>
          {/* Left Tooth Set */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Left Tooth Set</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.toothSetLeft || 'N/A'}</Text>
            </View>
          </View>
          {/* Right Tooth Set */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Right Tooth Set</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.toothSetRight || 'N/A'}</Text>
            </View>
          </View>
          {/* Gauge */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Gauge</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.gauge || 'N/A'}</Text>
            </View>
          </View>
          {/* Dross */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Dross</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.dross || 'N/A'}</Text>
            </View>
          </View>
          {/* Flatness */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Flatness</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{report.flatness || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default MilwaukeeTestReportPDF;
