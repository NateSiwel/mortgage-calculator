'use client'
import React, { use, useEffect, useRef, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption
} from 'echarts/components';
import { PieChart, PieSeriesOption } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  TitleComponent,
  ToolboxComponent,
  
  GridComponent,
  
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';


echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition

]);

import { Button } from "@/components/ui/button"
import { EChartsOption } from 'echarts';

const MortgageCalculator = () => {
  const [homePrice, setHomePrice] = useState(425000);
  const [downPayment, setDownPayment] = useState(85000);
  const [downPaymentPercentage, setDownPaymentPercentage] = useState(20);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState('6.94' || 0);
  const [monthlyLoanPayment, setMonthlyLoanPayment] = useState('');
  const [propertyTax, setPropertyTax] = useState(280);
  const [homeownersInsurance, setHomeownersInsurance] = useState(70);
  const [hoa, setHoa] = useState(0);

  const [amortizationSchedule, setAmortizationSchedule] = useState<{
    month: string;
    monthlyLoanPayment: string;
    principalPayment: string;
    interestPayment: string;
    remainingBalance: string;
  }[]>([]);
  const [loanSummary, setLoanSummary] = useState({interestPaid: '', loanAmount: '', costOfLoan: '', payoffDate: ''});
  const [interestChart, setInterestChart] = useState<echarts.ECharts | null>(null);
  const interestChartRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState("breakdown");



  const calculateMortgage = () => {
    const principal = homePrice - downPayment;
    const monthlyInterestRate = Number(interestRate) / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    let monthlyLoanPayment;
    if (Number(interestRate) === 0) {
      monthlyLoanPayment = principal / numberOfPayments;
    } else {
      monthlyLoanPayment = principal *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    }

    setMonthlyLoanPayment(monthlyLoanPayment.toFixed(2));
    calculateAmortization(principal, monthlyInterestRate, numberOfPayments, monthlyLoanPayment);
  };

  const calculateAmortization = (principal: number, monthlyInterestRate: number, numberOfPayments: number , monthlyLoanPayment: number) => {
    let schedule: {
      month: string;
      monthlyLoanPayment: string;
      principalPayment: string;
      interestPayment: string;
      remainingBalance: string;
    }[] = [];
    let remainingBalance = principal;
    let totalInterestPaid = 0;

    for (let i = 0; i < numberOfPayments; i++) {
      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = monthlyLoanPayment - interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        month: String(i + 1),
        monthlyLoanPayment: monthlyLoanPayment.toFixed(2),
        principalPayment: principalPayment.toFixed(2),
        interestPayment: interestPayment.toFixed(2),
        remainingBalance: remainingBalance.toFixed(2),
      });
      totalInterestPaid += interestPayment;
    }

    let loanAmount = principal.toFixed(2);
    let interestPaid = totalInterestPaid.toFixed(2);
    let costOfLoan = (parseFloat(String(principal)) + totalInterestPaid).toFixed(2);

    setAmortizationSchedule(schedule);
    let payoffDate = new Date(new Date().setMonth(new Date().getMonth() + numberOfPayments)).toLocaleDateString();
    setLoanSummary({ loanAmount, interestPaid, costOfLoan, payoffDate });
  };

  const [amortizationChart, setAmortizationChart] = useState<echarts.ECharts | null>(null);
  const amortizationChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab == 'breakdown' && interestChartRef.current) {
      if (!interestChart) {
        const newChart = echarts.init(interestChartRef.current);
        setInterestChart(newChart);
      }
    } else {
      setInterestChart(null);
    }
    calculateMortgage();
    if (activeTab == 'amortization' && amortizationChartRef.current) {
      if (!amortizationChart) {
        const newChart = echarts.init(amortizationChartRef.current, null, {
          renderer: 'canvas',
          useDirtyRect: false
        });
        setAmortizationChart(newChart);
      }
    } else {
      setAmortizationChart(null);
    }
    
  }, [activeTab]);

  useEffect(() => {
    if (interestChart && amortizationSchedule.length > 0) {
      interestChart.setOption({
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: ['50%', '90%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            labelLine: {
              show: false
            },
            data: [
              { value: monthlyLoanPayment, name: 'Principal & Interest' },
              { value: propertyTax, name: 'Property Tax' },
              { value: homeownersInsurance, name: 'Homeowners insurance' },
              { value: hoa, name: 'HOA' }
            ]
          }
        ]
      });
    }
    if (amortizationChart && amortizationSchedule.length > 0) {

      const xAxisData = yearlyAmortizationSchedule.map((item, index) => `${index + 1}`);

      let cumulativePrincipal = 0;
      let cumulativeInterest = 0;
      const principalData = yearlyAmortizationSchedule.map(item => {
        cumulativePrincipal += item.principalPayment;
        return parseFloat(cumulativePrincipal.toFixed(2)); // Apply toFixed here
      });

      const interestData = yearlyAmortizationSchedule.map(item => {
        cumulativeInterest += item.interestPayment;
        return parseFloat(cumulativeInterest.toFixed(2)); // Apply toFixed here
      });

      const balanceData = yearlyAmortizationSchedule.map(item => parseFloat(Number(item.remainingBalance).toFixed(2)));

      var breakdownChartOptions = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Principal Paid', 'Interest Paid', 'Remaining Balance']
        },
        xAxis: {
          type: 'category',
          name: 'Year',
          data: xAxisData
        },
        yAxis: {
          type: 'value',
          name: 'Amount'
        },
        grid: {
          containLabel: true,
        },
        series: [
          {
            name: 'Remaining Balance',
            type: 'line',
            data: balanceData
          },  
          {
            name: 'Principal Paid',
            type: 'line',
            data: principalData
          },
          {
            name: 'Interest Paid',
            type: 'line',
            data: interestData
          }
        ]
      };
      amortizationChart.setOption(breakdownChartOptions);
    }
  }, [amortizationSchedule, interestChart, amortizationChart, downPayment, homePrice, loanTerm, interestRate, propertyTax, homeownersInsurance, hoa]);

  useEffect(() => {
    calculateMortgage();
  },[homePrice, downPayment, loanTerm, interestRate])

  const aggregateByYear = (schedule : {
    month: string,
    monthlyLoanPayment: string,
    principalPayment: string,
    interestPayment: string,
    remainingBalance: string}[]
  
) => {
    const yearlySchedule = [];
    for (let i = 0; i < schedule.length; i += 12) {
      const yearData = schedule.slice(i, i + 12);
      const yearlySummary = yearData.reduce((acc, curr) => ({
        month: `Year ${(i / 12) + 1}`,
        monthlyLoanPayment: acc.monthlyLoanPayment + Number(curr.monthlyLoanPayment),
        principalPayment: acc.principalPayment + Number(curr.principalPayment),
        interestPayment: acc.interestPayment + Number(curr.interestPayment),
        remainingBalance: Number(curr.remainingBalance) // taking the last month's remaining balance
      }), {
        month: `Year ${(i / 12) + 1}`,
        monthlyLoanPayment: 0,
        principalPayment: 0,
        interestPayment: 0,
        remainingBalance: 0
      });
  
      yearlySchedule.push(yearlySummary);
    }
    return yearlySchedule;
  };
  
  const yearlyAmortizationSchedule = aggregateByYear(amortizationSchedule);

  const [expandedYears, setExpandedYears] = useState(new Set([0]));

  const toggleYear = (yearIndex: number) => {
    setExpandedYears((prevExpandedYears) => {
      const newExpandedYears = new Set(prevExpandedYears);
      if (newExpandedYears.has(yearIndex)) {
        newExpandedYears.delete(yearIndex);
      } else {
        newExpandedYears.add(yearIndex);
      }
      return newExpandedYears;
    });
  };

  return (
    <div>
      <div className=' flex flex-col md:flex-row space-x-3'>
        <div className='flex flex-col '>
          <Label className='mt-2 mb-1' htmlFor="Home Price">Home Price</Label>
          <Input type="text" placeholder="Home Price" value={"$" + homePrice.toLocaleString()} onChange={(e) => {
            const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
            if (!isNaN(numericValue)) {
              setHomePrice(numericValue);
              setDownPayment((numericValue * 20 / 100));
              setDownPaymentPercentage(20);
              
            } else {
              setHomePrice(0);
              setDownPaymentPercentage(0);
              setDownPayment(0);
            }
          }} />
          <Label className='mt-2 mb-1' htmlFor="Down Payment">Down Payment</Label>
          <div className='flex'>
            <Input className='w-36' type="text" placeholder="Down Payment" value={"$" + downPayment.toLocaleString()} onChange={(e) => {
              const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
              if (!isNaN(numericValue)) {
                setDownPayment(numericValue);
                setDownPaymentPercentage(Number((numericValue / homePrice * 100).toFixed(0)));
              } else {
                setDownPayment(0);
                setDownPaymentPercentage(0);
              }
            }} />
            <div className='relative ml-1'>
              <Input className='w-20' type="text" placeholder="Down Payment" value={downPaymentPercentage.toLocaleString()} onChange={(e) => {
                const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(numericValue)) {
                  setDownPaymentPercentage(numericValue);
                  setDownPayment((homePrice * numericValue / 100));
                } else {
                  setDownPaymentPercentage(0);
                  setDownPayment(0);
                }
              }} />
              <span className='absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400'>
                  %  {/* % symbol is placed inside the input field */}
              </span>
            </div>
          </div>
          <Label className='mt-2 mb-1' htmlFor="Loan Term">Loan Term</Label>
          <Input type="text" placeholder="Loan Term" value={loanTerm.toLocaleString()} onChange={(e) => {
            const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
            if (!isNaN(numericValue)) {
              setLoanTerm(numericValue);
            } else {
              setLoanTerm(0);
            }
          }} />
          <Label className='mt-2 mb-1' htmlFor="Interest Rate">Interest Rate</Label>
          <div className='relative'>
            <Input
              className=' pl-3'
              type="number"
              value={interestRate}
              
              onChange={(e) => {
              
                setInterestRate(e.target.value);
                
              }}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
              }}
            />
            <span className='absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400'>
                  %  {/* % symbol is placed inside the input field */}
            </span>
          </div>
          <Button onClick={calculateMortgage} className='w-28 mx-auto mt-2'>Calculate</Button>
        </div>
        <div className='flex w-full flex-col mt-2 '>
          <Tabs defaultValue="breakdown" onValueChange={(value) => setActiveTab(value)}>
            <TabsList>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="amortization">Amortization</TabsTrigger>
            </TabsList>
            <TabsContent value="breakdown" className='w-[500px]'>
              <div className=' border rounded-2xl p-3 w-[500px]'>
                <h2 className='text-xl font-semibold py-1.5'>Monthly Breakdown</h2>
                <Separator className="my-2 mb-3" />
                <div className='w-full flex'>
                  <div className='p-2 mt-2 text-center'>
                    <p className='w-full text-xs'>Total Monthly Payment</p>
                    <p className='w-full text-sm font-medium'>${Number(Number(Number(propertyTax) + Number(monthlyLoanPayment) + Number(homeownersInsurance) + Number(hoa)).toFixed(2)).toLocaleString()}</p>
                    <div className='mx-auto justify-center text-left' ref={interestChartRef} style={{ width: '200px', height: '180px' }}></div>
                  </div>
                  <div className='p-2 w-full'>
                    <div className='flex w-full mb-2'>
                      <p className='text-xs my-auto text-center font-medium'>Principal & Interest</p>
                      <p className='text-md text-semibold my-auto ml-auto'>${Number(monthlyLoanPayment).toLocaleString()}</p>
                    </div>
                    <Separator className="my-1" />
                    <div className='flex w-full'>
                      <p className='text-xs my-auto text-center font-medium'>Property Tax</p>
                      <Input className='w-24 ml-auto my-1 text-right' type="text" placeholder="Property Tax" value={"$" + propertyTax.toLocaleString()} onChange={(e) => {
                        const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                        if (!isNaN(numericValue)) {
                          setPropertyTax(numericValue);
                        } else {
                          setPropertyTax(0);
                        }
                      }} />
                    </div>
                    <Separator className="my-1" />
                    <div className='flex w-full'>
                      <p className='text-xs my-auto text-center font-medium'>Homeowners insurance</p>
                      <Input className='w-24 ml-auto my-1 text-right' type="text" placeholder="Homeowners Insurance" value={"$" + homeownersInsurance.toLocaleString()} onChange={(e) => {
                        const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                        if (!isNaN(numericValue)) {
                          setHomeownersInsurance(numericValue);
                        } else {
                          setHomeownersInsurance(0);
                        }
                      }} />
                    </div>
                    <Separator className="my-1" />
                    <div className='flex w-full'>
                      <p className='text-xs my-auto text-center font-medium'>HOA</p>
                      <Input className='w-24 ml-auto my-1 text-right' type="text" placeholder="HOA Fee" value={"$" + hoa.toLocaleString()} onChange={(e) => {
                        const numericValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                        if (!isNaN(numericValue)) {
                          setHoa(numericValue);
                        } else {
                          setHoa(0);
                        }
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="amortization">
              <div className='w-full border rounded-2xl p-3'>
                <h2 className='text-xl font-semibold py-1.5'>Amortization for Mortgage Loan</h2>
                <Separator className="my-2 mb-3" />
                <div className='flex justify-items-center text-center justify-between'>
                  <div className='flex-col flex mx-2'>
                    <p className='text-xs'>Loan Amount</p>
                    <p className='text-md text-semibold'>${Number(loanSummary.loanAmount).toLocaleString()}</p>
                  </div>
                  <div className='flex-col flex mx-2'>
                    <p className='text-xs'>Total Interest Paid</p>
                    <p className='text-md text-semibold'>${Number(loanSummary.interestPaid).toLocaleString()}</p>
                  </div>
                  <div className='flex-col flex mx-2'>
                    <p className='text-xs'>Cost of Loan</p>
                    <p className='text-md text-semibold'>${Number(loanSummary.costOfLoan).toLocaleString()}</p>
                  </div>
                  <div className='flex-col flex mx-2'>
                    <p className='text-xs'>Payoff date</p>
                    <p className='text-md text-semibold'>{loanSummary.payoffDate}</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className='mx-auto justify-center content-center w-full' ref={amortizationChartRef} style={{ width: '400px', height: '300px' }}></div>
                <Separator className="my-4" />
                {amortizationSchedule.length > 0 && (
                  <div className='flex w-full'>
                    <Table>
                      <TableCaption>Amortization Schedule</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Interest</TableHead>
                          <TableHead>Remaining Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {yearlyAmortizationSchedule.map((yearItem, yearIndex) => (
                        <React.Fragment key={yearIndex}>
                          <TableRow onClick={() => toggleYear(yearIndex)} className='cursor-pointer'>
                            <TableCell className=' w-20 font-semibold'>{yearItem.month}</TableCell>
                            <TableCell>${yearItem.monthlyLoanPayment.toLocaleString()}</TableCell>
                            <TableCell>${yearItem.principalPayment.toLocaleString()}</TableCell>
                            <TableCell>${yearItem.interestPayment.toLocaleString()}</TableCell>
                            <TableCell>${Number(yearItem.remainingBalance).toLocaleString()}</TableCell>
                          </TableRow>
                          {expandedYears.has(yearIndex) && amortizationSchedule.slice(yearIndex * 12, (yearIndex + 1) * 12).map((monthItem, monthIndex) => (
                            <TableRow key={`${yearIndex}-${monthIndex}`}>
                              <TableCell className='text-xs pl-4'>{`Month ${monthIndex + 1}`}</TableCell>
                              <TableCell>${Number(monthItem.monthlyLoanPayment).toLocaleString()}</TableCell>
                              <TableCell>${Number(monthItem.principalPayment).toLocaleString()}</TableCell>
                              <TableCell>${Number(monthItem.interestPayment).toLocaleString()}</TableCell>
                              <TableCell>${Number(monthItem.remainingBalance).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default MortgageCalculator