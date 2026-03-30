// src/components/ShiftAnalysis.js

import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Dialog,
  IconButton,
  DialogTitle,
  DialogContent,
  Button,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Vibrant color palette for charts
const COLORS = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
  '#D37295',
  '#F1CE63',
];

// List of activities
const activitiesList = [
  'Laser1',
  'Laser2',
  'Welder',
  'Coating',
  'Stacking',
  'OperatorActivity',
];

const ShiftAnalysis = () => {
  // Main data and loading state
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Goodsin documents (only invoice field will be used)
  const [goodsinInvoices, setGoodsinInvoices] = useState([]);

  // ---------------------------
  // FILTER STATES
  // ---------------------------
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedSKUs, setSelectedSKUs] = useState([]);
  // Invoice filter: single-select (empty string means no filter)
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(getTodayDate());
  const [minScrap, setMinScrap] = useState('');
  const [selectedDailyActivities, setSelectedDailyActivities] = useState(['Laser1', 'Laser2']);
  
  // Employee rate table state
  const [showRateTable, setShowRateTable] = useState(true);
  const [rateTableStartDate, setRateTableStartDate] = useState('');
  const [rateTableEndDate, setRateTableEndDate] = useState(getTodayDate());
  const [showRateTrends, setShowRateTrends] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly'

  // ---------------------------
  // REPORT STATES
  // ---------------------------
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [openMonthlyReportDialog, setOpenMonthlyReportDialog] = useState(false);
  const [openInvoiceReportDialog, setOpenInvoiceReportDialog] = useState(false);
  const [invoiceReport, setInvoiceReport] = useState(null);

  // ---------------------------
  // DIALOG STATES (Charts & Table)
  // ---------------------------
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChart, setSelectedChart] = useState('');
  const [openTableDialog, setOpenTableDialog] = useState(false);

  // ---------------------------
  // DRILL-DOWN STATES
  // ---------------------------
  const [openMonthlyShiftDialog, setOpenMonthlyShiftDialog] = useState(false);
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);

  // ---------------------------
  // HELPER FUNCTIONS
  // ---------------------------
  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown';
    return new Date(dateObj).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = `0${today.getMonth() + 1}`.slice(-2);
    const day = `0${today.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  }

  function getCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = `0${today.getMonth() + 1}`.slice(-2);
    return `${year}-${month}`;
  }

  // ---------------------------
  // DIALOG HANDLERS
  // ---------------------------
  const handleOpenDialog = (chartName) => {
    setSelectedChart(chartName);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChart('');
  };

  const handleOpenTableDialog = () => {
    setOpenTableDialog(true);
  };
  const handleCloseTableDialog = () => {
    setOpenTableDialog(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleOpenMonthlyShiftDialog = () => {
    setOpenMonthlyShiftDialog(true);
  };

  const handleCloseMonthlyShiftDialog = () => {
    setOpenMonthlyShiftDialog(false);
  };

  const handleRowClick = (params) => {
    const shiftId = params.row.id;
    const shiftDetail = shiftData.find((shift) => shift.id === shiftId);
    setSelectedShiftDetail(shiftDetail);
  };

  const handleCloseShiftDetail = () => {
    setSelectedShiftDetail(null);
  };

  // ---------------------------
  // FETCH DATA FROM FIRESTORE
  // ---------------------------
  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        const shiftCollection = collection(db, 'Shiftdata');
        const shiftSnapshot = await getDocs(shiftCollection);
        const shifts = shiftSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? doc.data().date.toDate() : null,
        }));

        // For each shift, fetch each activity subcollection
        const shiftsWithActivities = await Promise.all(
          shifts.map(async (shift) => {
            const activitiesData = {};
            await Promise.all(
              activitiesList.map(async (activity) => {
                const activityCollection = collection(db, `Shiftdata/${shift.id}/${activity}`);
                const activitySnapshot = await getDocs(activityCollection);
                const activityDocs = activitySnapshot.docs.map((doc) => doc.data());
                const totalUnits = activityDocs.reduce(
                  (sum, d) => sum + (d.UnitsProduced || 0),
                  0
                );
                const totalTime = activityDocs.reduce(
                  (sum, d) => sum + (d.TimeSpent || 0),
                  0
                );
                const totalScrap = activityDocs.reduce(
                  (sum, d) => sum + (d.Scrap || 0),
                  0
                );
                const skus = activityDocs
                  .map((d) => d.Sku)
                  .filter((sku) => sku !== null && sku !== '-');
                // Get InvoiceNumber from first document (if available)
                const invoiceNumber = activityDocs.length > 0 ? activityDocs[0].InvoiceNumber : null;
                activitiesData[activity] = {
                  UnitsProduced: totalUnits,
                  TimeSpent: totalTime,
                  Scrap: totalScrap,
                  sku: skus.length > 0 ? skus.join(', ') : '-',
                  InvoiceNumber: invoiceNumber,
                };
              })
            );
            return { ...shift, activities: activitiesData };
          })
        );

        // Fetch Goodsin data
        const goodinsCollection = collection(db, 'Goodsin');
        const goodinsSnapshot = await getDocs(goodinsCollection);
        const goodins = goodinsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Build a map for SKU -> Invoices
        const skuToInvoicesMap = {};
        goodins.forEach((goodin) => {
          const sku = goodin.sku;
          const invoice = goodin.invoice;
          if (sku && invoice) {
            if (!skuToInvoicesMap[sku]) {
              skuToInvoicesMap[sku] = new Set();
            }
            skuToInvoicesMap[sku].add(invoice);
          }
        });

        setGoodsinInvoices(goodins);

        // Optionally, map invoices to each shift's activities (if needed)
        const shiftsWithInvoices = shiftsWithActivities.map((shift) => {
          const activitiesWithInvoices = {};
          Object.entries(shift.activities).forEach(([activityName, activityData]) => {
            const skus =
              activityData.sku && activityData.sku !== '-'
                ? activityData.sku.split(', ')
                : [];
            const invoices = new Set();
            skus.forEach((sku) => {
              if (skuToInvoicesMap[sku]) {
                skuToInvoicesMap[sku].forEach((inv) => invoices.add(inv));
              }
            });
            activitiesWithInvoices[activityName] = {
              ...activityData,
              invoices: Array.from(invoices),
            };
          });
          return { ...shift, activities: activitiesWithInvoices };
        });

        setShiftData(shiftsWithInvoices);

        // Set start date to earliest shift date if available
        const dates = shiftsWithActivities
          .map((shift) => shift.date)
          .filter((date) => date !== null && date instanceof Date);
        if (dates.length > 0) {
          const earliestDate = new Date(Math.min(...dates));
          const year = earliestDate.getFullYear();
          const month = `0${earliestDate.getMonth() + 1}`.slice(-2);
          const day = `0${earliestDate.getDate()}`.slice(-2);
          setStartDate(`${year}-${month}-${day}`);
          setRateTableStartDate(`${year}-${month}-${day}`);
        } else {
          setStartDate(getTodayDate());
          setRateTableStartDate(getTodayDate());
        }
      } catch (err) {
        console.error('Error fetching shift data:', err);
        setError('Failed to load shift data.');
      } finally {
        setLoading(false);
      }
    };

    fetchShiftData();
  }, []);

  // ---------------------------
  // EMPLOYEE RATE CALCULATION
  // ---------------------------
  const calculateEmployeeRates = (useRateTableDates = false) => {
    let dataToAnalyze = filteredData;
    
    // Apply rate table specific date filters if requested
    if (useRateTableDates) {
      dataToAnalyze = shiftData.filter((shift) => {
        if (rateTableStartDate && shift.date < new Date(rateTableStartDate)) return false;
        if (rateTableEndDate && shift.date > new Date(rateTableEndDate)) return false;
        return true;
      });
    }
    
    const rateData = {};
    
    dataToAnalyze.forEach((shift) => {
      const operator = shift.operator;
      if (!operator) return;
      
      if (!rateData[operator]) {
        rateData[operator] = {};
        activitiesList.forEach(activity => {
          rateData[operator][activity] = { totalUnits: 0, totalTime: 0, rate: 0 };
        });
      }
      
      activitiesList.forEach(activity => {
        const activityData = shift.activities[activity];
        if (activityData) {
          rateData[operator][activity].totalUnits += activityData.UnitsProduced || 0;
          rateData[operator][activity].totalTime += activityData.TimeSpent || 0;
        }
      });
    });
    
    // Calculate rates
    Object.keys(rateData).forEach(operator => {
      activitiesList.forEach(activity => {
        const data = rateData[operator][activity];
        data.rate = data.totalTime > 0 ? (data.totalUnits / data.totalTime).toFixed(2) : '0.00';
      });
    });
    
    return rateData;
  };

  const calculateRateTrends = () => {
    const trendData = {};
    
    // Filter data for rate table date range
    const rateTableData = shiftData.filter((shift) => {
      if (rateTableStartDate && shift.date < new Date(rateTableStartDate)) return false;
      if (rateTableEndDate && shift.date > new Date(rateTableEndDate)) return false;
      return true;
    });
    
    // Group data by time period
    const groupedData = {};
    
    rateTableData.forEach((shift) => {
      if (!shift.date || !shift.operator) return;
      
      let periodKey;
      const shiftDate = new Date(shift.date);
      
      if (trendPeriod === 'daily') {
        periodKey = shiftDate.toISOString().split('T')[0];
      } else if (trendPeriod === 'weekly') {
        const weekStart = new Date(shiftDate);
        weekStart.setDate(shiftDate.getDate() - shiftDate.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else if (trendPeriod === 'monthly') {
        periodKey = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {};
      }
      
      const operator = shift.operator;
      if (!groupedData[periodKey][operator]) {
        groupedData[periodKey][operator] = {};
        activitiesList.forEach(activity => {
          groupedData[periodKey][operator][activity] = { totalUnits: 0, totalTime: 0 };
        });
      }
      
      activitiesList.forEach(activity => {
        const activityData = shift.activities[activity];
        if (activityData) {
          groupedData[periodKey][operator][activity].totalUnits += activityData.UnitsProduced || 0;
          groupedData[periodKey][operator][activity].totalTime += activityData.TimeSpent || 0;
        }
      });
    });
    
    // Calculate rates for each period
    Object.keys(groupedData).forEach(period => {
      trendData[period] = {};
      Object.keys(groupedData[period]).forEach(operator => {
        trendData[period][operator] = {};
        activitiesList.forEach(activity => {
          const data = groupedData[period][operator][activity];
          const rate = data.totalTime > 0 ? (data.totalUnits / data.totalTime).toFixed(2) : '0.00';
          trendData[period][operator][activity] = parseFloat(rate);
        });
      });
    });
    
    return trendData;
  };

  const renderRateTrendsChart = () => {
    const trendData = calculateRateTrends();
    const periods = Object.keys(trendData).sort();
    
    if (periods.length === 0) {
      return <Alert severity="info">No trend data available for the selected date range.</Alert>;
    }
    
    // Prepare data for each activity
    const chartData = periods.map(period => {
      const periodData = { period };
      
      // Get all operators for this period
      const operators = Object.keys(trendData[period] || {});
      
      activitiesList.forEach(activity => {
        // Calculate average rate for this activity across all operators in this period
        const rates = operators.map(op => trendData[period][op][activity]).filter(rate => rate > 0);
        const avgRate = rates.length > 0 ? (rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(2) : 0;
        periodData[activity] = parseFloat(avgRate);
      });
      
      return periodData;
    });
    
    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Performance Trends - Average Rate by {trendPeriod.charAt(0).toUpperCase() + trendPeriod.slice(1)} Period
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              interval={0}
            />
            <YAxis label={{ value: 'Units/Hour', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value} Units/Hr`} />
            <Legend />
            {activitiesList.map((activity, index) => (
              <Line 
                key={activity}
                type="monotone" 
                dataKey={activity} 
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderEmployeeRateTable = () => {
    const rateData = calculateEmployeeRates(true);
    const operators = Object.keys(rateData);
    
    if (operators.length === 0) {
      return (
        <Alert severity="info">No data available for rate calculation with current date range.</Alert>
      );
    }

    // Data validation warnings
    const validationWarnings = [];
    operators.forEach(operator => {
      const totalTime = activitiesList.reduce((sum, activity) => 
        sum + rateData[operator][activity].totalTime, 0);
      const totalUnits = activitiesList.reduce((sum, activity) => 
        sum + rateData[operator][activity].totalUnits, 0);
      
      if (totalTime > 12) {
        validationWarnings.push(`${operator}: ${totalTime.toFixed(1)} hours total (>12h - check for overlaps)`);
      }
      if (totalTime > 0 && totalUnits === 0) {
        validationWarnings.push(`${operator}: Has time logged but no units produced`);
      }
    });
    
    return (
      <Box>
        {validationWarnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Data Validation Warnings:</Typography>
            {validationWarnings.map((warning, index) => (
              <Typography key={index} variant="body2">• {warning}</Typography>
            ))}
          </Alert>
        )}
        
        <TableContainer component={Paper}>
          <Table size="small" aria-label="employee-rate-table">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Employee
                </TableCell>
                {activitiesList.map((activity) => (
                  <TableCell key={activity} align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    {activity}<br />
                    <Typography variant="caption">(Units/Hr)</Typography>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e8f5e8' }}>
                  Overall Rate<br />
                  <Typography variant="caption">(Units/Hr)</Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
                  Total Hours<br />
                  <Typography variant="caption">(All Activities)</Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#fff3e0' }}>
                  Total Units<br />
                  <Typography variant="caption">(All Activities)</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {operators.map((operator) => {
                // Calculate totals for the operator
                const totalUnits = activitiesList.reduce((sum, activity) => 
                  sum + rateData[operator][activity].totalUnits, 0);
                const totalTime = activitiesList.reduce((sum, activity) => 
                  sum + rateData[operator][activity].totalTime, 0);
                const overallRate = totalTime > 0 ? (totalUnits / totalTime).toFixed(2) : '0.00';
                
                return (
                  <TableRow key={operator} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {operator}
                    </TableCell>
                    {activitiesList.map((activity) => {
                      const rate = parseFloat(rateData[operator][activity].rate);
                      const hasData = rateData[operator][activity].totalTime > 0;
                      return (
                        <TableCell 
                          key={activity} 
                          align="center"
                          sx={{
                            backgroundColor: hasData 
                              ? rate >= 10 ? '#e8f5e8' 
                              : rate >= 5 ? '#fff3cd' 
                              : '#f8d7da'
                              : '#f8f9fa',
                            fontWeight: hasData ? 'bold' : 'normal',
                            color: hasData ? '#000' : '#6c757d'
                          }}
                          title={hasData ? `Units: ${rateData[operator][activity].totalUnits}, Time: ${rateData[operator][activity].totalTime}h` : 'No data'}
                        >
                          {hasData ? rate : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: parseFloat(overallRate) >= 10 ? '#d4edda' 
                          : parseFloat(overallRate) >= 5 ? '#fff3cd' 
                          : '#f8d7da'
                      }}
                    >
                      {overallRate}
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        backgroundColor: totalTime > 12 ? '#ffebee' : totalTime > 8 ? '#fff3e0' : '#e8f5e8',
                        fontWeight: 'bold'
                      }}
                    >
                      {totalTime.toFixed(1)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {totalUnits}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  const prepareDailyProductionAndScrap = () => {
    const dateMap = {};
    filteredData.forEach((shift) => {
      const date = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      if (!dateMap[date]) {
        dateMap[date] = { unitsProduced: 0, scrap: 0 };
      }
      Object.entries(shift.activities).forEach(([activity, a]) => {
        if (selectedDailyActivities.includes(activity)) {
          dateMap[date].unitsProduced += a.UnitsProduced || 0;
          dateMap[date].scrap += a.Scrap || 0;
        }
      });
    });
    const data = Object.keys(dateMap).map((date) => ({
      date,
      unitsProduced: dateMap[date].unitsProduced,
      scrap: dateMap[date].scrap,
    }));
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    return data;
  };

  const prepareProductivityOverTime = () => {
    const dateMap = {};
    filteredData.forEach((shift) => {
      const date = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      if (!dateMap[date]) {
        dateMap[date] = { totalUnits: 0, totalHours: 0 };
      }
      Object.values(shift.activities).forEach((a) => {
        dateMap[date].totalUnits += a.UnitsProduced || 0;
        dateMap[date].totalHours += a.TimeSpent || 0;
      });
    });
    const data = Object.keys(dateMap).map((date) => ({
      date,
      unitsPerHour:
        dateMap[date].totalHours > 0
          ? parseFloat((dateMap[date].totalUnits / dateMap[date].totalHours).toFixed(2))
          : 0,
    }));
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    return data;
  };

  const prepareUnitsPerHourPerOperator = () => {
    const operatorMap = {};
    filteredData.forEach((shift) => {
      const op = shift.operator;
      if (!operatorMap[op]) {
        operatorMap[op] = { totalUnits: 0, totalHours: 0 };
      }
      Object.values(shift.activities).forEach((a) => {
        operatorMap[op].totalUnits += a.UnitsProduced || 0;
        operatorMap[op].totalHours += a.TimeSpent || 0;
      });
    });
    return Object.keys(operatorMap).map((op) => ({
      operator: op,
      unitsPerHour:
        operatorMap[op].totalHours > 0
          ? parseFloat((operatorMap[op].totalUnits / operatorMap[op].totalHours).toFixed(2))
          : 0,
    }));
  };

  const prepareUnitsPerSKU = () => {
    const skuMap = {};
    filteredData.forEach((shift) => {
      Object.entries(shift.activities).forEach(([_, a]) => {
        if (a.sku && a.sku !== '-') {
          a.sku.split(', ').forEach((sku) => {
            if (!skuMap[sku]) skuMap[sku] = 0;
            skuMap[sku] += a.UnitsProduced || 0;
          });
        }
      });
    });
    return Object.keys(skuMap).map((sku) => ({
      sku,
      units: skuMap[sku],
    }));
  };

  const prepareTimePerActivity = () => {
    const activityMap = {};
    filteredData.forEach((shift) => {
      Object.entries(shift.activities).forEach(([act, a]) => {
        if (!activityMap[act]) {
          activityMap[act] = 0;
        }
        activityMap[act] += a.TimeSpent || 0;
      });
    });
    return Object.keys(activityMap).map((act) => ({
      activity: act,
      totalTime: activityMap[act],
    }));
  };

  const prepareTotalScrapPerOperator = () => {
    const operatorMap = {};
    filteredData.forEach((shift) => {
      const op = shift.operator;
      if (!operatorMap[op]) {
        operatorMap[op] = 0;
      }
      Object.values(shift.activities).forEach((a) => {
        operatorMap[op] += a.Scrap || 0;
      });
    });
    return [
      {
        name: 'Total Scrap',
        ...operatorMap,
      },
    ];
  };

  const prepareScrapPerActivityLimitedFunction = (topN) => {
    const scrapMap = {};
    filteredData.forEach((shift) => {
      Object.entries(shift.activities).forEach(([activity, a]) => {
        if (!scrapMap[activity]) {
          scrapMap[activity] = 0;
        }
        scrapMap[activity] += a.Scrap || 0;
      });
    });
    let scrapArray = Object.keys(scrapMap).map((activity) => ({
      activity,
      totalScrap: scrapMap[activity],
    }));
    scrapArray.sort((a, b) => b.totalScrap - a.totalScrap);
    const topScrap = scrapArray.slice(0, topN);
    const othersScrap = scrapArray.slice(topN).reduce((acc, curr) => acc + curr.totalScrap, 0);
    if (scrapArray.length > topN) {
      topScrap.push({ activity: 'Others', totalScrap: othersScrap });
    }
    return topScrap;
  };

  const prepareScrapPerActivityLimited = () => {
    return prepareScrapPerActivityLimitedFunction(5);
  };

  const prepareScrapPercentageOverTime = () => {
    const dateMap = {};
    filteredData.forEach((shift) => {
      const date = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      if (!dateMap[date]) {
        dateMap[date] = { totalScrap: 0, totalUnits: 0 };
      }
      Object.values(shift.activities).forEach((a) => {
        dateMap[date].totalScrap += a.Scrap || 0;
        dateMap[date].totalUnits += a.UnitsProduced || 0;
      });
    });
    const data = Object.keys(dateMap).map((date) => ({
      date,
      scrapPercentage:
        dateMap[date].totalUnits > 0
          ? parseFloat(((dateMap[date].totalScrap / dateMap[date].totalUnits) * 100).toFixed(2))
          : 0,
    }));
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    return data;
  };

  const computeOverallScrapPercentage = () => {
    const totalScrap = filteredData.reduce((acc, shift) => {
      return acc + Object.values(shift.activities).reduce((sum, a) => sum + (a.Scrap || 0), 0);
    }, 0);
    const totalUnits = filteredData.reduce((acc, shift) => {
      return acc + Object.values(shift.activities).reduce((sum, a) => sum + (a.UnitsProduced || 0), 0);
    }, 0);
    return totalUnits > 0 ? ((totalScrap / totalUnits) * 100).toFixed(2) : '0.00';
  };

  // ---------------------------
  // REPORT PREPARATION FUNCTIONS
  // ---------------------------
  const prepareMonthlyReport = () => {
    const monthlyData = shiftData.filter((shift) => {
      if (!shift.date) return false;
      const shiftMonth = shift.date.toISOString().slice(0, 7);
      return shiftMonth === selectedMonth;
    });
    const totalUnits = monthlyData.reduce((acc, shift) => {
      const shiftUnits = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.UnitsProduced || 0),
        0
      );
      return acc + shiftUnits;
    }, 0);
    const totalScrap = monthlyData.reduce((acc, shift) => {
      const shiftScrap = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.Scrap || 0),
        0
      );
      return acc + shiftScrap;
    }, 0);
    const scrapPercentage = totalUnits > 0 ? ((totalScrap / totalUnits) * 100).toFixed(2) : '0.00';
    const dailyReport = {};
    monthlyData.forEach((shift) => {
      const dateStr = shift.date.toISOString().split('T')[0];
      if (!dailyReport[dateStr]) {
        dailyReport[dateStr] = { units: 0, scrap: 0, skus: new Set(), operators: new Set() };
      }
      const shiftUnits = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.UnitsProduced || 0),
        0
      );
      const shiftScrap = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.Scrap || 0),
        0
      );
      dailyReport[dateStr].units += shiftUnits;
      dailyReport[dateStr].scrap += shiftScrap;
      activitiesList.forEach((activity) => {
        const act = shift.activities[activity];
        if (act && act.sku && act.sku !== '-') {
          act.sku.split(', ').forEach((s) => dailyReport[dateStr].skus.add(s));
        }
      });
      if (shift.operator) {
        dailyReport[dateStr].operators.add(shift.operator);
      }
    });
    const dailyReportArray = Object.keys(dailyReport).map((date) => ({
      date,
      units: dailyReport[date].units,
      scrap: dailyReport[date].scrap,
      scrapPercentage:
        dailyReport[date].units > 0
          ? ((dailyReport[date].scrap / dailyReport[date].units) * 100).toFixed(2)
          : '0.00',
      skus: Array.from(dailyReport[date].skus).join(', ') || '-',
      operators: Array.from(dailyReport[date].operators).join(', ') || '-',
    }));
    dailyReportArray.sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      totalUnits,
      totalScrap,
      scrapPercentage,
      dailyReport: dailyReportArray,
      monthlyData,
    };
  };

  const prepareInvoiceReport = () => {
    const invoiceData = shiftData.filter((shift) => {
      let foundInvoice = false;
      Object.values(shift.activities).forEach((activityData) => {
        if (
          activityData.InvoiceNumber &&
          String(activityData.InvoiceNumber) === selectedInvoice
        ) {
          foundInvoice = true;
        }
      });
      return foundInvoice;
    });
    const totalUnits = invoiceData.reduce((acc, shift) => {
      const shiftUnits = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.UnitsProduced || 0),
        0
      );
      return acc + shiftUnits;
    }, 0);
    const totalScrap = invoiceData.reduce((acc, shift) => {
      const shiftScrap = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.Scrap || 0),
        0
      );
      return acc + shiftScrap;
    }, 0);
    const scrapPercentage = totalUnits > 0 ? ((totalScrap / totalUnits) * 100).toFixed(2) : '0.00';
    const dailyReport = {};
    invoiceData.forEach((shift) => {
      const dateStr = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      if (!dailyReport[dateStr]) {
        dailyReport[dateStr] = { units: 0, scrap: 0, skus: new Set(), operators: new Set() };
      }
      const shiftUnits = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.UnitsProduced || 0),
        0
      );
      const shiftScrap = Object.values(shift.activities).reduce(
        (sum, a) => sum + (a.Scrap || 0),
        0
      );
      dailyReport[dateStr].units += shiftUnits;
      dailyReport[dateStr].scrap += shiftScrap;
      activitiesList.forEach((activity) => {
        const act = shift.activities[activity];
        if (act && act.sku && act.sku !== '-') {
          act.sku.split(', ').forEach((s) => dailyReport[dateStr].skus.add(s));
        }
      });
      if (shift.operator) {
        dailyReport[dateStr].operators.add(shift.operator);
      }
    });
    const dailyReportArray = Object.keys(dailyReport).map((date) => ({
      date,
      units: dailyReport[date].units,
      scrap: dailyReport[date].scrap,
      scrapPercentage:
        dailyReport[date].units > 0
          ? ((dailyReport[date].scrap / dailyReport[date].units) * 100).toFixed(2)
          : '0.00',
      skus: Array.from(dailyReport[date].skus).join(', ') || '-',
      operators: Array.from(dailyReport[date].operators).join(', ') || '-',
    }));
    dailyReportArray.sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      totalUnits,
      totalScrap,
      scrapPercentage,
      dailyReport: dailyReportArray,
      invoiceData,
    };
  };

  // ---------------------------
  // HANDLERS FOR CSV DOWNLOAD
  // ---------------------------
  const handleDownloadCSV = () => {
    const headers = [
      'ShiftID',
      'Date',
      'Operator',
      'Shift',
      'SKU',
      ...activitiesList.flatMap((act) => [
        `${act}_UnitsProduced`,
        `${act}_TimeSpent`,
        `${act}_Scrap`,
      ]),
    ];
    const csvRows = [];
    csvRows.push(headers.join(','));
    filteredData.forEach((shift) => {
      const shiftId = shift.id;
      const dateVal = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      const operatorVal = shift.operator || '';
      const shiftVal = shift.shift || '';
      const skuSet = new Set();
      activitiesList.forEach((act) => {
        const a = shift.activities[act];
        if (a && a.sku && a.sku !== '-') {
          a.sku.split(', ').forEach((s) => skuSet.add(s));
        }
      });
      const skuVal = Array.from(skuSet).join(', ') || '-';
      const activityFields = activitiesList.flatMap((act) => {
        const a = shift.activities[act] || {};
        return [a.UnitsProduced || 0, a.TimeSpent || 0, a.Scrap || 0];
      });
      const row = [shiftId, dateVal, operatorVal, shiftVal, skuVal, ...activityFields];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift_data_${startDate || 'all'}_to_${endDate || 'today'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllShiftData = () => {
    const headers = [
      'ShiftID',
      'Date',
      'Operator',
      'Shift',
      'Activity',
      'UnitsProduced',
      'TimeSpent',
      'Scrap',
      'SKU',
      'InvoiceNumber',
    ];
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    shiftData.forEach((shift) => {
      const shiftId = shift.id;
      const dateVal = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      const operatorVal = shift.operator || '';
      const shiftVal = shift.shift || '';
      
      activitiesList.forEach((activity) => {
        const activityData = shift.activities[activity];
        if (activityData && (activityData.UnitsProduced > 0 || activityData.TimeSpent > 0)) {
          const row = [
            shiftId,
            dateVal,
            operatorVal,
            shiftVal,
            activity,
            activityData.UnitsProduced || 0,
            activityData.TimeSpent || 0,
            activityData.Scrap || 0,
            activityData.sku || '-',
            activityData.InvoiceNumber || '-'
          ];
          csvRows.push(row.join(','));
        }
      });
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_shift_data_detailed_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEmployeeRates = () => {
    const rateData = calculateEmployeeRates(true);
    const operators = Object.keys(rateData);
    
    if (operators.length === 0) {
      alert('No employee rate data available for the selected date range.');
      return;
    }
    
    const headers = [
      'Employee',
      ...activitiesList.map(act => `${act}_Rate`),
      ...activitiesList.map(act => `${act}_TotalUnits`),
      ...activitiesList.map(act => `${act}_TotalHours`),
      'Overall_Rate',
      'Total_Units_All_Activities',
      'Total_Hours_All_Activities'
    ];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    operators.forEach((operator) => {
      const totalUnits = activitiesList.reduce((sum, activity) => 
        sum + rateData[operator][activity].totalUnits, 0);
      const totalTime = activitiesList.reduce((sum, activity) => 
        sum + rateData[operator][activity].totalTime, 0);
      const overallRate = totalTime > 0 ? (totalUnits / totalTime).toFixed(2) : '0.00';
      
      const row = [
        operator,
        ...activitiesList.map(act => rateData[operator][act].rate),
        ...activitiesList.map(act => rateData[operator][act].totalUnits),
        ...activitiesList.map(act => rateData[operator][act].totalTime),
        overallRate,
        totalUnits,
        totalTime.toFixed(2)
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee_rates_${rateTableStartDate || 'start'}_to_${rateTableEndDate || 'end'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMonthlyCSV = () => {
    const monthlyShifts = shiftData.filter((shift) => {
      if (!shift.date) return false;
      return shift.date.toISOString().slice(0, 7) === selectedMonth;
    });
    const headers = [
      'ShiftID',
      'Date',
      'Operator',
      'Shift',
      'SKU',
      ...activitiesList.flatMap((act) => [
        `${act}_UnitsProduced`,
        `${act}_TimeSpent`,
        `${act}_Scrap`,
      ]),
    ];
    const csvRows = [];
    csvRows.push(headers.join(','));
    monthlyShifts.forEach((shift) => {
      const shiftId = shift.id;
      const dateVal = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      const operatorVal = shift.operator || '';
      const shiftVal = shift.shift || '';
      const skuSet = new Set();
      activitiesList.forEach((act) => {
        const a = shift.activities[act];
        if (a && a.sku && a.sku !== '-') {
          a.sku.split(', ').forEach((s) => skuSet.add(s));
        }
      });
      const skuVal = Array.from(skuSet).join(', ') || '-';
      const activityFields = activitiesList.flatMap((act) => {
        const a = shift.activities[act] || {};
        return [a.UnitsProduced || 0, a.TimeSpent || 0, a.Scrap || 0];
      });
      const row = [shiftId, dateVal, operatorVal, shiftVal, skuVal, ...activityFields];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly_report_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadInvoiceCSV = () => {
    if (!invoiceReport) return;
    const headers = [
      'ShiftID',
      'Date',
      'Operator',
      'Shift',
      'SKU',
      ...activitiesList.flatMap((act) => [
        `${act}_UnitsProduced`,
        `${act}_TimeSpent`,
        `${act}_Scrap`,
      ]),
    ];
    const csvRows = [];
    csvRows.push(headers.join(','));
    invoiceReport.invoiceData.forEach((shift) => {
      const shiftId = shift.id;
      const dateVal = shift.date ? shift.date.toISOString().split('T')[0] : 'Unknown';
      const operatorVal = shift.operator || '';
      const shiftVal = shift.shift || '';
      const skuSet = new Set();
      activitiesList.forEach((act) => {
        const a = shift.activities[act];
        if (a && a.sku && a.sku !== '-') {
          a.sku.split(', ').forEach((s) => skuSet.add(s));
        }
      });
      const skuVal = Array.from(skuSet).join(', ') || '-';
      const activityFields = activitiesList.flatMap((act) => {
        const a = shift.activities[act] || {};
        return [a.UnitsProduced || 0, a.TimeSpent || 0, a.Scrap || 0];
      });
      const row = [shiftId, dateVal, operatorVal, shiftVal, skuVal, ...activityFields];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_report_${selectedInvoice}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------
  // HANDLER FOR GENERATING INVOICE REPORT
  // ---------------------------
  const handleGenerateInvoiceReport = () => {
    if (selectedInvoice === '') {
      alert('Please select an invoice to generate the report.');
      return;
    }
    const report = prepareInvoiceReport();
    setInvoiceReport(report);
    setOpenInvoiceReportDialog(true);
  };

  // ---------------------------
  // FILTERED DATA
  // ---------------------------
  const filteredData = useMemo(() => {
    return shiftData.filter((shift) => {
      if (selectedOperator && shift.operator !== selectedOperator) return false;
      if (selectedShift && shift.shift !== selectedShift) return false;
      if (
        selectedActivities.length > 0 &&
        !selectedActivities.some((activity) => shift.activities[activity]?.UnitsProduced > 0)
      ) {
        return false;
      }
      if (selectedSKUs.length > 0) {
        const shiftSKUs = Object.values(shift.activities).map((act) => act.sku);
        const flatSKUs = shiftSKUs
          .map((sku) => sku.split(', '))
          .flat()
          .filter((sku) => sku !== '-' && sku !== null);
        const hasSKU = selectedSKUs.some((sku) => flatSKUs.includes(sku));
        if (!hasSKU) return false;
      }
      if (selectedInvoice !== '') {
        let foundInvoice = false;
        Object.values(shift.activities).forEach((activityData) => {
          if (
            activityData.InvoiceNumber &&
            String(activityData.InvoiceNumber) === selectedInvoice
          ) {
            foundInvoice = true;
          }
        });
        if (!foundInvoice) return false;
      }
      if (startDate && shift.date < new Date(startDate)) return false;
      if (endDate && shift.date > new Date(endDate)) return false;
      if (minScrap) {
        const totalShiftScrap = Object.values(shift.activities).reduce(
          (sum, a) => sum + (a.Scrap || 0),
          0
        );
        if (totalShiftScrap < parseFloat(minScrap)) return false;
      }
      return true;
    });
  }, [
    shiftData,
    selectedOperator,
    selectedShift,
    selectedActivities,
    selectedSKUs,
    selectedInvoice,
    startDate,
    endDate,
    minScrap,
  ]);

  // ---------------------------
  // OPERATOR COLORS
  // ---------------------------
  const operatorColors = useMemo(() => {
    const operators = Array.from(new Set(shiftData.map((s) => s.operator)));
    const colorMap = {};
    operators.forEach((op, idx) => {
      colorMap[op] = COLORS[idx % COLORS.length];
    });
    return colorMap;
  }, [shiftData]);

  // ---------------------------
  // MONTHLY GRID ROWS (for drill-down)
  // ---------------------------
  const monthlyGridRows = useMemo(() => {
    const monthlyShifts = shiftData.filter((shift) => {
      if (!shift.date) return false;
      return shift.date.toISOString().slice(0, 7) === selectedMonth;
    });
    return monthlyShifts.map((shift) => ({
      id: shift.id,
      date: formatDate(shift.date),
      operator: shift.operator || '-',
      shift: shift.shift || '-',
    }));
  }, [shiftData, selectedMonth]);

  // ---------------------------
  // TABLE DIALOG: Shift Data Table Renderer
  // ---------------------------
  const renderShiftTableRow = (shift) => {
    const skuSet = new Set();
    activitiesList.forEach((act) => {
      const a = shift.activities[act];
      if (a && a.sku && a.sku !== '-') {
        a.sku.split(', ').forEach((s) => skuSet.add(s));
      }
    });
    const aggregatedSKU = Array.from(skuSet).join(', ') || '-';
    return (
      <TableRow key={shift.id}>
        <TableCell align="center">{formatDate(shift.date)}</TableCell>
        <TableCell align="center">{shift.operator || '-'}</TableCell>
        <TableCell align="center">{shift.shift || '-'}</TableCell>
        <TableCell align="center">{aggregatedSKU}</TableCell>
        {activitiesList.map((act) => {
          const a = shift.activities[act] || {};
          return (
            <React.Fragment key={act}>
              <TableCell align="right">{a.UnitsProduced ?? 0}</TableCell>
              <TableCell align="right">{a.TimeSpent ?? 0}</TableCell>
              <TableCell align="right">{a.Scrap ?? 0}</TableCell>
            </React.Fragment>
          );
        })}
      </TableRow>
    );
  };

  // ---------------------------
  // RENDER REPORT CONTROLS SECTIONS
  // ---------------------------
  const renderMonthlyReportSection = () => {
    return (
      <Box component={Paper} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Monthly Report Controls
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="Select Month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={8} md={9} display="flex" gap={2}>
            <Button variant="contained" onClick={() => setOpenMonthlyReportDialog(true)}>
              Generate Monthly Report
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderInvoiceReportSection = () => {
    return (
      <Box component={Paper} sx={{ p: 3, mb: 4, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h6" gutterBottom>
          Invoice Report Controls
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" fullWidth onClick={handleGenerateInvoiceReport}>
              Generate Invoice Report
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ---------------------------
  // RENDER FULL-SCREEN CHART DIALOG CONTENT
  // ---------------------------
  const renderChartDialogContent = () => {
    if (selectedChart === 'DailyProductionAndScrap') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={prepareDailyProductionAndScrap()}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="unitsProduced" fill="#4E79A7" name="Units Produced" />
            <Bar dataKey="scrap" fill="#E15759" name="Scrap" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'ProductivityOverTime') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={prepareProductivityOverTime()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `${value} Units/Hr`} />
            <Legend />
            <Line type="monotone" dataKey="unitsPerHour" stroke="#F28E2B" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'UnitsPerHourPerOperator') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={prepareUnitsPerHourPerOperator()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
            barGap={5}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="operator" />
            <YAxis />
            <Tooltip formatter={(value) => `${value} Units/Hr`} />
            <Legend />
            <Bar dataKey="unitsPerHour" fill="#76B7B2" barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'UnitsProducedPerSKU') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={prepareUnitsPerSKU()}
              dataKey="units"
              nameKey="sku"
              cx="50%"
              cy="50%"
              outerRadius={200}
              fill="#EDC948"
              label={({ sku, percent }) => `${sku}: ${(percent * 100).toFixed(0)}%`}
            >
              {prepareUnitsPerSKU().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'TotalTimePerActivity') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={prepareTimePerActivity()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="activity" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalTime" fill="#59A14F" name="Total Time (hrs)" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'TotalScrapPerOperator') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={prepareTotalScrapPerOperator()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value} Units`} />
            <Legend />
            {Object.keys(operatorColors).map((operator) => (
              <Bar key={`bar-scrap-${operator}`} dataKey={operator} fill={operatorColors[operator]} name={operator} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'ScrapPerActivity') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={prepareScrapPerActivityLimited()}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="activity" interval={0} angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="totalScrap"
              name="Total Scrap (Units)"
              fill={({ index, payload }) =>
                payload.activity === 'Others'
                  ? '#BAB0AC'
                  : COLORS[index % COLORS.length]
              }
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (selectedChart === 'ScrapPercentageOverTime') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={prepareScrapPercentageOverTime()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Line type="monotone" dataKey="scrapPercentage" stroke="#A569BD" strokeWidth={3} dot={{ r: 5 }} name="Scrap %" />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  // ---------------------------
  // RENDER COMPONENT
  // ---------------------------
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shift Analysis Dashboard
      </Typography>

      {/* FILTERS SECTION */}
      <Box component={Paper} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={3}>
          {/* Start Date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
            />
          </Grid>
          {/* End Date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
            />
          </Grid>
          {/* Operator Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Operator"
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            >
              <MenuItem value="">
                <em>All Operators</em>
              </MenuItem>
              {Array.from(new Set(shiftData.map((shift) => shift.operator))).map((operator) => (
                <MenuItem key={operator} value={operator}>
                  {operator}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* Shift Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Shift"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            >
              <MenuItem value="">
                <em>All Shifts</em>
              </MenuItem>
              <MenuItem value="Days">Days</MenuItem>
              <MenuItem value="Nights">Nights</MenuItem>
            </TextField>
          </Grid>
          {/* SKU Selection */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Select SKUs"
              value={selectedSKUs}
              onChange={(e) => {
                const { value } = e.target;
                setSelectedSKUs(typeof value === 'string' ? value.split(',') : value);
              }}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => selected.join(', '),
              }}
              fullWidth
              variant="outlined"
              size="small"
            >
              {Array.from(
                new Set(
                  shiftData.flatMap((shift) =>
                    Object.values(shift.activities).map((act) => act.sku)
                  )
                )
              )
                .filter((sku) => sku && sku !== '-')
                .map((sku) =>
                  sku.split(', ').map((s) => s.trim())
                )
                .flat()
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((uniqueSku) => (
                  <MenuItem key={uniqueSku} value={uniqueSku}>
                    {uniqueSku}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
          {/* Activity Selection */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Select Activities"
              value={selectedActivities}
              onChange={(e) => {
                const { value } = e.target;
                setSelectedActivities(typeof value === 'string' ? value.split(',') : value);
              }}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => selected.join(', '),
              }}
              fullWidth
              variant="outlined"
              size="small"
            >
              {activitiesList.map((activity) => (
                <MenuItem key={activity} value={activity}>
                  {activity}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* Invoice Selection */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Select Invoice"
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            >
              <MenuItem value="">
                <em>All Invoices</em>
              </MenuItem>
              {goodsinInvoices.map((doc) => (
                <MenuItem key={doc.id} value={doc.invoice}>
                  {doc.invoice}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* Minimum Scrap */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Minimum Scrap"
              type="number"
              value={minScrap}
              onChange={(e) => setMinScrap(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              inputProps={{ min: 0 }}
              helperText="Filter shifts with total Scrap >= value"
            />
          </Grid>
          {/* Daily Activities */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Select Daily Activities"
              value={selectedDailyActivities}
              onChange={(e) => {
                const { value } = e.target;
                setSelectedDailyActivities(typeof value === 'string' ? value.split(',') : value);
              }}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => selected.join(', '),
              }}
              fullWidth
              variant="outlined"
              size="small"
            >
              {['Laser1', 'Laser2'].map((activity) => (
                <MenuItem key={activity} value={activity}>
                  {activity}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* EMPLOYEE RATE TABLE */}
      <Box component={Paper} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Employee Performance Rates
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setShowRateTable(!showRateTable)}
          >
            {showRateTable ? 'Hide' : 'Show'} Rate Table
          </Button>
        </Box>
        
        {showRateTable && (
          <Box>
            {/* Rate Table Date Filters */}
            <Box component={Paper} sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }}>
              <Typography variant="subtitle1" gutterBottom>
                Rate Table Filters & Trends
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Rate Start Date"
                    type="date"
                    value={rateTableStartDate}
                    onChange={(e) => setRateTableStartDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Rate End Date"
                    type="date"
                    value={rateTableEndDate}
                    onChange={(e) => setRateTableEndDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    label="Trend Period"
                    value={trendPeriod}
                    onChange={(e) => setTrendPeriod(e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => setShowRateTrends(!showRateTrends)}
                    fullWidth
                  >
                    {showRateTrends ? 'Hide' : 'Show'} Performance Trends
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Performance rates calculated for date range: {rateTableStartDate || 'Start'} to {rateTableEndDate || 'End'}. 
              Color coding: <span style={{backgroundColor: '#e8f5e8', padding: '2px 4px'}}>Green ≥10</span>, 
              <span style={{backgroundColor: '#fff3cd', padding: '2px 4px'}}>Yellow 5-10</span>, 
              <span style={{backgroundColor: '#f8d7da', padding: '2px 4px'}}>Red &lt;5</span> units per hour.
            </Typography>
            
            {renderEmployeeRateTable()}
            
            {showRateTrends && renderRateTrendsChart()}
          </Box>
        )}
      </Box>

      {/* REPORT CONTROLS */}
      {renderMonthlyReportSection()}
      {renderInvoiceReportSection()}

      {/* BUTTONS */}
      <Box mb={2} display="flex" gap={2} flexWrap="wrap">
        <Button variant="contained" onClick={handleOpenTableDialog}>
          View All Shift Data
        </Button>
        <Button variant="outlined" onClick={handleDownloadCSV}>
          Download Filtered Data (CSV)
        </Button>
        <Button variant="outlined" color="primary" onClick={handleDownloadAllShiftData}>
          Download All Shift Data (CSV)
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleDownloadEmployeeRates}>
          Download Employee Rates (CSV)
        </Button>
      </Box>

      {/* OVERALL SCRAP PERCENTAGE */}
      <Box component={Paper} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Overall Scrap Percentage
        </Typography>
        <Grid container alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography
              variant="h4"
              color={
                computeOverallScrapPercentage() > 10
                  ? 'error'
                  : computeOverallScrapPercentage() > 5
                  ? 'warning.main'
                  : 'success.main'
              }
            >
              {computeOverallScrapPercentage()}%
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              Total Scrap Units:{' '}
              {filteredData.reduce(
                (acc, shift) =>
                  acc +
                  Object.values(shift.activities).reduce((sum, a) => sum + (a.Scrap || 0), 0),
                0
              )}
            </Typography>
            <Typography variant="body1">
              Total Units Produced:{' '}
              {filteredData.reduce(
                (acc, shift) =>
                  acc +
                  Object.values(shift.activities).reduce((sum, a) => sum + (a.UnitsProduced || 0), 0),
                0
              )}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* CHARTS SECTION */}
      <Grid container spacing={4}>
        {/* Daily Production and Scrap */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Daily Production and Scrap</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('DailyProductionAndScrap')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            {filteredData.length === 0 || prepareDailyProductionAndScrap().length === 0 ? (
              <Alert severity="info">No data available for the selected filters.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={prepareDailyProductionAndScrap()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unitsProduced" fill="#4E79A7" name="Units Produced" />
                  <Bar dataKey="scrap" fill="#E15759" name="Scrap" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Grid>
        {/* Productivity Over Time */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Productivity Over Time (Units/Hr)</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('ProductivityOverTime')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={prepareProductivityOverTime()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} Units/Hr`} />
                <Legend />
                <Line type="monotone" dataKey="unitsPerHour" stroke="#F28E2B" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        {/* Units per Hour per Operator */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Units per Hour per Operator</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('UnitsPerHourPerOperator')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareUnitsPerHourPerOperator()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="20%"
                barGap={5}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} Units/Hr`} />
                <Legend />
                <Bar dataKey="unitsPerHour" fill="#76B7B2" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        {/* Units Produced per SKU */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Units Produced per SKU</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('UnitsProducedPerSKU')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareUnitsPerSKU()}
                  dataKey="units"
                  nameKey="sku"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#EDC948"
                  label={({ sku, percent }) => `${sku}: ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareUnitsPerSKU().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        {/* Total Time per Activity */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Total Time per Activity (hrs)</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('TotalTimePerActivity')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareTimePerActivity()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalTime" fill="#59A14F" name="Total Time (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        {/* Total Scrap per Operator */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Total Scrap per Operator</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('TotalScrapPerOperator')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareTotalScrapPerOperator()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} Units`} />
                <Legend />
                {Object.keys(operatorColors).map((operator) => (
                  <Bar key={`bar-scrap-${operator}`} dataKey={operator} fill={operatorColors[operator]} name={operator} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        {/* Scrap per Activity */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Scrap per Activity</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('ScrapPerActivity')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareScrapPerActivityLimited()}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" interval={0} angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalScrap"
                  name="Total Scrap (Units)"
                  fill={({ index, payload }) =>
                    payload.activity === 'Others'
                      ? '#BAB0AC'
                      : COLORS[index % COLORS.length]
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        {/* Scrap Percentage Over Time */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Scrap Percentage Over Time</Typography>
              <IconButton aria-label="full-screen" onClick={() => handleOpenDialog('ScrapPercentageOverTime')}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={prepareScrapPercentageOverTime()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="scrapPercentage" stroke="#A569BD" strokeWidth={3} dot={{ r: 5 }} name="Scrap %" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      {/* TABLE DIALOG */}
      <Dialog open={openTableDialog} onClose={handleCloseTableDialog} fullWidth maxWidth="xl">
        <DialogTitle>
          Shift Data Table
          <IconButton
            aria-label="close"
            onClick={handleCloseTableDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {filteredData.length === 0 ? (
            <Alert severity="info">No data available for the selected filters.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small" aria-label="shift-data-table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Operator</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Shift</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                    {activitiesList.map((act) => (
                      <React.Fragment key={act}>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{`${act} Units`}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{`${act} Time (hr)`}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{`${act} Scrap`}</TableCell>
                      </React.Fragment>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>{filteredData.map(renderShiftTableRow)}</TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* MONTHLY REPORT DIALOG */}
      <Dialog open={openMonthlyReportDialog} onClose={() => setOpenMonthlyReportDialog(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          Monthly Report - {selectedMonth}
          <IconButton
            aria-label="close"
            onClick={() => setOpenMonthlyReportDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {(() => {
            const report = prepareMonthlyReport();
            return (
              <>
                <Box mb={3} display="flex" gap={2}>
                  <Button variant="contained" onClick={handleDownloadMonthlyCSV}>
                    Download Monthly CSV
                  </Button>
                </Box>
                <Box mb={3}>
                  <Typography variant="h6">Overall Summary</Typography>
                  <Typography>Total Units Produced: {report.totalUnits}</Typography>
                  <Typography>Total Scrap: {report.totalScrap}</Typography>
                  <Typography>Scrap Percentage: {report.scrapPercentage}%</Typography>
                </Box>
                <Box mb={3}>
                  <Typography variant="h6">Daily Breakdown</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Operator(s)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>SKU(s)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Units Produced</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Scrap</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Scrap %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.dailyReport.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell align="center">{day.date}</TableCell>
                            <TableCell align="center">{day.operators}</TableCell>
                            <TableCell align="center">{day.skus}</TableCell>
                            <TableCell align="center">{day.units}</TableCell>
                            <TableCell align="center">{day.scrap}</TableCell>
                            <TableCell align="center">{day.scrapPercentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* INVOICE REPORT DIALOG */}
      <Dialog open={openInvoiceReportDialog} onClose={() => setOpenInvoiceReportDialog(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          Invoice Report - {selectedInvoice}
          <IconButton
            aria-label="close"
            onClick={() => setOpenInvoiceReportDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {invoiceReport && (
            <>
              <Box mb={3} display="flex" gap={2}>
                <Button variant="contained" onClick={handleDownloadInvoiceCSV}>
                  Download Invoice CSV
                </Button>
              </Box>
              <Box mb={3}>
                <Typography variant="h6">Overall Summary</Typography>
                <Typography>Total Units Produced: {invoiceReport.totalUnits}</Typography>
                <Typography>Total Scrap: {invoiceReport.totalScrap}</Typography>
                <Typography>Scrap Percentage: {invoiceReport.scrapPercentage}%</Typography>
              </Box>
              <Box mb={3}>
                <Typography variant="h6">Daily Breakdown</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Operator(s)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>SKU(s)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Units Produced</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Scrap</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Scrap %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceReport.dailyReport.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell align="center">{day.date}</TableCell>
                          <TableCell align="center">{day.operators}</TableCell>
                          <TableCell align="center">{day.skus}</TableCell>
                          <TableCell align="center">{day.units}</TableCell>
                          <TableCell align="center">{day.scrap}</TableCell>
                          <TableCell align="center">{day.scrapPercentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MONTHLY SHIFTS DIALOG (Drill-Down) */}
      <Dialog open={openMonthlyShiftDialog} onClose={handleCloseMonthlyShiftDialog} fullWidth maxWidth="md">
        <DialogTitle>
          Shifts for {selectedMonth}
          <IconButton
            aria-label="close"
            onClick={handleCloseMonthlyShiftDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ height: 500 }}>
          {monthlyGridRows.length === 0 ? (
            <Alert severity="info">No shifts available for this month.</Alert>
          ) : (
            <DataGrid
              rows={monthlyGridRows}
              columns={[
                { field: 'date', headerName: 'Date', width: 120 },
                { field: 'operator', headerName: 'Operator', width: 120 },
                { field: 'shift', headerName: 'Shift', width: 120 },
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              onRowClick={handleRowClick}
              disableSelectionOnClick
            />
          )}
        </DialogContent>
      </Dialog>

      {/* SHIFT DETAIL DRILL-DOWN DIALOG */}
      <Dialog open={Boolean(selectedShiftDetail)} onClose={handleCloseShiftDetail} fullWidth maxWidth="md">
        <DialogTitle>
          Shift Detail - {selectedShiftDetail && formatDate(selectedShiftDetail.date)}
          <IconButton
            aria-label="close"
            onClick={handleCloseShiftDetail}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedShiftDetail && (
            <Box>
              <Typography variant="subtitle1">
                <strong>Operator:</strong> {selectedShiftDetail.operator || '-'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Shift:</strong> {selectedShiftDetail.shift || '-'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Date:</strong> {formatDate(selectedShiftDetail.date)}
              </Typography>
              <Box mt={2}>
                <Typography variant="h6">Activities Detail:</Typography>
                {activitiesList.map((act) => {
                  const a = selectedShiftDetail.activities[act] || {};
                  return (
                    <Box key={act} mb={1} p={1} border="1px solid #ccc" borderRadius="4px">
                      <Typography variant="subtitle2"><strong>{act}</strong></Typography>
                      <Typography variant="body2">
                        Units Produced: {a.UnitsProduced || 0}
                      </Typography>
                      <Typography variant="body2">
                        Time Spent (hrs): {a.TimeSpent || 0}
                      </Typography>
                      <Typography variant="body2">
                        Scrap: {a.Scrap || 0}
                      </Typography>
                      {a.sku && a.sku !== '-' && (
                        <Typography variant="body2">
                          SKU: {a.sku}
                        </Typography>
                      )}
                      {a.invoices && a.invoices.length > 0 && (
                        <Typography variant="body2">
                          Invoices: {a.invoices.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* FULL-SCREEN CHART DIALOG */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="lg">
        <DialogTitle>
          {selectedChart === 'ProductivityOverTime' && 'Productivity Over Time'}
          {selectedChart === 'DailyProductionAndScrap' && 'Daily Production and Scrap'}
          {selectedChart === 'UnitsPerHourPerOperator' && 'Units per Hour per Operator'}
          {selectedChart === 'UnitsProducedPerSKU' && 'Units Produced per SKU'}
          {selectedChart === 'TotalTimePerActivity' && 'Total Time Spent per Activity'}
          {selectedChart === 'TotalScrapPerOperator' && 'Total Scrap per Operator'}
          {selectedChart === 'ScrapPerActivity' && 'Scrap per Activity'}
          {selectedChart === 'ScrapPercentageOverTime' && 'Scrap Percentage Over Time'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderChartDialogContent()}</DialogContent>
      </Dialog>
    </Container>
  );
};

export default ShiftAnalysis;