"use client";

/**
 * Lazy-loaded recharts wrapper.
 * Splitting recharts into its own chunk shaves ~150KB from the initial JS bundle
 * on every page that doesn't need it (dashboard, proposals, treasury, members…).
 */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
};
