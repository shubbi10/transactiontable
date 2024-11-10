import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/transactionDB', { useNewUrlParser: true, useUnifiedTopology: true });

const transactionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Initialize Database
app.get('/api/initialize', async (req, res) => {
  try {
    const response = await fetch('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = await response.json();
    
    await Transaction.deleteMany({});
    await Transaction.insertMany(data);
    
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// List Transactions
app.get('/api/transactions', async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;
  
  const query = {};
  if (month) {
    query.$expr = { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] };
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { price: parseFloat(search) || 0 }
    ];
  }
  
  try {
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      totalPages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Statistics
app.get('/api/statistics', async (req, res) => {
  const { month } = req.query;
  
  try {
    const stats = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] }
        }
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: { $cond: [{ $eq: ['$sold', true] }, '$price', 0] } },
          totalSoldItems: { $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] } }
        }
      }
    ]);
    
    res.json(stats[0] || { totalSaleAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Bar Chart
app.get('/api/bar-chart', async (req, res) => {
  const { month } = req.query;
  
  try {
    const barChartData = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] }
        }
      },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901],
          default: '901-above',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    const result = [
      { range: '0 - 100', count: 0 },
      { range: '101 - 200', count: 0 },
      { range: '201 - 300', count: 0 },
      { range: '301 - 400', count: 0 },
      { range: '401 - 500', count: 0 },
      { range: '501 - 600', count: 0 },
      { range: '601 - 700', count: 0 },
      { range: '701 - 800', count: 0 },
      { range: '801 - 900', count: 0 },
      { range: '901 - above', count: 0 }
    ];

    barChartData.forEach((item, index) => {
      if (index < result.length) {
        result[index].count = item.count;
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bar chart data' });
  }
});

// Pie Chart
app.get('/api/pie-chart', async (req, res) => {
  const { month } = req.query;
  
  try {
    const pieChartData = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(pieChartData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pie chart data' });
  }
});

// Combined Data
app.get('/api/combined-data', async (req, res) => {
  const { month } = req.query;
  
  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      fetch(`http://localhost:${port}/api/transactions?month=${month}`).then(res => res.json()),
      fetch(`http://localhost:${port}/api/statistics?month=${month}`).then(res => res.json()),
      fetch(`http://localhost:${port}/api/bar-chart?month=${month}`).then(res => res.json()),
      fetch(`http://localhost:${port}/api/pie-chart?month=${month}`).then(res => res.json())
    ]);
    
    res.json({
      transactions,
      statistics,
      barChart,
      pieChart
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combined data' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});