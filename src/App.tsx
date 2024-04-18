import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import Chart from "chart.js/auto";
import { DatePicker } from "antd";

import { useQuery } from "@tanstack/react-query";
import getAlphaVantageData from "./api/getAlphaVantageData";
import getStartDateFromQuarterYear from "./utils/date";
import "chartjs-adapter-date-fns";

const { RangePicker } = DatePicker;

function App() {
  const [symbol, setSymbol] = useState("IBM");
  const [chartDateRange, setChartDateRange] = useState<{
    min: Date | string;
    max: Date | string;
  }>({
    min: "",
    max: ""
  });

  const incomeStatementQuery = useQuery({
    queryKey: ["plots", "INCOME_STATEMENT", symbol],
    queryFn: getAlphaVantageData
  });
  const balanceSheetQuery = useQuery({
    queryKey: ["plots", "BALANCE_SHEET", symbol],
    queryFn: getAlphaVantageData
  });

  const incomeStatementData = useMemo(
    () =>
      incomeStatementQuery.status === "success"
        ? incomeStatementQuery.data["quarterlyReports"]
        : [],
    [incomeStatementQuery]
  );
  const balanceSheetData = useMemo(
    () =>
      balanceSheetQuery.status === "success"
        ? balanceSheetQuery.data["quarterlyReports"]
        : [],
    [balanceSheetQuery]
  );

  const onDateRangeChange = (_: any, dateSTring: string[]) => {
    setChartDateRange({
      min: getStartDateFromQuarterYear(dateSTring[0]),
      max: getStartDateFromQuarterYear(dateSTring[1])
    });
  };

  const chartRef = useRef<any>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (
      !incomeStatementData ||
      incomeStatementData.length === 0 ||
      !balanceSheetData ||
      balanceSheetData.length === 0
    )
      return;

    let labels: string[] = [];
    let quarterlyNetIncomeData: number[] = [];
    let quarterlyTotalRevenueData: number[] = [];

    incomeStatementData.forEach(
      (incomeStatement: {
        fiscalDateEnding: string;
        netIncome: string;
        totalRevenue: string;
      }) => {
        labels.push(incomeStatement.fiscalDateEnding);
        quarterlyNetIncomeData.push(
          parseFloat(incomeStatement.netIncome || "0")
        );
        quarterlyTotalRevenueData.push(
          parseFloat(incomeStatement.totalRevenue || "0")
        );
      }
    );

    const totalShareholderEquityData = balanceSheetData.map(
      (balanceSheet: { totalShareholderEquity: string }) =>
        parseFloat(balanceSheet.totalShareholderEquity)
    );

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "line",

      data: {
        labels: labels,
        datasets: [
          {
            label: "Net Income",
            data: quarterlyNetIncomeData,
            backgroundColor: "rgb(255, 99, 132)"
          },
          {
            label: "Total Revenue",
            data: quarterlyTotalRevenueData,
            backgroundColor: "rgb(53, 162, 235)"
          },
          {
            label: "Total Shareholder Equity",
            data: totalShareholderEquityData,
            backgroundColor: "rgb(255, 205, 86)"
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                var ranges = [
                  { divider: 1e9, suffix: "B" },
                  { divider: 1e6, suffix: "M" }
                ];
                function formatNumber(n: number) {
                  var isNegative = n < 0;
                  var absValue = Math.abs(n);
                  for (var i = 0; i < ranges.length; i++) {
                    if (absValue >= ranges[i].divider) {
                      var formattedValue =
                        (absValue / ranges[i].divider).toString() +
                        ranges[i].suffix;
                      return isNegative ? "-" + formattedValue : formattedValue;
                    }
                  }
                  // If the value is less than 1 million, just return it as is
                  return n;
                }
                return formatNumber(value as number);
              }
            }
          },
          x: {
            type: "time",
            time: {
              unit: "quarter"
            },
            min: (chartDateRange.min as string) || labels[labels.length - 1],
            max: (chartDateRange.max as string) || labels[0]
          }
        }
      }
    });
  }, [incomeStatementData, balanceSheetData, chartDateRange]);

  return (
    <div className="App">
      <header>
        <p className="text-5xl underline italic mt-3 mb-10">StockChartify</p>
      </header>
      <main>
        <div className="flex gap-5 justify-around">
          <div>
            <label className="text-2xl">Symbol: </label>
            <input
              className="text-xl border border-black py-0.5 px-2 rounded-xl"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            ></input>
          </div>
          <div>
            <label className="text-2xl">Date Range: </label>
            <RangePicker picker="quarter" onChange={onDateRangeChange} />
          </div>
        </div>
        <div className="flex justify-center mt-8 w-[80%] mx-auto">
          <canvas ref={chartRef} />
        </div>
      </main>
    </div>
  );
}

export default App;
