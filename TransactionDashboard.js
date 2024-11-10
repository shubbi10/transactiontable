import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const SearchBar = ({ onSearch }) => (
  <input
    type="text"
    placeholder="Search transaction"
    className="px-4 py-2 rounded-full bg-amber-100 border-none outline-none w-48"
    onChange={(e) => onSearch(e.target.value)}
  />
);

const MonthSelect = ({ onSelect, selectedMonth }) => (
  <div className="relative">
    <select 
      value={selectedMonth}
      onChange={(e) => onSelect(e.target.value)}
      className="px-4 py-2 rounded-full bg-amber-100 appearance-none pr-8"
    >
      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
        <option key={month} value={index + 1}>{month}</option>
      ))}
    </select>
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <ChevronDown />
    </div>
  </div>
);

const TransactionTable = ({ data }) => (
  <div className="w-full overflow-x-auto bg-amber-100 rounded-lg">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-amber-200">
          <th className="p-3 text-left">ID</th>
          <th className="p-3 text-left">Title</th>
          <th className="p-3 text-left">Description</th>
          <th className="p-3 text-left">Price</th>
          <th className="p-3 text-left">Category</th>
          <th className="p-3 text-left">Sold</th>
          <th className="p-3 text-left">Image</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id} className="border-b border-amber-200">
            <td className="p-3">{item.id}</td>
            <td className="p-3">{item.title}</td>
            <td className="p-3">{item.description}</td>
            <td className="p-3">${item.price}</td>
            <td className="p-3">{item.category}</td>
            <td className="p-3">{item.sold ? 'Yes' : 'No'}</td>
            <td className="p-3">
              <img src={item.image} alt={item.title} className="w-10 h-10 object-cover" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-between items-center mt-4">
    <span>Page No: {currentPage}</span>
    <div className="space-x-2">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
      >
        Previous
      </button>
      <span>-</span>
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
      >
        Next
      </button>
    </div>
    <span>Per Page: 10</span>
  </div>
);

const StatisticsBox = ({ statistics }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-6">
    <h2 className="text-xl font-bold mb-4">Transaction Statistics</h2>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="font-semibold">Total Sale Amount</p>
        <p>${statistics.totalSaleAmount.toFixed(2)}</p>
      </div>
      <div>
        <p className="font-semibold">Total Sold Items</p>
        <p>{statistics.totalSoldItems}</p>
      </div>
      <div>
        <p className="font-semibold">Total Not Sold Items</p>
        <p>{statistics.totalNotSoldItems}</p>
      </div>
    </div>
  </div>
);

const BarChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.range),
    datasets: [
      {
        label: 'Number of Items',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Price Range Distribution',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

const TransactionDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(3); // Default as March
  const [statistics, setStatistics] = useState({ totalSaleAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 });
  const [barChartData, setBarChartData] = useState([]);

  const fetchTransactions = useCallback(async (page) => {
    try {
      const response = await fetch(`http://localhost:3001/api/transactions?page=${page}&perPage=10&search=${searchQuery}&month=${selectedMonth}`);
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [searchQuery, selectedMonth]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/statistics?month=${selectedMonth}`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }, [selectedMonth]);

  const fetchBarChartData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/bar-chart?month=${selectedMonth}`);
      const data = await response.json();
      setBarChartData(data);
    } catch (error) {
      console.error('Failed to fetch bar chart data:', error);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchTransactions(currentPage);
    fetchStatistics();
    fetchBarChartData();
  }, [fetchTransactions, fetchStatistics, fetchBarChartData, currentPage]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchTransactions(1);
  };

  const handlePageChange = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages) {
    setCurrentPage(newPage); // Updating the current page state
  }
};


  const handleMonthSelect = (month) => {
    setSelectedMonth(Number(month));
    fetchTransactions(1);
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Transaction Dashboard</h1>
        </div>
        
        <div className="flex justify-between mb-6">
          <SearchBar onSearch={handleSearch} />
          <MonthSelect onSelect={handleMonthSelect} selectedMonth={selectedMonth} />
        </div>

        <StatisticsBox statistics={statistics} />

        <TransactionTable data={transactions} />
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Price Range Distribution</h2>
          <BarChart data={barChartData} />
        </div>
      </div>
    </div>
  );
};

export default TransactionDashboard;