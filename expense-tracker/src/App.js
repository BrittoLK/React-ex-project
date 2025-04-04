/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from "chart.js";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    const savedExpenses = JSON.parse(localStorage.getItem("expenses"));
    const savedIncomes = JSON.parse(localStorage.getItem("incomes"));
    if (savedExpenses) setExpenses(savedExpenses);
    if (savedIncomes) setIncomes(savedIncomes);
  }, []);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("incomes", JSON.stringify(incomes));
  }, [expenses, incomes]);

  const addExpense = () => {
    if (!amount || !category || !date) return;
    const newExpense = { id: Date.now(), amount: Number(amount), category, date };
    setExpenses([...expenses, newExpense]);
    setAmount("");
    setCategory("");
    setDate("");
  };

  const addIncome = () => {
    if (!incomeAmount || !incomeDate) return;
    const newIncome = { id: Date.now(), amount: Number(incomeAmount), date: incomeDate };
    setIncomes([...incomes, newIncome]);
    setIncomeAmount("");
    setIncomeDate("");
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const editExpense = (expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date);
  };

  const updateExpense = () => {
    setExpenses(expenses.map(exp => exp.id === editingExpense.id ? { ...editingExpense, amount: Number(amount), category, date } : exp));
    setEditingExpense(null);
    setAmount("");
    setCategory("");
    setDate("");
  };

  const getFilteredExpenses = () => {
    return expenses.filter(expense => 
      (!filterCategory || expense.category === filterCategory) &&
      (!filterDate || expense.date === filterDate)
    );
  };

  const getChartData = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ["#00ff88", "#00cc66", "#009966", "#006644", "#004433", "#002211"],
        borderWidth: 1,
      }]
    };
  };

  const totalIncome = incomes.reduce((acc, income) => acc + income.amount, 0);
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Monthly Expense Report", 14, 20);
    const rows = getFilteredExpenses().map(exp => [exp.date, exp.category, `$${exp.amount}`]);
    doc.autoTable({ head: [["Date", "Category", "Amount"]], body: rows });
    doc.save("expense_report.pdf");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getFilteredExpenses());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expense_report.xlsx");
  };

  return (
    <div className="bg-black text-green-400 min-h-screen p-6 font-sans flex justify-center items-start">
      <div className="max-w-4xl w-full bg-gray-900 shadow-2xl rounded-3xl p-10">
        <h2 className="text-4xl font-extrabold text-center text-green-400 mb-10 tracking-tight">💸 Smart Expense Tracker</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="p-4 border-2 border-green-500 bg-black text-green-400 rounded-xl w-full" />
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="p-4 border-2 border-green-500 bg-black text-green-400 rounded-xl w-full" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-4 border-2 border-green-500 bg-black text-green-400 rounded-xl w-full" />
          <button onClick={editingExpense ? updateExpense : addExpense} className="w-full bg-green-600 hover:bg-green-500 text-black p-4 rounded-xl font-bold text-lg">{editingExpense ? 'Update Expense' : 'Add Expense'}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input type="number" placeholder="Income Amount" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="p-4 border-2 border-green-300 bg-black text-green-400 rounded-xl w-full" />
          <input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} className="p-4 border-2 border-green-300 bg-black text-green-400 rounded-xl w-full" />
          <button onClick={addIncome} className="w-full bg-green-600 hover:bg-green-500 text-black p-4 rounded-xl font-bold text-lg">Add Income</button>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-2 text-green-400">💰 Income History</h4>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-sm">
            {incomes.map(inc => (
              <li key={inc.id} className="bg-black border border-green-500 p-3 rounded-xl flex justify-between items-center">
                <span className="text-green-300">+${inc.amount} <span className="text-xs text-gray-400">({inc.date})</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <select onChange={(e) => setFilterCategory(e.target.value)} className="p-3 border-2 border-green-500 bg-black text-green-400 rounded-xl w-full mb-4">
            <option value="">All Categories</option>
            {Array.from(new Set(expenses.map(exp => exp.category))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" onChange={(e) => setFilterDate(e.target.value)} className="p-3 border-2 border-green-500 bg-black text-green-400 rounded-xl w-full" />
        </div>

        <div className="flex justify-between gap-4 mt-6">
          <button onClick={handleExportPDF} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-semibold">Download PDF</button>
          <button onClick={handleExportExcel} className="flex-1 bg-green-600 hover:bg-green-500 text-black py-3 rounded-xl font-semibold">Download Excel</button>
        </div>

        <motion.ul className="mt-8 max-h-72 overflow-y-auto space-y-3">
          {getFilteredExpenses().map((expense) => (
            <motion.li
              key={expense.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center p-4 bg-black border border-green-500 rounded-xl"
            >
              <span className="text-green-300">{expense.category}: <span className="font-bold text-green-400">${expense.amount}</span> <span className="text-sm text-gray-400">({expense.date})</span></span>
              <div>
                <button onClick={() => editExpense(expense)} className="text-yellow-400 hover:underline font-medium mr-3">Edit</button>
                <button onClick={() => deleteExpense(expense.id)} className="text-red-400 hover:underline font-medium">Delete</button>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <h3 className="text-xl font-bold text-right mt-6">Income: <span className="text-green-400">${totalIncome}</span></h3>
        <h3 className="text-2xl font-bold text-right mt-1">Balance: <span className="text-green-300">${totalIncome - totalExpenses}</span></h3>

        <div className="mt-10 bg-black border border-green-500 p-6 rounded-2xl">
          <h4 className="text-xl font-semibold text-center text-green-400 mb-4">📊 Spending Breakdown</h4>
          <Pie data={getChartData()} />
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
